import { getLimaDateKey } from "./daily";
import { addRecent, pickRandomPlayer } from "./random";
import { loadGame, loadRecent, saveGame, saveRecent, type SavedGame } from "./storage";

/**
 * Empieza una partida con un jugador al azar que no esté entre los últimos sorteados.
 * El jugador cuenta como reciente desde ya, aunque la partida no se termine.
 */
export function startNewGame(rand: () => number = Math.random, date: Date = new Date()): SavedGame {
  const recent = loadRecent();
  const target = pickRandomPlayer(recent, undefined, rand);
  saveRecent(addRecent(recent, target.id));
  const game: SavedGame = { targetId: target.id, guesses: [], fecha: getLimaDateKey(date) };
  saveGame(game);
  return game;
}

/** Retoma la partida guardada; si no hay una válida, empieza otra. Llamarla dos veces no gasta dos jugadores. */
export function resumeOrStartGame(rand: () => number = Math.random, date: Date = new Date()): SavedGame {
  return loadGame() ?? startNewGame(rand, date);
}
