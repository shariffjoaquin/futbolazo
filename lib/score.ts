import type { CompareResult, Status } from "./compare";
import { MAX_HINTS } from "./hints";
import { ATTRIBUTES } from "./share";

export type Attribute = (typeof ATTRIBUTES)[number];

/** Base al ganar según el intento en que se acierta (índice 0 = primer intento). */
export const WIN_BASE = [1000, 850, 700, 550, 400, 250] as const;
/** Bonus al ganar por cada pista del botón que no se usó. */
export const UNUSED_HINT_BONUS = 100;
/** Puntos por categoría al perder, según el mejor resultado en cualquier intento. */
export const CATEGORY_POINTS: Record<Status, number> = { correct: 40, close: 20, wrong: 0 };

export const MAX_WIN_SCORE = WIN_BASE[0] + MAX_HINTS * UNUSED_HINT_BONUS;
export const MAX_LOSS_SCORE = ATTRIBUTES.length * CATEGORY_POINTS.correct;

export interface CategoryScore {
  attr: Attribute;
  /** Mejor resultado de la categoría entre todos los intentos. */
  status: Status;
  points: number;
}

export type ScoreBreakdown =
  | { won: true; attempt: number; base: number; unusedHints: number; hintBonus: number; total: number }
  | { won: false; categories: CategoryScore[]; total: number };

const RANK: Record<Status, number> = { wrong: 0, close: 1, correct: 2 };

/**
 * Puntaje de una partida terminada. Se gana si algún intento es el jugador secreto.
 * Las pistas del botón solo cuentan para el bonus: no suman como acierto de categoría.
 */
export function computeScore(results: CompareResult[], hintsUsed: number): ScoreBreakdown {
  const hit = results.findIndex((r) => r.isCorrect);
  if (hit >= 0) {
    const base = WIN_BASE[Math.min(hit, WIN_BASE.length - 1)];
    const unusedHints = Math.max(0, MAX_HINTS - hintsUsed);
    const hintBonus = unusedHints * UNUSED_HINT_BONUS;
    return { won: true, attempt: hit + 1, base, unusedHints, hintBonus, total: base + hintBonus };
  }
  const categories = ATTRIBUTES.map((attr): CategoryScore => {
    const status = results.reduce<Status>(
      (best, r) => (RANK[r[attr].status] > RANK[best] ? r[attr].status : best),
      "wrong",
    );
    return { attr, status, points: CATEGORY_POINTS[status] };
  });
  return { won: false, categories, total: categories.reduce((sum, c) => sum + c.points, 0) };
}

/** Récords guardados: mejor puntaje de una partida y suma de todas las partidas terminadas. */
export interface ScoreStats {
  mejor: number;
  total: number;
}

export const EMPTY_STATS: ScoreStats = { mejor: 0, total: 0 };

export function addScore(stats: ScoreStats, points: number): ScoreStats {
  return { mejor: Math.max(stats.mejor, points), total: stats.total + points };
}

/** Cifra con separador de miles para la pantalla ("15,400"). */
export function formatPoints(points: number): string {
  return new Intl.NumberFormat("es-PE").format(points);
}
