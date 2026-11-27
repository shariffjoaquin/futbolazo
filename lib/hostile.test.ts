/**
 * Casos hostiles: lo que llega de la URL o de `localStorage` puede venir manipulado. Nada de eso
 * debe romper el juego: se ignora y se juega normal (spec §2.13, CA-71 y CA-72).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { players } from "../data/players";
import { challengeUrl, decodeChallenge, encodeChallenge } from "./challenge";
import { bootGame, isGameOver } from "./game";
import {
  loadChallenge,
  loadGame,
  loadHelpSeen,
  loadNivel,
  loadRecent,
  loadSoundSetting,
  loadStats,
  recordScore,
  saveChallenge,
} from "./storage";

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

const KEYS = ["partida", "recientes", "visto-ayuda", "puntaje", "nivel", "sonido", "retos"].map(
  (k) => `futbolazo:v2:${k}`,
);
const [a, b] = players;
const LIMA_NOON = new Date("2026-11-26T17:00:00Z");
const SCRIPT = '<script>alert("x")</script>';
const HUGE = "x".repeat(2_000_000);

/** Valores crudos que alguien podría dejar en cualquier clave. */
const GARBAGE: string[] = [
  "{no es json",
  "",
  "undefined",
  "NaN",
  "null",
  "true",
  "0",
  "-1",
  "1e400",
  "[]",
  "[[[[[[[[[[",
  JSON.stringify(SCRIPT),
  JSON.stringify(HUGE),
  JSON.stringify({ __proto__: { polluted: true }, constructor: { prototype: { polluted: true } } }),
  '{"__proto__":{"polluted":true}}',
  JSON.stringify([SCRIPT, 1, null, {}]),
  "[".repeat(100_000) + "]".repeat(100_000),
];

beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
afterEach(() => vi.unstubAllGlobals());

/** El juego arranca igual que con `localStorage` vacío: partida normal, válida y sin terminar. */
function expectPlayableBoot(search = "") {
  const boot = bootGame(search, () => 0, LIMA_NOON);
  expect(boot.mode).toBe("normal");
  expect(players.some((p) => p.id === boot.game.targetId)).toBe(true);
  expect(isGameOver(boot.game)).toBe(false);
  return boot;
}

describe("parámetro ?reto= hostil", () => {
  const hostile = [
    SCRIPT,
    encodeURIComponent(SCRIPT),
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "%00%0d%0a",
    "__proto__",
    "constructor",
    "valueOf",
    "../../etc/passwd",
    "😀😀😀😀😀😀😀",
    "x".repeat(100_000),
    "",
  ];

  it.each(hostile)("%#: no es reto válido, se juega normal y se avisa", (value) => {
    const boot = expectPlayableBoot(`?reto=${value}`);
    expect(boot).toMatchObject({ invalidChallenge: true });
  });

  it("un código válido rodeado de etiquetas no se acepta a medias", () => {
    const code = encodeChallenge(a.id, "normal");
    // Al normalizar, lo que no es [0-9a-z] se quita; las letras de la etiqueta cambian el código.
    expect(decodeChallenge(`<b>${code}</b>`)).toBeNull();
    expect(decodeChallenge(`${code}<script>`)).toBeNull();
  });

  it("con dos ?reto= se usa el primero", () => {
    const code = encodeChallenge(b.id, "normal");
    const boot = bootGame(`?reto=${code}&reto=${SCRIPT}`, () => 0, LIMA_NOON);
    expect(boot.mode).toBe("challenge");
    expect(boot.game.targetId).toBe(b.id);
  });

  it("una cadena enorme se descarta rápido", () => {
    const start = performance.now();
    expect(decodeChallenge("a".repeat(5_000_000))).toBeNull();
    expect(performance.now() - start).toBeLessThan(500);
  });

  it("el link de reto que se comparte no arrastra parámetros ni fragmentos de la URL actual", () => {
    const code = encodeChallenge(a.id, "facil");
    const url = challengeUrl(`https://futbolazo.pe/?x=${encodeURIComponent(SCRIPT)}#${SCRIPT}`, code);
    expect(url).toBe(`https://futbolazo.pe/?reto=${code}`);
  });
});

describe("localStorage manipulado", () => {
  it.each(GARBAGE.map((g, i) => [i, g] as const))("%i: con basura en todas las claves se juega normal", (_, raw) => {
    for (const key of KEYS) localStorage.setItem(key, raw);
    expect(loadGame()).toBeNull();
    expect(loadRecent()).toEqual([]);
    expect(loadHelpSeen()).toBe(raw === "true");
    expect(loadStats("normal")).toEqual({ mejor: 0, total: 0 });
    expect(loadStats("facil")).toEqual({ mejor: 0, total: 0 });
    expect(loadNivel()).toBe("normal");
    expect(loadSoundSetting()).toBe("default");
    expectPlayableBoot();
    // Ni el JSON con `__proto__` contamina los objetos.
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  describe("partida con tipos incorrectos", () => {
    const base = { targetId: a.id, guesses: [], fecha: "2026-11-26", hints: [], nivel: "normal" };
    const set = (game: object) => localStorage.setItem("futbolazo:v2:partida", JSON.stringify(game));

    it.each([
      ["targetId número", { targetId: 1 }],
      ["targetId con script", { targetId: SCRIPT }],
      ["targetId enorme", { targetId: HUGE }],
      ["targetId de prototipo", { targetId: "__proto__" }],
      ["fecha número", { fecha: 20261126 }],
      ["fecha con script", { fecha: SCRIPT }],
      ["fecha imposible (mes 13)", { fecha: "2026-13-01" }],
      ["fecha imposible (30 de febrero)", { fecha: "2026-02-30" }],
      ["fecha 0000-00-00", { fecha: "0000-00-00" }],
      ["fecha con hora", { fecha: "2026-11-26T00:00:00Z" }],
    ])("%s: se descarta", (_, change) => {
      set({ ...base, ...change });
      expect(loadGame()).toBeNull();
      expectPlayableBoot();
    });

    it("intentos, pistas y nivel inválidos se limpian sin descartar la partida", () => {
      set({
        ...base,
        guesses: [SCRIPT, 42, null, { id: b.id }, b.id, b.id, HUGE],
        hints: [SCRIPT, "club", "club", 7, "pais"],
        nivel: SCRIPT,
      });
      expect(loadGame()).toEqual({ ...base, guesses: [b.id], hints: ["club", "pais"], nivel: "normal" });
    });

    it.each([
      ["guesses texto", { guesses: SCRIPT }],
      ["guesses objeto", { guesses: { 0: b.id, length: 1 } }],
      ["hints texto", { hints: "club" }],
      ["hints objeto", { hints: { club: true } }],
    ])("%s: se cargan vacíos", (_, change) => {
      set({ ...base, ...change });
      expect(loadGame()).toMatchObject({ guesses: [], hints: [] });
    });

    it("más de 6 intentos se recortan a 6", () => {
      set({ ...base, guesses: players.slice(1, 20).map((p) => p.id) });
      expect(loadGame()?.guesses).toHaveLength(6);
    });
  });

  it("récords con tipos o valores imposibles quedan en cero, y se puede seguir sumando", () => {
    for (const stats of [
      { normal: { mejor: "1000", total: 5 } },
      { normal: { mejor: -5, total: 10 } },
      { normal: { mejor: 1.5, total: 10 } },
      { normal: { mejor: Number.MAX_SAFE_INTEGER + 2, total: 0 } },
      { normal: [1000, 2000] },
      { mejor: SCRIPT, total: SCRIPT },
    ]) {
      localStorage.setItem("futbolazo:v2:puntaje", JSON.stringify(stats));
      expect(loadStats("normal")).toEqual({ mejor: 0, total: 0 });
    }
    expect(recordScore(400, "normal")).toEqual({ mejor: 400, total: 400 });
  });

  it("nivel y sonido solo aceptan sus valores exactos", () => {
    for (const value of ["Facil", "FACIL", " facil", SCRIPT, 1, ["facil"]]) {
      localStorage.setItem("futbolazo:v2:nivel", JSON.stringify(value));
      expect(loadNivel()).toBe("normal");
    }
    for (const value of ["ON", "true", true, 1, SCRIPT, ["on"]]) {
      localStorage.setItem("futbolazo:v2:sonido", JSON.stringify(value));
      expect(loadSoundSetting()).toBe("default");
    }
  });

  describe("retos guardados", () => {
    const code = encodeChallenge(b.id, "facil");
    const challenge = { code, targetId: b.id, nivel: "facil" as const };
    const game = { targetId: b.id, guesses: [a.id], fecha: "2026-11-26", hints: [], nivel: "facil" as const };

    it("una partida de reto manipulada se descarta y el reto empieza de cero", () => {
      for (const saved of [SCRIPT, [game], { ...game, targetId: a.id }, { ...game, fecha: "2026-02-30" }]) {
        localStorage.setItem("futbolazo:v2:retos", JSON.stringify({ [code]: saved }));
        expect(loadChallenge(code, challenge)).toBeNull();
        const boot = bootGame(`?reto=${code}`, () => 0, LIMA_NOON);
        expect(boot.mode).toBe("challenge");
        expect(boot.game.guesses).toEqual([]);
      }
    });

    it("con basura al lado, guardar un reto conserva solo 30 y no contamina objetos", () => {
      const junk = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`junk${i}`, SCRIPT]));
      localStorage.setItem("futbolazo:v2:retos", '{"__proto__":{"polluted":true},' + JSON.stringify(junk).slice(1));
      saveChallenge(code, game);
      const stored = JSON.parse(localStorage.getItem("futbolazo:v2:retos")!);
      expect(Object.keys(stored)).toHaveLength(30);
      expect(loadChallenge(code, challenge)?.guesses).toEqual([a.id]);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  it("si localStorage lanza errores al leer y escribir, se juega igual", () => {
    const broken = memoryStorage();
    broken.getItem = () => {
      throw new Error("SecurityError");
    };
    broken.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    vi.stubGlobal("localStorage", broken);
    expectPlayableBoot();
    expect(() => recordScore(100, "facil")).not.toThrow();
  });
});
