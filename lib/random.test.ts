import { describe, expect, it } from "vitest";
import { players, type Player } from "../data/players";
import { addRecent, pickRandomPlayer, RECENT_LIMIT } from "./random";

const makePlayers = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({ ...players[0], id: `p${i}`, nombre: `Jugador ${i}` }));

/** PRNG con semilla para que los tests sean reproducibles. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe("pickRandomPlayer", () => {
  it("con más de 10 jugadores nunca elige uno de los últimos 10", () => {
    const list = makePlayers(25);
    const rand = seeded(42);
    let recent: string[] = [];
    for (let i = 0; i < 500; i++) {
      const pick = pickRandomPlayer(recent, list, rand);
      expect(recent).not.toContain(pick.id);
      recent = addRecent(recent, pick.id);
    }
  });

  it("puede elegir a uno que salió hace 11 o más partidas", () => {
    const list = makePlayers(11);
    const recent = list.slice(1).map((p) => p.id); // los últimos 10 son p1..p10
    expect(pickRandomPlayer(recent, list, () => 0).id).toBe("p0");
  });

  it("con N ≤ 10 jugadores evita los últimos N − 1 y siempre devuelve uno", () => {
    const list = makePlayers(10);
    const rand = seeded(7);
    let recent: string[] = [];
    for (let i = 0; i < 200; i++) {
      const pick = pickRandomPlayer(recent, list, rand);
      expect(pick).toBeDefined();
      expect(recent.slice(-(list.length - 1))).not.toContain(pick.id);
      recent = addRecent(recent, pick.id);
    }
  });

  it("con un solo jugador lo devuelve aunque sea reciente", () => {
    const list = makePlayers(1);
    expect(pickRandomPlayer(["p0"], list, () => 0.5).id).toBe("p0");
  });

  it("usa la función aleatoria para elegir entre los candidatos", () => {
    const list = makePlayers(5);
    expect(pickRandomPlayer([], list, () => 0).id).toBe("p0");
    expect(pickRandomPlayer([], list, () => 0.999).id).toBe("p4");
    expect(pickRandomPlayer(["p0"], list, () => 0).id).toBe("p1");
  });

  it("sin recientes cualquier jugador puede salir", () => {
    const list = makePlayers(12);
    const rand = seeded(1);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(pickRandomPlayer([], list, rand).id);
    expect(seen.size).toBe(12);
  });

  it("por defecto sortea de la lista real", () => {
    expect(players).toContain(pickRandomPlayer([]));
  });
});

describe("addRecent", () => {
  it("agrega al final y se queda con los últimos 10", () => {
    let recent: string[] = [];
    for (let i = 0; i < 15; i++) recent = addRecent(recent, `p${i}`);
    expect(recent).toHaveLength(RECENT_LIMIT);
    expect(recent[0]).toBe("p5");
    expect(recent.at(-1)).toBe("p14");
  });

  it("no duplica: si ya estaba, lo mueve al final", () => {
    expect(addRecent(["a", "b", "c"], "a")).toEqual(["b", "c", "a"]);
  });
});
