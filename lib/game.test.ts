import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayerById, players } from "../data/players";
import { resumeOrStartGame, startNewGame } from "./game";
import { loadGame, loadRecent, saveGame, saveRecent } from "./storage";

/** localStorage en memoria (los tests corren en Node). */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

const [a, b, c] = players;
const LIMA_NOON = new Date("2026-11-26T17:00:00Z");

beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
afterEach(() => vi.unstubAllGlobals());

describe("storage", () => {
  it("guarda y recupera la partida en curso", () => {
    saveGame({ targetId: a.id, guesses: [b.id, c.id], fecha: "2026-11-26" });
    expect(loadGame()).toEqual({ targetId: a.id, guesses: [b.id, c.id], fecha: "2026-11-26" });
  });

  it("sin partida guardada devuelve null", () => {
    expect(loadGame()).toBeNull();
  });

  it("descarta partidas corruptas o con jugador que ya no existe", () => {
    localStorage.setItem("futbolazo:v2:partida", "{no es json");
    expect(loadGame()).toBeNull();
    localStorage.setItem("futbolazo:v2:partida", JSON.stringify({ targetId: "no-existe", guesses: [], fecha: "2026-11-26" }));
    expect(loadGame()).toBeNull();
    localStorage.setItem("futbolazo:v2:partida", JSON.stringify({ targetId: a.id, guesses: [] }));
    expect(loadGame()).toBeNull();
    localStorage.setItem("futbolazo:v2:partida", "null");
    expect(loadGame()).toBeNull();
  });

  it("limpia intentos inválidos, duplicados y de más", () => {
    const guesses = ["x", b.id, b.id, 5, ...players.slice(1).map((p) => p.id)];
    localStorage.setItem("futbolazo:v2:partida", JSON.stringify({ targetId: a.id, guesses, fecha: "2026-11-26" }));
    expect(loadGame()?.guesses).toEqual(players.slice(1, 7).map((p) => p.id));
  });

  it("guarda los recientes y descarta ids desconocidos", () => {
    saveRecent([a.id, "fantasma", b.id]);
    expect(loadRecent()).toEqual([a.id, b.id]);
  });

  it("borra el progreso viejo del modo diario al guardar", () => {
    localStorage.setItem("futbolazo:v1:2026-11-25", JSON.stringify({ guesses: [a.id] }));
    saveGame({ targetId: a.id, guesses: [], fecha: "2026-11-26" });
    expect(localStorage.getItem("futbolazo:v1:2026-11-25")).toBeNull();
  });

  it("con localStorage bloqueado no rompe", () => {
    vi.stubGlobal("localStorage", {
      get length(): number {
        throw new Error("bloqueado");
      },
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    });
    expect(loadGame()).toBeNull();
    expect(loadRecent()).toEqual([]);
    expect(() => saveGame({ targetId: a.id, guesses: [], fecha: "2026-11-26" })).not.toThrow();
    expect(() => saveRecent([a.id])).not.toThrow();
    expect(players).toContainEqual(getPlayerById(resumeOrStartGame().targetId));
  });
});

describe("partida en curso", () => {
  it("empieza una partida vacía con la fecha de Lima y la guarda", () => {
    const game = startNewGame(() => 0, new Date("2026-11-27T04:30:00Z")); // 23:30 del 26 en Lima
    expect(game.guesses).toEqual([]);
    expect(game.fecha).toBe("2026-11-26");
    expect(loadGame()).toEqual(game);
  });

  it("el jugador sorteado pasa a recientes al empezar", () => {
    const game = startNewGame(() => 0, LIMA_NOON);
    expect(loadRecent()).toEqual([game.targetId]);
  });

  it("al recargar se retoma la misma partida, con sus intentos", () => {
    const game = resumeOrStartGame(() => 0, LIMA_NOON);
    const conIntento = { ...game, guesses: [b.id] };
    saveGame(conIntento);
    expect(resumeOrStartGame(() => 0.99, LIMA_NOON)).toEqual(conIntento);
  });

  it("recargar no gasta un jugador nuevo de la lista de recientes", () => {
    resumeOrStartGame(() => 0, LIMA_NOON);
    resumeOrStartGame(() => 0.5, LIMA_NOON);
    resumeOrStartGame(() => 0.9, LIMA_NOON);
    expect(loadRecent()).toHaveLength(1);
  });

  it("una partida terminada también se retoma tal cual", () => {
    const terminada = { targetId: a.id, guesses: [b.id, a.id], fecha: "2026-11-20" };
    saveGame(terminada);
    expect(resumeOrStartGame()).toEqual(terminada);
  });

  it("jugar otra vez da otro jugador y nunca repite los recientes", () => {
    let recent: string[] = [];
    let previous = resumeOrStartGame(Math.random, LIMA_NOON);
    for (let i = 0; i < 30; i++) {
      recent = loadRecent();
      const next = startNewGame(Math.random, LIMA_NOON);
      expect(next.targetId).not.toBe(previous.targetId);
      expect(recent.slice(-(players.length - 1))).not.toContain(next.targetId);
      expect(next.guesses).toEqual([]);
      previous = next;
    }
  });
});
