import type { CompareResult, Status } from "./compare";
import { NIVEL_LABEL, type Nivel } from "./difficulty";

export const MAX_GUESSES = 6;
export const ATTRIBUTES = ["club", "nacionalidad", "posicion", "edad", "dorsal", "pie"] as const;

export const EMOJI: Record<Status, string> = { correct: "🟩", close: "🟨", wrong: "⬜" };

export interface ShareInput {
  results: CompareResult[];
  won: boolean;
  /** Puntaje total de la partida. */
  points: number;
  /** Nombre del jugador secreto. */
  targetName: string;
  url: string;
  /** Pistas del botón usadas en la partida. */
  hintsUsed?: number;
  /** Nivel de la partida; solo Fácil se menciona. */
  nivel?: Nivel;
  /** Partida de reto de amigos: agrega la línea del reto y no nombra al jugador. `url` es el link del reto. */
  challenge?: boolean;
}

export const CHALLENGE_LINE = "🏆 Reto de amigos";

/** Frase final con el jugador secreto. */
export function shareSentence(won: boolean, attempts: number, targetName: string): string {
  if (!won) return `No pude adivinar que el jugador era ${targetName}`;
  if (attempts === 1) return `Lo adiviné al primer intento: ${targetName}`;
  return `Me tomó ${attempts} intentos adivinar que el jugador era ${targetName}`;
}

/** Frase final de un reto: el chat es el mismo donde otros van a jugarlo, así que no se nombra al jugador. */
export function challengeSentence(won: boolean, attempts: number): string {
  if (!won) return "No pude adivinar al jugador misterioso";
  if (attempts === 1) return "Lo adiviné al primer intento";
  return `Me tomó ${attempts} intentos adivinar al jugador misterioso`;
}

/** Texto plano para WhatsApp y redes: sin `*`, `_` ni `~` propios, y la URL sola en la última línea. */
export function buildShareText({
  results,
  won,
  points,
  targetName,
  url,
  hintsUsed = 0,
  nivel = "normal",
  challenge = false,
}: ShareInput): string {
  const score = won ? results.length : "X";
  const rows = results.map((r) => ATTRIBUTES.map((a) => EMOJI[r[a].status]).join(""));
  // Las pistas del botón solo se mencionan si se usaron.
  const hints = hintsUsed > 0 ? ` 💡${hintsUsed}` : "";
  const level = nivel === "facil" ? ` · ${NIVEL_LABEL.facil}` : "";
  return [
    `Futbolazo 🇵🇪 ${score}/${MAX_GUESSES}${hints} · ${points} pts${level}`,
    ...(challenge ? [CHALLENGE_LINE] : []),
    "",
    ...rows,
    "",
    challenge ? challengeSentence(won, results.length) : shareSentence(won, results.length, targetName),
    "",
    url,
  ].join("\n");
}
