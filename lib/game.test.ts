import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayerById, players } from "../data/players";
import { encodeChallenge } from "./challenge";
import { EASY_CLUBS } from "./difficulty";
import { bootGame, isGameOver, resumeOrStartChallenge, resumeOrStartGame, resumeOrStartNormal, startNewGame } from "./game";
import type { HintType } from "./hints";
import {
  loadChallenge,
  loadGame,
  loadHelpSeen,
  loadRecent,
  loadNivel,
  loadStats,
  recordScore,
  saveChallenge,
  saveGame,
  saveHelpSeen,
  saveNivel,
  saveRecent,
} from "./storage";

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
    saveGame({ targetId: a.id, guesses: [b.id, c.id], fecha: "2026-11-26", hints: ["club"], nivel: "facil" });
    expect(loadGame()).toEqual({ targetId: a.id, guesses: [b.id, c.id], fecha: "2026-11-26", hints: ["club"], nivel: "facil" });
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
    saveGame({ targetId: a.id, guesses: [], fecha: "2026-11-26", hints: [], nivel: "normal" });
    expect(localStorage.getItem("futbolazo:v1:2026-11-25")).toBeNull();
  });

  it("una partida guardada antes del botón de pista se carga sin pistas", () => {
    localStorage.setItem("futbolazo:v2:partida", JSON.stringify({ targetId: a.id, guesses: [b.id], fecha: "2026-11-26" }));
    expect(loadGame()).toEqual({ targetId: a.id, guesses: [b.id], fecha: "2026-11-26", hints: [], nivel: "normal" });
  });

  it("descarta pistas desconocidas, repetidas o de más", () => {
    const hints = ["club", "foto", "club", 3, "pais", "edad"];
    localStorage.setItem("futbolazo:v2:partida", JSON.stringify({ targetId: a.id, guesses: [], fecha: "2026-11-26", hints }));
    expect(loadGame()?.hints).toEqual(["club", "pais"]);
  });

  it("recuerda si ya se vio la ayuda", () => {
    expect(loadHelpSeen()).toBe(false);
    saveHelpSeen();
    expect(loadHelpSeen()).toBe(true);
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
    expect(() => saveGame({ targetId: a.id, guesses: [], fecha: "2026-11-26", hints: [], nivel: "normal" })).not.toThrow();
    expect(() => saveRecent([a.id])).not.toThrow();
    expect(loadHelpSeen()).toBe(false);
    expect(() => saveHelpSeen()).not.toThrow();
    expect(loadStats("normal")).toEqual({ mejor: 0, total: 0 });
    expect(recordScore(650, "normal")).toEqual({ mejor: 650, total: 650 });
    expect(loadNivel()).toBe("normal");
    expect(() => saveNivel("facil")).not.toThrow();
    expect(players).toContainEqual(getPlayerById(resumeOrStartGame().targetId));
  });
});

describe("récords de puntaje", () => {
  it("empiezan en cero, guardan el mejor y acumulan el total", () => {
    expect(loadStats("normal")).toEqual({ mejor: 0, total: 0 });
    recordScore(650, "normal");
    recordScore(120, "normal");
    expect(recordScore(900, "normal")).toEqual({ mejor: 900, total: 1670 });
    expect(loadStats("normal")).toEqual({ mejor: 900, total: 1670 });
  });

  it("se guardan por separado para cada nivel", () => {
    recordScore(650, "normal");
    recordScore(1200, "facil");
    recordScore(250, "facil");
    expect(loadStats("normal")).toEqual({ mejor: 650, total: 650 });
    expect(loadStats("facil")).toEqual({ mejor: 1200, total: 1450 });
    expect(JSON.parse(localStorage.getItem("futbolazo:v2:puntaje")!)).toEqual({
      facil: { mejor: 1200, total: 1450 },
      normal: { mejor: 650, total: 650 },
    });
  });

  it("el formato anterior, sin niveles, se lee como Normal", () => {
    localStorage.setItem("futbolazo:v2:puntaje", JSON.stringify({ mejor: 700, total: 3000 }));
    expect(loadStats("normal")).toEqual({ mejor: 700, total: 3000 });
    expect(loadStats("facil")).toEqual({ mejor: 0, total: 0 });
    expect(recordScore(400, "facil")).toEqual({ mejor: 400, total: 400 });
    expect(loadStats("normal")).toEqual({ mejor: 700, total: 3000 });
  });

  it("cargar no suma: recargar una partida terminada deja los récords igual", () => {
    recordScore(650, "normal");
    loadStats("normal");
    loadGame();
    expect(loadStats("normal")).toEqual({ mejor: 650, total: 650 });
  });

  it("ignora récords corruptos o con valores no válidos", () => {
    for (const raw of [
      "{no es json",
      "null",
      "[]",
      '{"mejor":-5,"total":10}',
      '{"mejor":"9","total":10}',
      '{"mejor":1.5,"total":2}',
      '{"mejor":10}',
      '{"normal":{"mejor":-1,"total":0},"facil":"x"}',
    ]) {
      localStorage.setItem("futbolazo:v2:puntaje", raw);
      expect(loadStats("normal")).toEqual({ mejor: 0, total: 0 });
      expect(loadStats("facil")).toEqual({ mejor: 0, total: 0 });
    }
    expect(recordScore(250, "normal")).toEqual({ mejor: 250, total: 250 });
  });
});

describe("nivel", () => {
  it("por defecto es Normal y se recuerda el elegido", () => {
    expect(loadNivel()).toBe("normal");
    saveNivel("facil");
    expect(loadNivel()).toBe("facil");
    saveNivel("normal");
    expect(loadNivel()).toBe("normal");
  });

  it("un nivel guardado no válido se toma como Normal", () => {
    localStorage.setItem("futbolazo:v2:nivel", JSON.stringify("dificil"));
    expect(loadNivel()).toBe("normal");
  });

  it("una partida guardada sin nivel (o con uno no válido) se carga como Normal", () => {
    localStorage.setItem("futbolazo:v2:partida", JSON.stringify({ targetId: a.id, guesses: [], fecha: "2026-11-26", hints: [] }));
    expect(loadGame()?.nivel).toBe("normal");
    localStorage.setItem("futbolazo:v2:partida", JSON.stringify({ targetId: a.id, guesses: [], fecha: "2026-11-26", hints: [], nivel: 3 }));
    expect(loadGame()?.nivel).toBe("normal");
  });

  it("la partida nueva usa el nivel elegido y lo guarda consigo", () => {
    saveNivel("facil");
    const game = startNewGame(() => 0, LIMA_NOON);
    expect(game.nivel).toBe("facil");
    expect(EASY_CLUBS).toContain(getPlayerById(game.targetId)!.club);
    expect(loadGame()?.nivel).toBe("facil");
  });

  it("en Fácil todos los secretos son de clubes grandes; en Normal sale de cualquier club", () => {
    const easyClubs = new Set<string>();
    const normalClubs = new Set<string>();
    for (let i = 0; i < 300; i++) {
      easyClubs.add(getPlayerById(startNewGame(Math.random, LIMA_NOON, "facil").targetId)!.club);
      normalClubs.add(getPlayerById(startNewGame(Math.random, LIMA_NOON, "normal").targetId)!.club);
    }
    expect([...easyClubs].every((club) => EASY_CLUBS.includes(club))).toBe(true);
    expect([...normalClubs].some((club) => !EASY_CLUBS.includes(club))).toBe(true);
  });

  it("cambiar la preferencia no cambia el nivel de la partida guardada", () => {
    saveNivel("facil");
    const game = startNewGame(() => 0, LIMA_NOON);
    saveNivel("normal");
    expect(resumeOrStartGame()).toEqual(game);
    expect(resumeOrStartGame().nivel).toBe("facil");
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

  it("las pistas pedidas sobreviven a recargar", () => {
    const game = resumeOrStartGame(() => 0, LIMA_NOON);
    const conPistas = { ...game, guesses: [b.id, c.id], hints: ["posicion", "club"] as HintType[] };
    saveGame(conPistas);
    expect(resumeOrStartGame(() => 0.5, LIMA_NOON)).toEqual(conPistas);
  });

  it("una partida nueva empieza sin pistas", () => {
    saveGame({ targetId: a.id, guesses: [b.id, c.id], fecha: "2026-11-26", hints: ["pais"], nivel: "normal" });
    expect(startNewGame(() => 0, LIMA_NOON).hints).toEqual([]);
    expect(loadGame()?.hints).toEqual([]);
  });

  it("una partida terminada también se retoma tal cual", () => {
    const terminada = { targetId: a.id, guesses: [b.id, a.id], fecha: "2026-11-20", hints: [] as HintType[], nivel: "normal" as const };
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

describe("reto de amigos", () => {
  const code = encodeChallenge(b.id, "facil");
  const challenge = { code, targetId: b.id, nivel: "facil" as const };

  it("con ?reto= válido se juega ese jugador en ese nivel", () => {
    const boot = bootGame(`?reto=${code}`, () => 0, LIMA_NOON);
    expect(boot.mode).toBe("challenge");
    expect(boot.game).toEqual({ targetId: b.id, guesses: [], fecha: "2026-11-26", hints: [], nivel: "facil" });
  });

  it("la partida del reto se guarda aparte: no toca la partida normal ni los recientes", () => {
    const normal = startNewGame(() => 0, LIMA_NOON, "normal");
    const recent = loadRecent();
    const game = resumeOrStartChallenge(challenge, LIMA_NOON);
    saveChallenge(code, { ...game, guesses: [c.id] });
    expect(loadGame()).toEqual(normal);
    expect(loadRecent()).toEqual(recent);
    expect(loadChallenge(code, challenge)?.guesses).toEqual([c.id]);
  });

  it("al recargar sigue el mismo reto, con sus intentos (idempotente)", () => {
    const first = bootGame(`?reto=${code}`, () => 0, LIMA_NOON);
    saveChallenge(code, { ...first.game, guesses: [c.id] });
    const again = bootGame(`?reto=${code.toUpperCase()}.`, () => 0.9, LIMA_NOON);
    expect(again.game.guesses).toEqual([c.id]);
  });

  it("un reto terminado se retoma terminado (no se vuelve a jugar)", () => {
    saveChallenge(code, { ...resumeOrStartChallenge(challenge, LIMA_NOON), guesses: [c.id, b.id] });
    const boot = bootGame(`?reto=${code}`);
    expect(isGameOver(boot.game)).toBe(true);
    expect(boot.game.guesses).toEqual([c.id, b.id]);
  });

  it("con ?reto= inválido se juega normal y se avisa", () => {
    const boot = bootGame("?reto=nada", () => 0, LIMA_NOON);
    expect(boot).toMatchObject({ mode: "normal", invalidChallenge: true });
    expect(loadGame()).toEqual(boot.game);
    expect(bootGame("", () => 0, LIMA_NOON)).toMatchObject({ mode: "normal", invalidChallenge: false });
  });

  it("descarta un reto guardado cuyo jugador no coincide con el código", () => {
    saveChallenge(code, { targetId: c.id, guesses: [], fecha: "2026-11-26", hints: [], nivel: "facil" });
    expect(loadChallenge(code, challenge)).toBeNull();
    expect(resumeOrStartChallenge(challenge, LIMA_NOON).targetId).toBe(b.id);
  });

  it("guarda como máximo los 30 retos más recientes", () => {
    const codes = players.slice(0, 35).map((p) => encodeChallenge(p.id, "normal"));
    players.slice(0, 35).forEach((p, i) =>
      saveChallenge(codes[i], { targetId: p.id, guesses: [], fecha: "2026-11-26", hints: [], nivel: "normal" }),
    );
    const saved = Object.keys(JSON.parse(localStorage.getItem("futbolazo:v2:retos")!));
    expect(saved).toEqual(codes.slice(5));
  });

  it("los puntos del reto suman a los récords de su nivel", () => {
    recordScore(850, challenge.nivel);
    expect(loadStats("facil")).toEqual({ mejor: 850, total: 850 });
    expect(loadStats("normal")).toEqual({ mejor: 0, total: 0 });
  });

  it("jugar otra vez tras un reto retoma la normal a medias, o empieza una nueva si terminó", () => {
    const normal = startNewGame(() => 0, LIMA_NOON, "normal");
    saveGame({ ...normal, guesses: [c.id] });
    expect(resumeOrStartNormal(() => 0, LIMA_NOON)).toEqual({ ...normal, guesses: [c.id] });
    saveGame({ ...normal, guesses: [normal.targetId] });
    const next = resumeOrStartNormal(() => 0.5, LIMA_NOON);
    expect(next.guesses).toEqual([]);
  });

  it("con localStorage bloqueado el reto se juega igual", () => {
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
    expect(bootGame(`?reto=${code}`).game.targetId).toBe(b.id);
  });
});
