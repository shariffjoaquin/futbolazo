import { players, type Player } from "../data/players";

export const TIME_ZONE = "America/Lima";
/** Día del puzzle #1 (en hora de Lima). */
export const LAUNCH_DATE = "2026-11-26";

const MS_PER_DAY = 86_400_000;

/** Fecha actual en Lima como "YYYY-MM-DD". */
export function getLimaDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** Número de puzzle (#) para una fecha de Lima. El día de lanzamiento es #1. */
export function getPuzzleNumber(dateKey: string): number {
  return dayNumber(dateKey) - dayNumber(LAUNCH_DATE) + 1;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledIndices(count: number, cycle: number): number[] {
  const rand = mulberry32(Math.imul(cycle, 2654435761) ^ 0x5f3759df);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * Cada bloque de `count` días es una permutación de todos los jugadores, así no
 * se repite ninguno dentro del ciclo. Si un ciclo empezaría con el mismo jugador
 * con el que terminó el anterior, se intercambian sus dos primeros.
 */
function cycleOrder(count: number, cycle: number): number[] {
  const order = shuffledIndices(count, cycle);
  if (count >= 3 && order[0] === shuffledIndices(count, cycle - 1)[count - 1]) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

export function getDailyIndex(dateKey: string, count: number = players.length): number {
  const day = getPuzzleNumber(dateKey) - 1;
  const cycle = Math.floor(day / count);
  const pos = ((day % count) + count) % count;
  return cycleOrder(count, cycle)[pos];
}

export function getDailyPlayer(dateKey: string, list: Player[] = players): Player {
  return list[getDailyIndex(dateKey, list.length)];
}
