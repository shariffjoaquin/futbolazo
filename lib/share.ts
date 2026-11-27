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
}

/** Frase final con el jugador secreto. */
export function shareSentence(won: boolean, attempts: number, targetName: string): string {
  if (!won) return `No pude adivinar que el jugador era ${targetName}`;
  if (attempts === 1) return `Lo adiviné al primer intento: ${targetName}`;
  return `Me tomó ${attempts} intentos adivinar que el jugador era ${targetName}`;
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
}: ShareInput): string {
  const score = won ? results.length : "X";
  const rows = results.map((r) => ATTRIBUTES.map((a) => EMOJI[r[a].status]).join(""));
  // Las pistas del botón solo se mencionan si se usaron.
  const hints = hintsUsed > 0 ? ` 💡${hintsUsed}` : "";
  const level = nivel === "facil" ? ` · ${NIVEL_LABEL.facil}` : "";
  return [
    `Futbolazo 🇵🇪 ${score}/${MAX_GUESSES}${hints} · ${points} pts${level}`,
    "",
    ...rows,
    "",
    shareSentence(won, results.length, targetName),
    "",
    url,
  ].join("\n");
}
