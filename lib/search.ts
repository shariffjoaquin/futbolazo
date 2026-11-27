import type { Player } from "../data/players";

/** Largo máximo de la búsqueda: el nombre más largo de la lista tiene 22 caracteres. */
export const MAX_QUERY_LENGTH = 40;

/** Sin tildes ni mayúsculas, para que "rondon" encuentre a "Rondón". */
export function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** Jugadores cuyo nombre contiene la búsqueda, sin los ya intentados. La búsqueda se recorta al máximo. */
export function searchPlayers(query: string, exclude: readonly string[], list: readonly Player[]): Player[] {
  const q = normalizeName(query.slice(0, MAX_QUERY_LENGTH));
  if (!q) return [];
  return list.filter((p) => !exclude.includes(p.id) && normalizeName(p.nombre).includes(q));
}
