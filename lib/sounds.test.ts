import { describe, expect, it } from "vitest";
import type { CompareResult, Status } from "./compare";
import { ATTRIBUTES } from "./share";
import {
  ANIMATION_SOUNDS,
  feedbackPolicy,
  planGuess,
  planHint,
  soundLength,
  SOUNDS,
  VIBRATION,
  type FeedbackPolicy,
  type SoundName,
} from "./sounds";

const TIMING = { stagger: 0.12, duration: 0.42 };
const ROW_END = 0.12 * 5 + 0.42;
const ALL: FeedbackPolicy = { sound: true, animationSounds: true, vibration: true };

function row(statuses: Status[], isCorrect = false): CompareResult {
  const r = Object.fromEntries(ATTRIBUTES.map((a, i) => [a, { status: statuses[i] }]));
  return { ...(r as Omit<CompareResult, "isCorrect">), isCorrect };
}
const grey = row(["wrong", "wrong", "wrong", "wrong", "wrong", "wrong"]);
const mixed = row(["correct", "wrong", "close", "wrong", "close", "wrong"]);
const yellowOnly = row(["wrong", "close", "wrong", "wrong", "wrong", "wrong"]);
const hit = row(["correct", "correct", "correct", "correct", "correct", "correct"], true);
const names = (plan: ReturnType<typeof planGuess>) => plan.sounds.map((s) => s.sound);

describe("definición de sonidos", () => {
  it("cada evento tiene notas válidas", () => {
    for (const [name, notes] of Object.entries(SOUNDS)) {
      expect(notes.length, name).toBeGreaterThan(0);
      for (const n of notes) {
        expect(n.freq).toBeGreaterThan(20);
        expect(n.duration).toBeGreaterThan(0);
        expect(n.gain).toBeGreaterThan(0);
        expect(n.gain).toBeLessThanOrEqual(1);
      }
    }
  });

  it("ganar es una melodía ascendente de 1 segundo", () => {
    const freqs = SOUNDS.ganar.map((n) => n.freq);
    expect(freqs).toEqual([...freqs].sort((a, b) => a - b));
    expect(new Set(freqs).size).toBe(freqs.length);
    expect(soundLength("ganar")).toBeCloseTo(1, 5);
  });

  it("perder son dos tonos descendentes", () => {
    expect(SOUNDS.perder).toHaveLength(2);
    expect(SOUNDS.perder[0].freq).toBeGreaterThan(SOUNDS.perder[1].freq);
  });

  it("fallo es un tono bajo corto; verde más agudo que amarillo; volteo un tick muy corto y suave", () => {
    expect(SOUNDS.fallo[0].freq).toBeLessThan(250);
    expect(soundLength("fallo")).toBeLessThanOrEqual(0.25);
    expect(SOUNDS.verde[0].freq).toBeGreaterThan(SOUNDS.amarillo[0].freq);
    expect(soundLength("volteo")).toBeLessThanOrEqual(0.05);
    const loudest = (s: SoundName) => Math.max(...SOUNDS[s].map((n) => n.gain));
    expect(loudest("volteo")).toBeLessThan(loudest("verde"));
  });
});

describe("feedbackPolicy", () => {
  it("por defecto: todo, salvo con movimiento reducido (sin vibración ni sonidos de animación)", () => {
    expect(feedbackPolicy("default", false)).toEqual(ALL);
    expect(feedbackPolicy("default", true)).toEqual({ sound: true, animationSounds: false, vibration: false });
  });

  it("activado a mano: todo, aunque haya movimiento reducido", () => {
    expect(feedbackPolicy("on", true)).toEqual(ALL);
    expect(feedbackPolicy("on", false)).toEqual(ALL);
  });

  it("silenciado: nada", () => {
    for (const rm of [true, false]) {
      expect(feedbackPolicy("off", rm)).toEqual({ sound: false, animationSounds: false, vibration: false });
    }
  });
});

describe("planGuess con volteo", () => {
  it("tick escalonado por celda, verde/amarillo al mostrarse, fallo al terminar la fila", () => {
    const plan = planGuess(mixed, "fallo", ALL, true, TIMING);
    const ticks = plan.sounds.filter((s) => s.sound === "volteo").map((s) => s.at);
    expect(ticks).toHaveLength(6);
    ticks.forEach((at, i) => expect(at).toBeCloseTo(i * 0.12));
    expect(plan.sounds.filter((s) => s.sound === "verde").map((s) => s.at)).toEqual([expect.closeTo(0.252)]);
    expect(plan.sounds.filter((s) => s.sound === "amarillo")).toHaveLength(2);
    expect(plan.sounds.at(-1)).toEqual({ sound: "fallo", at: expect.closeTo(ROW_END) });
  });

  it("celdas grises: solo el tick", () => {
    expect(names(planGuess(grey, "fallo", ALL, true, TIMING))).toEqual([...Array(6).fill("volteo"), "fallo"]);
  });

  it("cada sonido de celda llega después de su tick y antes del final de la fila", () => {
    const plan = planGuess(mixed, "fallo", ALL, true, TIMING);
    for (const s of plan.sounds.filter((x) => x.sound === "verde" || x.sound === "amarillo")) {
      expect(s.at).toBeGreaterThan(0);
      expect(s.at).toBeLessThan(ROW_END);
    }
  });

  it("ganar: melodía al terminar la fila y vibración larga", () => {
    const plan = planGuess(hit, "ganar", ALL, true, TIMING);
    expect(plan.sounds.at(-1)).toEqual({ sound: "ganar", at: expect.closeTo(ROW_END) });
    expect(names(plan)).not.toContain("fallo");
    expect(plan.vibration).toEqual({ pattern: VIBRATION.ganar, at: expect.closeTo(ROW_END) });
  });

  it("perder: dos tonos en lugar del fallo", () => {
    const plan = planGuess(grey, "perder", ALL, true, TIMING);
    expect(names(plan)).toContain("perder");
    expect(names(plan)).not.toContain("fallo");
  });
});

describe("vibración", () => {
  it("corta al fallar sin verdes, doble con alguna categoría en verde, larga al ganar", () => {
    expect(planGuess(grey, "fallo", ALL, true, TIMING).vibration?.pattern).toEqual(VIBRATION.fallo);
    expect(planGuess(yellowOnly, "fallo", ALL, true, TIMING).vibration?.pattern).toEqual(VIBRATION.fallo);
    expect(planGuess(mixed, "fallo", ALL, true, TIMING).vibration?.pattern).toEqual(VIBRATION.acierto);
    expect(planGuess(hit, "ganar", ALL, true, TIMING).vibration?.pattern).toEqual(VIBRATION.ganar);
  });

  it("patrones: corto < doble < largo", () => {
    const total = (p: readonly number[]) => p.reduce((a, b) => a + b, 0);
    expect(VIBRATION.fallo).toHaveLength(1);
    expect(VIBRATION.acierto.filter((_, i) => i % 2 === 0)).toHaveLength(2);
    expect(total(VIBRATION.fallo)).toBeLessThan(total(VIBRATION.acierto));
    expect(total(VIBRATION.acierto)).toBeLessThan(total(VIBRATION.ganar));
  });
});

describe("planGuess sin volteo (movimiento reducido)", () => {
  it("un solo sonido de celda, el mejor de la fila, y luego el resultado", () => {
    expect(names(planGuess(mixed, "fallo", ALL, false, TIMING))).toEqual(["verde", "fallo"]);
    expect(names(planGuess(yellowOnly, "fallo", ALL, false, TIMING))).toEqual(["amarillo", "fallo"]);
    expect(names(planGuess(grey, "perder", ALL, false, TIMING))).toEqual(["perder"]);
    expect(names(planGuess(hit, "ganar", ALL, false, TIMING))).toEqual(["ganar"]);
  });

  it("no suenan a la vez: el resultado va después del sonido de celda", () => {
    const [cell, outcome] = planGuess(mixed, "fallo", ALL, false, TIMING).sounds;
    expect(outcome.at).toBeGreaterThan(cell.at);
  });

  it("con el ajuste por defecto y movimiento reducido: sin tick ni vibración, el resto suena", () => {
    const policy = feedbackPolicy("default", true);
    const plan = planGuess(mixed, "fallo", policy, false, TIMING);
    expect(names(plan)).toEqual(["verde", "fallo"]);
    expect(plan.vibration).toBeNull();
    // Aunque la fila se animara, el tick se calla.
    expect(names(planGuess(mixed, "fallo", policy, true, TIMING))).not.toContain("volteo");
  });

  it("activado a mano con movimiento reducido: sí vibra", () => {
    expect(planGuess(mixed, "fallo", feedbackPolicy("on", true), false, TIMING).vibration).not.toBeNull();
  });
});

describe("silenciado y pista", () => {
  it("silenciado: ningún sonido ni vibración", () => {
    const off = feedbackPolicy("off", false);
    expect(planGuess(hit, "ganar", off, true, TIMING)).toEqual({ sounds: [], vibration: null });
    expect(planHint(off)).toEqual({ sounds: [], vibration: null });
  });

  it("pista: campanita sin vibración", () => {
    expect(planHint(ALL)).toEqual({ sounds: [{ sound: "pista", at: 0 }], vibration: null });
    expect(planHint(feedbackPolicy("default", true)).sounds).toEqual([{ sound: "pista", at: 0 }]);
  });

  it("solo el volteo es sonido de animación", () => {
    expect([...ANIMATION_SOUNDS]).toEqual(["volteo"]);
  });
});
