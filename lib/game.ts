import { CHALLENGE_PARAM, decodeChallenge, type Challenge } from "./challenge";
import { getLimaDateKey } from "./daily";
import { secretPool, type Nivel } from "./difficulty";
import { addRecent, pickRandomPlayer } from "./random";
import { MAX_GUESSES } from "./share";
import {
  loadChallenge,
  loadGame,
  loadNivel,
  loadRecent,
  saveChallenge,
  saveGame,
  saveRecent,
  type SavedGame,
} from "./storage";

/**
 * Empieza una partida con un jugador al azar del nivel elegido que no esté entre los últimos sorteados.
 * El jugador cuenta como reciente desde ya, aunque la partida no se termine.
 */
export function startNewGame(
  rand: () => number = Math.random,
  date: Date = new Date(),
  nivel: Nivel = loadNivel(),
): SavedGame {
  const recent = loadRecent();
  const target = pickRandomPlayer(recent, secretPool(nivel), rand);
  saveRecent(addRecent(recent, target.id));
  const game: SavedGame = { targetId: target.id, guesses: [], fecha: getLimaDateKey(date), hints: [], nivel };
  saveGame(game);
  return game;
}

/** Retoma la partida guardada; si no hay una válida, empieza otra. Llamarla dos veces no gasta dos jugadores. */
export function resumeOrStartGame(rand: () => number = Math.random, date: Date = new Date()): SavedGame {
  return loadGame() ?? startNewGame(rand, date);
}

export function isGameOver(game: SavedGame): boolean {
  return game.guesses.includes(game.targetId) || game.guesses.length >= MAX_GUESSES;
}

/** Retoma la partida de un reto o la crea (sin tocar la partida normal ni los recientes). */
export function resumeOrStartChallenge(challenge: Challenge, date: Date = new Date()): SavedGame {
  const saved = loadChallenge(challenge.code, challenge);
  if (saved) return saved;
  const game: SavedGame = {
    targetId: challenge.targetId,
    guesses: [],
    fecha: getLimaDateKey(date),
    hints: [],
    nivel: challenge.nivel,
  };
  saveChallenge(challenge.code, game);
  return game;
}

/** Vuelve al juego normal: retoma la partida normal si quedó a medias; si no, empieza otra. */
export function resumeOrStartNormal(rand: () => number = Math.random, date: Date = new Date()): SavedGame {
  const saved = loadGame();
  return saved && !isGameOver(saved) ? saved : startNewGame(rand, date);
}

export type Boot =
  | { mode: "normal"; game: SavedGame; invalidChallenge: boolean }
  | { mode: "challenge"; game: SavedGame; challenge: Challenge };

/**
 * Partida con la que abre el juego según la URL (`location.search`). Con `?reto=` válido, la del reto;
 * con uno inválido, la normal y `invalidChallenge` para avisar. Es idempotente.
 */
export function bootGame(search: string, rand: () => number = Math.random, date: Date = new Date()): Boot {
  const params = new URLSearchParams(search);
  if (!params.has(CHALLENGE_PARAM)) return { mode: "normal", game: resumeOrStartGame(rand, date), invalidChallenge: false };
  const challenge = decodeChallenge(params.get(CHALLENGE_PARAM));
  if (!challenge) return { mode: "normal", game: resumeOrStartGame(rand, date), invalidChallenge: true };
  return { mode: "challenge", game: resumeOrStartChallenge(challenge, date), challenge };
}
