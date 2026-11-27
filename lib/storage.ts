import { getPlayerById } from "../data/players";
import { DEFAULT_NIVEL, isNivel, NIVELES, type Nivel } from "./difficulty";
import { HINT_TYPES, MAX_HINTS, type HintType } from "./hints";
import { RECENT_LIMIT } from "./random";
import { addScore, EMPTY_STATS, type ScoreStats } from "./score";
import { MAX_GUESSES } from "./share";

const GAME_KEY = "futbolazo:v2:partida";
const RECENT_KEY = "futbolazo:v2:recientes";
const HELP_KEY = "futbolazo:v2:visto-ayuda";
const SCORE_KEY = "futbolazo:v2:puntaje";
const NIVEL_KEY = "futbolazo:v2:nivel";
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
  /** Nivel con que se sorteó el secreto. */
  nivel: Nivel;
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
  // Las partidas guardadas antes de los niveles se toman como Normal.
  const nivel = isNivel(data.nivel) ? data.nivel : DEFAULT_NIVEL;
  return { targetId, fecha, guesses: validIds(data.guesses).slice(0, MAX_GUESSES), hints, nivel };
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

/** Nivel elegido para las partidas nuevas; Normal si no hay o no es válido. */
export function loadNivel(): Nivel {
  const nivel = read(NIVEL_KEY);
  return isNivel(nivel) ? nivel : DEFAULT_NIVEL;
}

export function saveNivel(nivel: Nivel): void {
  write(NIVEL_KEY, nivel);
}

const isPoints = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;

function parseStats(value: unknown): ScoreStats {
  const data = value as Partial<Record<keyof ScoreStats, unknown>> | null;
  if (!data || typeof data !== "object" || !isPoints(data.mejor) || !isPoints(data.total)) return EMPTY_STATS;
  return { mejor: data.mejor, total: data.total };
}

/** Récords de todos los niveles. El formato anterior, sin niveles, cuenta como Normal. */
function loadAllStats(): Record<Nivel, ScoreStats> {
  const data = read(SCORE_KEY) as Record<string, unknown> | null;
  const legacy = data && typeof data === "object" && "mejor" in data;
  return Object.fromEntries(
    NIVELES.map((n) => [n, parseStats(legacy ? (n === "normal" ? data : null) : data?.[n])]),
  ) as Record<Nivel, ScoreStats>;
}

/** Mejor puntaje y total acumulado de un nivel; en cero si no hay o no son válidos. */
export function loadStats(nivel: Nivel): ScoreStats {
  return loadAllStats()[nivel];
}

/**
 * Suma el puntaje de una partida recién terminada a los récords de su nivel y los devuelve.
 * Llamarla solo con el intento que termina la partida, nunca al cargar.
 */
export function recordScore(points: number, nivel: Nivel): ScoreStats {
  const all = loadAllStats();
  all[nivel] = addScore(all[nivel], points);
  write(SCORE_KEY, all);
  return all[nivel];
}
