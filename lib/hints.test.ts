import { describe, expect, it } from "vitest";
import type { Player } from "../data/players";
import { compare } from "./compare";
import {
  ageRange,
  availableHints,
  describeHint,
  hintButtonState,
  MAX_HINTS,
  pickHint,
  SECONDARY_HINTS,
  surnameInitial,
  type HintType,
} from "./hints";

const DAY = "2026-11-26";
const target: Player = {
  id: "target",
  nombre: "Matías Di Benedetto",
  club: "Universitario",
  nacionalidad: "Argentina",
  posicion: "DEF",
  fechaNacimiento: "1992-11-19", // 34 años el 2026-11-26
  dorsal: 5,
  pie: "I",
};
const guess = (over: Partial<Player>): Player => ({
  ...target,
  id: "guess",
  nombre: "Otro",
  club: "Alianza Lima",
  nacionalidad: "Perú",
  posicion: "POR",
  fechaNacimiento: "2004-01-01",
  dorsal: 30,
  pie: "D",
  ...over,
});
const results = (...guesses: Player[]) => guesses.map((g) => compare(g, target, DAY));

/** Azar fijo: 0 elige el primero de los disponibles, 0.999 el último. */
const first = () => 0;
const last = () => 0.999;

describe("availableHints / pickHint", () => {
  it("sin aciertos ni pistas, sortea del grupo principal (país, club, posición)", () => {
    const r = results(guess({}), guess({}));
    expect(availableHints(r, [])).toEqual(["pais", "club", "posicion"]);
    expect(pickHint(r, [], first)).toBe("pais");
    expect(pickHint(r, [], last)).toBe("posicion");
  });

  it("no da una pista de un atributo ya acertado en algún intento", () => {
    const r = results(guess({ nacionalidad: "Argentina" }), guess({ club: "Universitario" }));
    expect(availableHints(r, [])).toEqual(["posicion"]);
    for (const x of [0, 0.3, 0.6, 0.999]) expect(pickHint(r, [], () => x)).toBe("posicion");
  });

  it("no repite una pista ya dada", () => {
    const r = results(guess({}), guess({}));
    expect(availableHints(r, ["club"])).toEqual(["pais", "posicion"]);
  });

  it("cae al grupo secundario cuando el principal ya está descubierto", () => {
    const r = results(guess({ nacionalidad: "Argentina", club: "Universitario" }), guess({}));
    // Posición dada como pista + país y club en verde → grupo secundario.
    expect(availableHints(r, ["posicion"])).toEqual(SECONDARY_HINTS);
    expect(pickHint(r, ["posicion"], first)).toBe("inicial");
  });

  it("en el grupo secundario tampoco da pie o edad si ya salieron en verde", () => {
    const r = results(
      guess({ nacionalidad: "Argentina", club: "Universitario", posicion: "DEF" }),
      guess({ pie: "I", fechaNacimiento: "1992-06-01" }),
    );
    expect(availableHints(r, [])).toEqual(["inicial"]);
  });

  it("un amarillo (cerca) no cuenta como descubierto", () => {
    const r = results(guess({ posicion: "MED" }), guess({}));
    expect(r[0].posicion.status).toBe("close");
    expect(availableHints(r, [])).toContain("posicion");
  });

  it("máximo 2 pistas por partida", () => {
    const r = results(guess({}), guess({}));
    expect(MAX_HINTS).toBe(2);
    const given: HintType[] = [];
    for (let i = 0; i < 5; i++) {
      const h = pickHint(r, given, first);
      if (h) given.push(h);
    }
    expect(given).toEqual(["pais", "club"]);
    expect(pickHint(r, given, first)).toBeNull();
  });

  it("devuelve null si no queda nada por revelar", () => {
    const r = results(
      guess({ nacionalidad: "Argentina", club: "Universitario", posicion: "DEF", pie: "I", fechaNacimiento: "1992-01-01" }),
    );
    expect(availableHints(r, ["inicial"])).toEqual([]);
    expect(pickHint(r, ["inicial"], first)).toBeNull();
  });
});

describe("hintButtonState", () => {
  const base = { hintsUsed: 0, remaining: 3, over: false };

  it("el botón aparece solo desde el 2.º intento fallido", () => {
    expect(hintButtonState({ ...base, failedGuesses: 0 })).toBe("hidden");
    expect(hintButtonState({ ...base, failedGuesses: 1 })).toBe("hidden");
    expect(hintButtonState({ ...base, failedGuesses: 2 })).toBe("ready");
    expect(hintButtonState({ ...base, failedGuesses: 5 })).toBe("ready");
  });

  it("'Sin pistas' tras 2 pistas o si no queda nada por revelar", () => {
    expect(hintButtonState({ ...base, failedGuesses: 3, hintsUsed: 2 })).toBe("none-left");
    expect(hintButtonState({ ...base, failedGuesses: 3, remaining: 0 })).toBe("none-left");
  });

  it("deshabilitado al terminar la partida, pero oculto si nunca hubo 2 fallos", () => {
    expect(hintButtonState({ ...base, failedGuesses: 6, over: true })).toBe("ended");
    expect(hintButtonState({ ...base, failedGuesses: 1, over: true })).toBe("hidden");
  });
});

describe("describeHint", () => {
  it("textos visibles y para lectores de pantalla", () => {
    expect(describeHint("pais", target, DAY)).toEqual({ label: "País", value: "Argentina", spoken: "el país es Argentina" });
    expect(describeHint("club", target, DAY).value).toBe("Universitario");
    expect(describeHint("posicion", target, DAY).value).toBe("Defensa");
    expect(describeHint("pie", target, DAY).value).toBe("Zurdo");
    expect(describeHint("inicial", target, DAY)).toMatchObject({ value: "Empieza con D", spoken: "el apellido empieza con D" });
  });

  it("rango de edad de 5 años que contiene la edad real, a la fecha de la partida", () => {
    expect(describeHint("edad", target, DAY).value).toBe("Entre 30 y 34 años");
    // Cumple 35 el 2027-11-19.
    expect(describeHint("edad", target, "2027-11-19").value).toBe("Entre 35 y 39 años");
    expect(ageRange(19)).toEqual([15, 19]);
    expect(ageRange(20)).toEqual([20, 24]);
  });

  it("inicial del apellido: última palabra o la partícula que la precede", () => {
    expect(surnameInitial("Diego Romero")).toBe("R");
    expect(surnameInitial("José Luis Sinisterra")).toBe("S");
    expect(surnameInitial("Matías Di Benedetto")).toBe("D");
    expect(surnameInitial("Juan de la Cruz")).toBe("D");
    expect(surnameInitial("Ángel Ojeda")).toBe("O");
    expect(surnameInitial("Ronaldinho")).toBe("R");
  });
});
