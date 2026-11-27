import type { CompareResult, Status } from "./compare";

export const MAX_GUESSES = 6;
export const ATTRIBUTES = ["club", "nacionalidad", "posicion", "edad", "dorsal", "pie"] as const;

export const EMOJI: Record<Status, string> = { correct: "🟩", close: "🟨", wrong: "⬜" };

export function buildShareText(results: CompareResult[], won: boolean, url: string, hintsUsed = 0): string {
  const score = won ? results.length : "X";
  const rows = results.map((r) => ATTRIBUTES.map((a) => EMOJI[r[a].status]).join(""));
  // Las pistas del botón solo se mencionan si se usaron.
  const hints = hintsUsed > 0 ? ` 💡${hintsUsed}` : "";
  return [`Futbolazo 🇵🇪 ${score}/${MAX_GUESSES}${hints}`, "", ...rows, "", url].join("\n");
}
