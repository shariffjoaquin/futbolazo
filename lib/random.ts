import { players, type Player } from "../data/players";

/** Cuántos jugadores sorteados recientemente se evitan al empezar una partida. */
export const RECENT_LIMIT = 10;

/**
 * Jugador al azar que no esté entre los últimos sorteados. Con pocos jugadores no se
 * pueden evitar `RECENT_LIMIT`: se evitan los últimos `N - 1` para que siempre quede uno.
 */
export function pickRandomPlayer(
  recentIds: string[],
  list: Player[] = players,
  rand: () => number = Math.random,
): Player {
  const avoidCount = Math.min(RECENT_LIMIT, list.length - 1);
  const avoid = new Set(avoidCount > 0 ? recentIds.slice(-avoidCount) : []);
  const pool = list.filter((p) => !avoid.has(p.id));
  return pool[Math.min(Math.floor(rand() * pool.length), pool.length - 1)];
}

/** Agrega `id` como el más reciente, sin duplicados, y se queda con los últimos `RECENT_LIMIT`. */
export function addRecent(recentIds: string[], id: string): string[] {
  return [...recentIds.filter((r) => r !== id), id].slice(-RECENT_LIMIT);
}
