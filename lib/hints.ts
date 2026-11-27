import type { Player } from "../data/players";
import { ageOn, type CompareResult } from "./compare";
import { PIE_LABEL, POSITION_LABEL } from "./labels";

/** Botón de pista: ayuda opcional, aparte de las pistas de cada intento. */
export type HintType = "pais" | "club" | "posicion" | "inicial" | "pie" | "edad";

export const MAX_HINTS = 2;
/** Intentos fallidos necesarios para que aparezca el botón. */
export const HINT_MIN_FAILED = 2;
export const PRIMARY_HINTS: HintType[] = ["pais", "club", "posicion"];
export const SECONDARY_HINTS: HintType[] = ["inicial", "pie", "edad"];
export const HINT_TYPES: HintType[] = [...PRIMARY_HINTS, ...SECONDARY_HINTS];

/** Atributo de la comparación que, si salió en verde, ya revela esa pista. */
const REVEALED_BY: Partial<Record<HintType, Exclude<keyof CompareResult, "isCorrect">>> = {
  pais: "nacionalidad",
  club: "club",
  posicion: "posicion",
  pie: "pie",
  edad: "edad",
};

/**
 * Pistas que aún se pueden dar: las del grupo principal que el jugador no acertó en ningún intento
 * ni recibió como pista; si no queda ninguna, las del grupo secundario con el mismo criterio.
 */
export function availableHints(results: CompareResult[], given: HintType[]): HintType[] {
  const discovered = (h: HintType) => {
    const attr = REVEALED_BY[h];
    return given.includes(h) || (!!attr && results.some((r) => r[attr].status === "correct"));
  };
  const primary = PRIMARY_HINTS.filter((h) => !discovered(h));
  return primary.length ? primary : SECONDARY_HINTS.filter((h) => !discovered(h));
}

/** Sortea la siguiente pista, o `null` si ya se usaron todas o no queda nada por revelar. */
export function pickHint(
  results: CompareResult[],
  given: HintType[],
  rand: () => number = Math.random,
): HintType | null {
  if (given.length >= MAX_HINTS) return null;
  const pool = availableHints(results, given);
  if (pool.length === 0) return null;
  return pool[Math.min(Math.floor(rand() * pool.length), pool.length - 1)];
}

export type HintButtonState = "hidden" | "ready" | "none-left" | "ended";

/** Oculto hasta el 2.º intento fallido; deshabilitado al terminar o sin pistas por dar. */
export function hintButtonState({
  failedGuesses,
  hintsUsed,
  remaining,
  over,
}: {
  failedGuesses: number;
  hintsUsed: number;
  /** Pistas que aún se podrían revelar (`availableHints(...).length`). */
  remaining: number;
  over: boolean;
}): HintButtonState {
  if (failedGuesses < HINT_MIN_FAILED) return "hidden";
  if (over) return "ended";
  if (hintsUsed >= MAX_HINTS || remaining === 0) return "none-left";
  return "ready";
}

const PARTICLES = new Set(["de", "del", "di", "da", "das", "do", "dos", "la", "las", "le", "van", "von"]);

/** Inicial del apellido: la última palabra del nombre, o la partícula que la precede ("Di Benedetto" → "D"). */
export function surnameInitial(nombre: string): string {
  const words = nombre.trim().split(/\s+/);
  let i = words.length - 1;
  while (i > 1 && PARTICLES.has(words[i - 1].toLowerCase())) i--;
  return words[i].charAt(0).toLocaleUpperCase("es");
}

/** Rango de 5 años que contiene la edad: 32 → [30, 34]. */
export function ageRange(age: number): [number, number] {
  const from = Math.floor(age / 5) * 5;
  return [from, from + 4];
}

export interface HintText {
  /** Nombre corto del dato: "País", "Club"… */
  label: string;
  /** Dato revelado, tal cual se muestra. */
  value: string;
  /** Frase completa para lectores de pantalla. */
  spoken: string;
}

/** Texto de una pista para el jugador secreto, con la edad calculada a la fecha de la partida. */
export function describeHint(type: HintType, target: Player, dateKey: string): HintText {
  switch (type) {
    case "pais":
      return { label: "País", value: target.nacionalidad, spoken: `el país es ${target.nacionalidad}` };
    case "club":
      return { label: "Club", value: target.club, spoken: `juega en ${target.club}` };
    case "posicion": {
      const pos = POSITION_LABEL[target.posicion];
      return { label: "Posición", value: pos, spoken: `la posición es ${pos.toLowerCase()}` };
    }
    case "inicial": {
      const letter = surnameInitial(target.nombre);
      return { label: "Apellido", value: `Empieza con ${letter}`, spoken: `el apellido empieza con ${letter}` };
    }
    case "pie": {
      const pie = PIE_LABEL[target.pie];
      return { label: "Pie hábil", value: pie, spoken: `el pie hábil es ${pie.toLowerCase()}` };
    }
    case "edad": {
      const [from, to] = ageRange(ageOn(target.fechaNacimiento, dateKey));
      return {
        label: "Edad",
        value: `Entre ${from} y ${to} años`,
        spoken: `tiene entre ${from} y ${to} años`,
      };
    }
  }
}
