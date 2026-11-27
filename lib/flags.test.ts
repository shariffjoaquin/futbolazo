import { describe, expect, it } from "vitest";
import { players } from "../data/players";
import { FLAG_HEIGHT, FLAG_WIDTH, FLAGS, getFlag } from "./flags";
import { PAISES } from "./importPlayers";

describe("banderas", () => {
  it.each(PAISES)("%s tiene bandera", (pais) => {
    const flag = getFlag(pais);
    expect(flag).toBeDefined();
    expect(flag!.length).toBeGreaterThan(0);
  });

  it("no hay banderas de países que no estén en la lista (evita errores de tipeo)", () => {
    expect(Object.keys(FLAGS).sort()).toEqual([...PAISES].sort());
  });

  it("todos los jugadores de data/players.ts tienen bandera", () => {
    const sinBandera = [...new Set(players.map((p) => p.nacionalidad))].filter((n) => !getFlag(n));
    expect(sinBandera).toEqual([]);
  });

  it("un país sin bandera definida devuelve undefined", () => {
    expect(getFlag("Atlántida")).toBeUndefined();
    expect(getFlag("constructor")).toBeUndefined();
  });

  it("los rectángulos y círculos caben en la caja de 30 × 20", () => {
    for (const [pais, shapes] of Object.entries(FLAGS)) {
      for (const s of shapes) {
        if (s.kind === "rect") {
          expect(s.x + s.w, pais).toBeLessThanOrEqual(FLAG_WIDTH + 1e-9);
          expect(s.y + s.h, pais).toBeLessThanOrEqual(FLAG_HEIGHT + 1e-9);
        } else if (s.kind === "circle") {
          expect(s.cx - s.r, pais).toBeGreaterThanOrEqual(0);
          expect(s.cy + s.r, pais).toBeLessThanOrEqual(FLAG_HEIGHT);
        }
      }
    }
  });
});
