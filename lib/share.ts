import type { CompareResult, Status } from "./compare";

export const MAX_GUESSES = 6;
export const ATTRIBUTES = ["club", "nacionalidad", "posicion", "edad", "dorsal", "pie"] as const;

const EMOJI: Record<Status, string> = { correct: "🟩", close: "🟨", wrong: "⬜" };

export function buildShareText(results: CompareResult[], won: boolean, url: string): string {
  const score = won ? results.length : "X";
  const rows = results.map((r) => ATTRIBUTES.map((a) => EMOJI[r[a].status]).join(""));
  return [`Futbolazo 🇵🇪 ${score}/${MAX_GUESSES}`, "", ...rows, "", url].join("\n");
}
