import { describe, expect, it } from "vitest";
import { players } from "../data/players";
import { colorDistance, contrast, CRESTS, crestInk, getCrest } from "./crests";

const clubs = [...new Set(players.map((p) => p.club))];
const entries = Object.entries(CRESTS);

/** Por debajo de esta distancia, dos colores se confunden en un escudo de 24 px. */
const MIN_DISTANCE = 60;

describe("escudos", () => {
  it("cada club de data/players.ts tiene escudo", () => {
    expect(clubs.filter((c) => !getCrest(c))).toEqual([]);
    expect(clubs).toHaveLength(18);
  });

  it("no hay escudos de clubes que no estén en los datos (evita errores de tipeo)", () => {
    expect(Object.keys(CRESTS).sort()).toEqual([...clubs].sort());
  });

  it("un club sin escudo devuelve undefined (la celda muestra solo el texto)", () => {
    expect(getCrest("Club Inventado")).toBeUndefined();
    expect(getCrest("constructor")).toBeUndefined();
  });

  it("siglas de 1 a 3 caracteres en mayúsculas, sin repetir", () => {
    for (const [club, { sigla }] of entries) expect(sigla, club).toMatch(/^[A-Z0-9]{1,3}$/);
    const siglas = entries.map(([, c]) => c.sigla);
    expect(new Set(siglas).size).toBe(siglas.length);
  });

  it("colores en formato #rrggbb", () => {
    for (const [club, c] of entries) {
      expect(c.primary, club).toMatch(/^#[0-9a-f]{6}$/);
      expect(c.secondary, club).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("no hay dos clubes con los mismos colores (indistinguibles)", () => {
    const iguales: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [a, ca] = entries[i];
        const [b, cb] = entries[j];
        const mismoPrimario = colorDistance(ca.primary, cb.primary) < MIN_DISTANCE;
        const mismoSecundario = colorDistance(ca.secondary, cb.secondary) < MIN_DISTANCE;
        if (mismoPrimario && mismoSecundario) iguales.push(`${a} / ${b}`);
      }
    }
    expect(iguales).toEqual([]);
  });

  it("los dos colores de cada escudo se distinguen entre sí", () => {
    for (const [club, c] of entries) expect(contrast(c.primary, c.secondary), club).toBeGreaterThanOrEqual(1.5);
  });

  it("la sigla se lee sobre el campo (contraste ≥ 4,5)", () => {
    for (const [club, c] of entries) expect(contrast(c.primary, crestInk(c.primary)), club).toBeGreaterThanOrEqual(4.5);
  });

  it("detecta colores repetidos", () => {
    expect(colorDistance("#c8102e", "#c8102e")).toBe(0);
    expect(colorDistance("#000000", "#ffffff")).toBeCloseTo(441.67, 1);
  });
});
