import { players, type Player } from "../data/players";

/** Nivel de dificultad: solo cambia de qué jugadores sale el secreto. */
export type Nivel = "facil" | "normal";

export const NIVELES: Nivel[] = ["facil", "normal"];
export const DEFAULT_NIVEL: Nivel = "normal";
export const NIVEL_LABEL: Record<Nivel, string> = { facil: "Fácil", normal: "Normal" };

/**
 * Clubes de los que sale el secreto en Fácil. Se comparan por nombre porque `Player` no guarda
 * `club_id` (en el CSV: universitario, alianza-lima, sporting-cristal, cienciano, melgar).
 */
export const EASY_CLUBS: string[] = ["Universitario", "Alianza Lima", "Sporting Cristal", "Cienciano", "Melgar"];

export function isNivel(value: unknown): value is Nivel {
  return NIVELES.includes(value as Nivel);
}

/** Candidatos a jugador secreto según el nivel. Si Fácil no deja a nadie, cae a Normal (toda la lista). */
export function secretPool(nivel: Nivel, list: Player[] = players, easyClubs: string[] = EASY_CLUBS): Player[] {
  if (nivel === "facil") {
    const pool = list.filter((p) => easyClubs.includes(p.club));
    if (pool.length > 0) return pool;
  }
  return list;
}
