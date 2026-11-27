import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSoundEngine, getSoundSetting, MASTER_VOLUME, setSoundSetting, type AudioContextLike, type EngineDeps } from "./audio";
import { SOUNDS } from "./sounds";
import { loadSoundSetting, saveSoundSetting } from "./storage";

/** AudioContext simulado: registra osciladores y su programación. */
function fakeContext(state: AudioContextState = "running") {
  const oscillators: { type: string; freq: number; start?: number; stop?: number }[] = [];
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const ctx = {
    currentTime: 10,
    state,
    destination: {},
    resume: vi.fn(async () => {
      ctx.state = "running";
    }),
    createGain: vi.fn(() => ({ gain: param(), connect: vi.fn() })),
    createOscillator: vi.fn(() => {
      const o = { type: "", freq: 0 } as (typeof oscillators)[number];
      oscillators.push(o);
      return {
        set type(t: string) {
          o.type = t;
        },
        frequency: {
          set value(v: number) {
            o.freq = v;
          },
        },
        connect: vi.fn(),
        start: (t: number) => (o.start = t),
        stop: (t: number) => (o.stop = t),
      };
    }),
  };
  return { ctx: ctx as unknown as AudioContextLike & { state: AudioContextState }, raw: ctx, oscillators };
}

function deps(over: Partial<EngineDeps> = {}) {
  const fake = fakeContext();
  const timers: { fn: () => void; ms: number }[] = [];
  const d: EngineDeps = {
    createContext: vi.fn(() => fake.ctx),
    vibrate: vi.fn(),
    setTimer: (fn, ms) => timers.push({ fn, ms }),
    ...over,
  };
  return { d, fake, timers };
}

describe("motor de sonido", () => {
  it("no crea el AudioContext al construirse ni al pedir un sonido sin gesto", () => {
    const { d, fake } = deps();
    const engine = createSoundEngine(d);
    engine.play("ganar");
    expect(d.createContext).not.toHaveBeenCalled();
    expect(fake.oscillators).toHaveLength(0);
  });

  it("unlock crea el contexto una sola vez con volumen maestro bajo", () => {
    const { d, fake } = deps();
    const engine = createSoundEngine(d);
    engine.unlock();
    engine.unlock();
    expect(d.createContext).toHaveBeenCalledTimes(1);
    const master = fake.raw.createGain.mock.results[0].value;
    expect(master.gain.value).toBe(MASTER_VOLUME);
    expect(MASTER_VOLUME).toBeLessThanOrEqual(0.3);
  });

  it("unlock reanuda un contexto suspendido", () => {
    const fake = fakeContext("suspended");
    const engine = createSoundEngine({ ...deps().d, createContext: () => fake.ctx });
    engine.unlock();
    expect(fake.raw.resume).toHaveBeenCalledTimes(1);
  });

  it("play programa una nota por cada nota del sonido, en el momento indicado", () => {
    const { d, fake } = deps();
    const engine = createSoundEngine(d);
    engine.unlock();
    engine.play("ganar", 1);
    expect(fake.oscillators).toHaveLength(SOUNDS.ganar.length);
    fake.oscillators.forEach((o, i) => {
      expect(o.freq).toBe(SOUNDS.ganar[i].freq);
      expect(o.start).toBeCloseTo(10 + 1 + SOUNDS.ganar[i].start);
    });
  });

  it("sin Web Audio no pasa nada", () => {
    const engine = createSoundEngine({ ...deps().d, createContext: () => null });
    expect(() => {
      engine.unlock();
      engine.play("pista");
    }).not.toThrow();
  });

  it("si crear el contexto falla, no rompe", () => {
    const engine = createSoundEngine({
      ...deps().d,
      createContext: () => {
        throw new Error("no permitido");
      },
    });
    expect(() => {
      engine.unlock();
      engine.play("pista");
    }).not.toThrow();
  });

  it("vibra en el momento indicado; sin navigator.vibrate o si falla, no da error", () => {
    const { d, timers } = deps();
    const engine = createSoundEngine(d);
    engine.vibrate([60]);
    expect(d.vibrate).toHaveBeenCalledWith([60]);
    engine.vibrate([40, 70, 40], 1.02);
    expect(timers[0].ms).toBeCloseTo(1020);
    timers[0].fn();
    expect(d.vibrate).toHaveBeenLastCalledWith([40, 70, 40]);

    expect(() => createSoundEngine({ ...d, vibrate: undefined }).vibrate([60])).not.toThrow();
    const throwing = createSoundEngine({
      ...d,
      vibrate: () => {
        throw new Error("bloqueado");
      },
    });
    expect(() => throwing.vibrate([60])).not.toThrow();
  });

  it("run ejecuta sonidos y vibración del plan", () => {
    const { d, fake } = deps();
    const engine = createSoundEngine(d);
    engine.unlock();
    engine.run({ sounds: [{ sound: "fallo", at: 0 }, { sound: "verde", at: 0.2 }], vibration: { pattern: [60], at: 0 } });
    expect(fake.oscillators).toHaveLength(SOUNDS.fallo.length + SOUNDS.verde.length);
    expect(d.vibrate).toHaveBeenCalledWith([60]);
  });
});

/** localStorage en memoria. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe("ajuste de sonido", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("por defecto 'default'; se guarda 'on' / 'off'", () => {
    expect(loadSoundSetting()).toBe("default");
    saveSoundSetting("off");
    expect(localStorage.getItem("futbolazo:v2:sonido")).toBe('"off"');
    expect(loadSoundSetting()).toBe("off");
    saveSoundSetting("on");
    expect(loadSoundSetting()).toBe("on");
    saveSoundSetting("default");
    expect(localStorage.getItem("futbolazo:v2:sonido")).toBeNull();
  });

  it("valores no válidos → 'default'", () => {
    localStorage.setItem("futbolazo:v2:sonido", '"fuerte"');
    expect(loadSoundSetting()).toBe("default");
  });

  it("el ajuste en memoria funciona aunque localStorage esté bloqueado", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
      removeItem: () => {
        throw new Error("bloqueado");
      },
    });
    expect(() => setSoundSetting("off")).not.toThrow();
    expect(getSoundSetting()).toBe("off");
    setSoundSetting("on");
    expect(getSoundSetting()).toBe("on");
  });
});
