import { describe, expect, it } from "vitest";
import type { CompareResult, Status } from "./compare";
import { MAX_HINTS } from "./hints";
import {
  addScore,
  CATEGORY_POINTS,
  computeScore,
  EMPTY_STATS,
  formatPoints,
  MAX_LOSS_SCORE,
  MAX_WIN_SCORE,
  WIN_BASE,
  type Attribute,
} from "./score";
import { ATTRIBUTES, MAX_GUESSES } from "./share";

/** Resultado de un intento: todo gris salvo lo indicado. */
function res(statuses: Partial<Record<Attribute, Status>> = {}, isCorrect = false): CompareResult {
  const r = Object.fromEntries(ATTRIBUTES.map((a) => [a, { status: statuses[a] ?? "wrong" }]));
  return { ...(r as Omit<CompareResult, "isCorrect">), isCorrect };
}
const allGreen = Object.fromEntries(ATTRIBUTES.map((a) => [a, "correct"])) as Record<Attribute, Status>;
const hit = () => res(allGreen, true);
/** Partida ganada en el intento `n`. */
const wonIn = (n: number) => [...Array.from({ length: n - 1 }, () => res()), hit()];

describe("computeScore al ganar", () => {
  const expected: Record<number, [number, number, number]> = {
    // intento: [0 pistas, 1 pista, 2 pistas]
    1: [1200, 1100, 1000],
    2: [1050, 950, 850],
    3: [900, 800, 700],
    4: [750, 650, 550],
    5: [600, 500, 400],
    6: [450, 350, 250],
  };

  for (let attempt = 1; attempt <= MAX_GUESSES; attempt++) {
    it(`en el intento ${attempt} con 0, 1 y 2 pistas`, () => {
      [0, 1, 2].forEach((hints) => {
        const score = computeScore(wonIn(attempt), hints);
        expect(score).toEqual({
          won: true,
          attempt,
          base: WIN_BASE[attempt - 1],
          unusedHints: 2 - hints,
          hintBonus: (2 - hints) * 100,
          total: expected[attempt][hints],
        });
      });
    });
  }

  it("tope de 1200 al primer intento sin pistas", () => {
    expect(MAX_WIN_SCORE).toBe(1200);
    expect(computeScore(wonIn(1), 0).total).toBe(MAX_WIN_SCORE);
  });

  it("los parciales de los intentos fallidos no suman al ganar", () => {
    const results = [res({ club: "correct", edad: "close" }), hit()];
    expect(computeScore(results, MAX_HINTS).total).toBe(850);
  });
});

describe("computeScore al perder", () => {
  it("toma el mejor resultado de cada categoría entre todos los intentos", () => {
    const results = [
      res({ club: "correct", posicion: "close" }),
      res({ posicion: "correct", edad: "close" }),
      res({ edad: "close", dorsal: "close" }),
      res(),
      res({ club: "wrong" }),
      res({ dorsal: "close" }),
    ];
    const score = computeScore(results, 0);
    expect(score.won).toBe(false);
    if (score.won) return;
    expect(score.categories).toEqual([
      { attr: "club", status: "correct", points: 40 },
      { attr: "nacionalidad", status: "wrong", points: 0 },
      { attr: "posicion", status: "correct", points: 40 },
      { attr: "edad", status: "close", points: 20 },
      { attr: "dorsal", status: "close", points: 20 },
      { attr: "pie", status: "wrong", points: 0 },
    ]);
    expect(score.total).toBe(120);
  });

  it("sin bonus por pistas: las pistas sin usar no suman", () => {
    const results = Array.from({ length: 6 }, () => res({ pie: "correct" }));
    expect(computeScore(results, 0).total).toBe(40);
    expect(computeScore(results, 2).total).toBe(40);
  });

  it("las pistas del botón no cuentan como acierto de categoría", () => {
    // Aunque el país se haya dado como pista, sin verde en los intentos vale 0.
    const results = Array.from({ length: 6 }, () => res({ club: "correct" }));
    const score = computeScore(results, 2);
    if (score.won) throw new Error("debía perder");
    expect(score.categories.find((c) => c.attr === "nacionalidad")?.points).toBe(0);
    expect(score.total).toBe(40);
  });

  it("seis intentos todo gris dan 0", () => {
    expect(computeScore(Array.from({ length: 6 }, () => res()), 0).total).toBe(0);
  });

  it("tope de 240, siempre menos que la peor victoria (250)", () => {
    // Todo verde sin acertar al jugador (otro con los mismos datos).
    const results = Array.from({ length: 6 }, () => res(allGreen));
    expect(computeScore(results, 0).total).toBe(240);
    expect(MAX_LOSS_SCORE).toBe(240);
    expect(MAX_LOSS_SCORE).toBe(ATTRIBUTES.length * CATEGORY_POINTS.correct);
    expect(MAX_LOSS_SCORE).toBeLessThan(computeScore(wonIn(6), 2).total);
  });
});

describe("récords", () => {
  it("addScore guarda el mejor y acumula el total", () => {
    let stats = addScore(EMPTY_STATS, 650);
    expect(stats).toEqual({ mejor: 650, total: 650 });
    stats = addScore(stats, 120);
    expect(stats).toEqual({ mejor: 650, total: 770 });
    stats = addScore(stats, 1200);
    expect(stats).toEqual({ mejor: 1200, total: 1970 });
    stats = addScore(stats, 0);
    expect(stats).toEqual({ mejor: 1200, total: 1970 });
  });

  it("formatPoints usa separador de miles", () => {
    expect(formatPoints(250)).toBe("250");
    expect(formatPoints(15400)).toBe("15,400");
  });
});
