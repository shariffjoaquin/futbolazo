import { players, type Player } from "../data/players";
import { NIVELES, type Nivel } from "./difficulty";
import { MAX_GUESSES } from "./share";

/** Parámetro de la URL con el código del reto: `/?reto=k3x9q2m`. */
export const CHALLENGE_PARAM = "reto";
export const CODE_LENGTH = 7;

/** FNV-1a de 32 bits: corto y estable, sin dependencias. No es seguridad, solo oculta el nombre. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Código de 7 caracteres `[0-9a-z]` para un jugador y un nivel. */
export function encodeChallenge(playerId: string, nivel: Nivel): string {
  return fnv1a(`futbolazo|${playerId}|${nivel}`).toString(36).padStart(CODE_LENGTH, "0");
}

/** Quita lo que se pega al copiar el link: mayúsculas, espacios, puntos, etc. */
export function normalizeCode(raw: string): string {
  return raw.toLowerCase().replace(/[^0-9a-z]/g, "");
}

export interface Challenge {
  code: string;
  targetId: string;
  nivel: Nivel;
}

/** Jugador y nivel del código, o `null` si no es válido o el jugador ya no está en la lista. */
export function decodeChallenge(raw: string | null | undefined, list: Player[] = players): Challenge | null {
  if (!raw) return null;
  const code = normalizeCode(raw);
  if (code.length !== CODE_LENGTH) return null;
  for (const p of list) {
    for (const nivel of NIVELES) {
      if (encodeChallenge(p.id, nivel) === code) return { code, targetId: p.id, nivel };
    }
  }
  return null;
}

/** Link del reto sobre la URL del juego, sin otros parámetros. */
export function challengeUrl(base: string, code: string): string {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set(CHALLENGE_PARAM, code);
  return url.toString();
}

export const INVITE_TEXT =
  "Te reto a adivinar al jugador misterioso de Futbolazo ⚽ ¿Lo adivinas en menos intentos que yo?";

export interface ChallengerResult {
  won: boolean;
  attempts: number;
  points: number;
}

/** Resultado de quien reta, sin el nombre: "Yo lo saqué en 4/6 · 650 pts". */
export function challengerLine({ won, attempts, points }: ChallengerResult): string {
  return won
    ? `Yo lo saqué en ${attempts}/${MAX_GUESSES} · ${points} pts`
    : `Yo no lo saqué: X/${MAX_GUESSES} · ${points} pts`;
}

/** Invitación: el texto fijo, el resultado de quien reta si ya jugó, y el link solo en la última línea. */
export function buildInviteText(url: string, result?: ChallengerResult | null): string {
  return [INVITE_TEXT, ...(result ? [challengerLine(result)] : []), "", url].join("\n");
}
