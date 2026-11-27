import { getPlayerById } from "../data/players";
import { HINT_TYPES, MAX_HINTS, type HintType } from "./hints";
import { RECENT_LIMIT } from "./random";
import { MAX_GUESSES } from "./share";

const GAME_KEY = "futbolazo:v2:partida";
const RECENT_KEY = "futbolazo:v2:recientes";
const HELP_KEY = "futbolazo:v2:visto-ayuda";
/** Claves del modo diario anterior (una por fecha). */
const LEGACY_PREFIX = "futbolazo:v1:";

export interface SavedGame {
  targetId: string;
  /** Ids de jugador intentados, en orden. */
  guesses: string[];
  /** Fecha de Lima (YYYY-MM-DD) en que empezó la partida; las edades se calculan a esa fecha. */
  fecha: string;
  /** Pistas pedidas con el botón de pista, en orden (máx. 2). */
  hints: HintType[];
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage no disponible (modo privado, etc.): se juega sin guardar.
  }
}

/** Ids de jugadores existentes, sin duplicados. Ignora cualquier otra cosa. */
function validIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && !!getPlayerById(id)))];
}

/** Partida guardada, o `null` si no hay o no es válida. */
export function loadGame(): SavedGame | null {
  const data = read(GAME_KEY) as Partial<Record<keyof SavedGame, unknown>> | null;
  if (!data || typeof data !== "object") return null;
  const { targetId, fecha } = data;
  if (typeof targetId !== "string" || !getPlayerById(targetId)) return null;
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  // Las partidas guardadas antes del botón de pista no traen `hints`: se cargan sin pistas.
  const hints = Array.isArray(data.hints)
    ? [...new Set(data.hints.filter((h): h is HintType => HINT_TYPES.includes(h as HintType)))].slice(0, MAX_HINTS)
    : [];
  return { targetId, fecha, guesses: validIds(data.guesses).slice(0, MAX_GUESSES), hints };
}

export function saveGame(game: SavedGame): void {
  write(GAME_KEY, game);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // Sin localStorage no hay nada que limpiar.
  }
}

/** Últimos jugadores sorteados, el más reciente al final. */
export function loadRecent(): string[] {
  return validIds(read(RECENT_KEY)).slice(-RECENT_LIMIT);
}

export function saveRecent(ids: string[]): void {
  write(RECENT_KEY, ids.slice(-RECENT_LIMIT));
}

/** Si ya se mostró "¿Cómo se juega?" (se abre sola solo la primera vez). */
export function loadHelpSeen(): boolean {
  return read(HELP_KEY) === true;
}

export function saveHelpSeen(): void {
  write(HELP_KEY, true);
}
