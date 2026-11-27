import { describe, expect, it } from "vitest";
import { players, type Player } from "../data/players";
import { DEFAULT_NIVEL, EASY_CLUBS, isNivel, NIVEL_LABEL, secretPool } from "./difficulty";
import { pickRandomPlayer } from "./random";

describe("secretPool", () => {
  it("cada club de Fácil existe en la lista de jugadores (sin erratas)", () => {
    const clubs = new Set(players.map((p) => p.club));
    for (const club of EASY_CLUBS) expect(clubs).toContain(club);
  });

  it("Fácil: solo jugadores de los clubes grandes; Normal: todos", () => {
    const easy = secretPool("facil");
    expect(easy.length).toBeGreaterThan(0);
    expect(easy.every((p) => EASY_CLUBS.includes(p.club))).toBe(true);
    expect(easy).toEqual(players.filter((p) => EASY_CLUBS.includes(p.club)));
    expect(secretPool("normal")).toBe(players);
  });

  it("Alianza Atlético no cuenta como Alianza Lima", () => {
    expect(secretPool("facil").some((p) => p.club === "Alianza Atlético")).toBe(false);
  });

  it("si la lista de clubes de Fácil queda vacía o no coincide con nadie, cae a Normal", () => {
    expect(secretPool("facil", players, [])).toBe(players);
    expect(secretPool("facil", players, ["Club que no existe"])).toBe(players);
  });

  it("la lista de clubes se puede cambiar", () => {
    const pool = secretPool("facil", players, ["Melgar"]);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((p) => p.club === "Melgar")).toBe(true);
  });

  it("el sorteo respeta el nivel con cualquier valor del azar", () => {
    const easy = secretPool("facil");
    for (let i = 0; i <= 20; i++) {
      const r = Math.min(i / 20, 0.9999);
      expect(EASY_CLUBS).toContain(pickRandomPlayer([], easy, () => r).club);
    }
  });

  it("el sorteo en Fácil sigue sin repetir los últimos sorteados", () => {
    const easy = secretPool("facil");
    const recent = easy.slice(0, 10).map((p) => p.id);
    for (let i = 0; i <= 20; i++) {
      const r = Math.min(i / 20, 0.9999);
      expect(recent).not.toContain(pickRandomPlayer(recent, easy, () => r).id);
    }
  });

  it("con muy pocos jugadores en Fácil siempre queda un candidato", () => {
    const tiny: Player[] = players.filter((p) => p.club === "Melgar").slice(0, 2);
    const pool = secretPool("facil", tiny, ["Melgar"]);
    expect(pickRandomPlayer([tiny[0].id, tiny[1].id], pool, () => 0)).toBeDefined();
  });
});

describe("niveles", () => {
  it("Normal por defecto, etiquetas y validación", () => {
    expect(DEFAULT_NIVEL).toBe("normal");
    expect(NIVEL_LABEL).toEqual({ facil: "Fácil", normal: "Normal" });
    expect(isNivel("facil")).toBe(true);
    expect(isNivel("normal")).toBe(true);
    expect(isNivel("Fácil")).toBe(false);
    expect(isNivel(null)).toBe(false);
  });
});
