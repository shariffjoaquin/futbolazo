import { describe, expect, it } from "vitest";
import type { Player } from "../data/players";
import { ageOn, compare } from "./compare";

const DAY = "2026-11-26";

const base: Player = {
  id: "target",
  nombre: "Objetivo",
  club: "Universitario",
  nacionalidad: "Perú",
  posicion: "MED",
  fechaNacimiento: "2000-01-01", // 26 años el 2026-11-26
  dorsal: 10,
  pie: "D",
};
const guess = (over: Partial<Player>): Player => ({ ...base, id: "guess", ...over });

describe("ageOn", () => {
  it("cuenta el cumpleaños solo cuando ya pasó", () => {
    expect(ageOn("2000-11-26", "2026-11-25")).toBe(25);
    expect(ageOn("2000-11-26", "2026-11-26")).toBe(26);
    expect(ageOn("2000-12-01", "2026-11-26")).toBe(25);
  });
});

describe("compare", () => {
  it("todo correcto cuando es el mismo jugador", () => {
    const r = compare(base, base, DAY);
    expect(r.isCorrect).toBe(true);
    for (const k of ["club", "nacionalidad", "posicion", "edad", "dorsal", "pie"] as const) {
      expect(r[k]).toEqual({ status: "correct" });
    }
  });

  it("mismos atributos pero otro jugador no es acierto", () => {
    expect(compare(guess({}), base, DAY).isCorrect).toBe(false);
  });

  it("club, nacionalidad y pie solo son correct o wrong", () => {
    const r = compare(guess({ club: "Alianza Lima", nacionalidad: "Argentina", pie: "Ambos" }), base, DAY);
    expect(r.club.status).toBe("wrong");
    expect(r.nacionalidad.status).toBe("wrong");
    expect(r.pie.status).toBe("wrong");
  });

  it("posición vecina es close, a dos o más es wrong", () => {
    expect(compare(guess({ posicion: "DEF" }), base, DAY).posicion.status).toBe("close");
    expect(compare(guess({ posicion: "DEL" }), base, DAY).posicion.status).toBe("close");
    expect(compare(guess({ posicion: "POR" }), base, DAY).posicion.status).toBe("wrong");
    const del = { ...base, posicion: "DEL" as const };
    expect(compare(guess({ posicion: "DEF" }), del, DAY).posicion.status).toBe("wrong");
    expect(compare(guess({ posicion: "POR" }), del, DAY).posicion.status).toBe("wrong");
  });

  it("edad ±2 es close, ±3 es wrong, con flecha hacia el objetivo", () => {
    // Intento más joven (24) → el objetivo (26) es mayor → up
    expect(compare(guess({ fechaNacimiento: "2002-01-01" }), base, DAY).edad).toEqual({ status: "close", arrow: "up" });
    expect(compare(guess({ fechaNacimiento: "1998-01-01" }), base, DAY).edad).toEqual({ status: "close", arrow: "down" });
    expect(compare(guess({ fechaNacimiento: "2003-01-01" }), base, DAY).edad).toEqual({ status: "wrong", arrow: "up" });
    expect(compare(guess({ fechaNacimiento: "1997-01-01" }), base, DAY).edad).toEqual({ status: "wrong", arrow: "down" });
  });

  it("edad igual con distinta fecha de nacimiento es correct", () => {
    expect(compare(guess({ fechaNacimiento: "2000-06-15" }), base, DAY).edad).toEqual({ status: "correct" });
  });

  it("dorsal ±3 es close, ±4 es wrong, con flecha hacia el objetivo", () => {
    expect(compare(guess({ dorsal: 7 }), base, DAY).dorsal).toEqual({ status: "close", arrow: "up" });
    expect(compare(guess({ dorsal: 13 }), base, DAY).dorsal).toEqual({ status: "close", arrow: "down" });
    expect(compare(guess({ dorsal: 6 }), base, DAY).dorsal).toEqual({ status: "wrong", arrow: "up" });
    expect(compare(guess({ dorsal: 14 }), base, DAY).dorsal).toEqual({ status: "wrong", arrow: "down" });
  });
});
