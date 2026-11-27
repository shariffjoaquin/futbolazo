import { describe, expect, it } from "vitest";
import { players, type Player } from "../data/players";
import {
  buildInviteText,
  challengerLine,
  challengeUrl,
  CODE_LENGTH,
  decodeChallenge,
  encodeChallenge,
  INVITE_TEXT,
  normalizeCode,
} from "./challenge";
import { NIVELES } from "./difficulty";

const [a, b] = players;

describe("encodeChallenge", () => {
  it("código corto de 7 caracteres [0-9a-z], estable", () => {
    const code = encodeChallenge(a.id, "normal");
    expect(code).toMatch(/^[0-9a-z]{7}$/);
    expect(code).toHaveLength(CODE_LENGTH);
    expect(encodeChallenge(a.id, "normal")).toBe(code);
  });

  it("ofuscado: no contiene el id ni partes del nombre", () => {
    for (const p of players) {
      const code = encodeChallenge(p.id, "facil");
      for (const part of p.id.split("-").filter((w) => w.length >= 3)) expect(code).not.toContain(part);
    }
  });

  it("el nivel cambia el código", () => {
    expect(encodeChallenge(a.id, "facil")).not.toBe(encodeChallenge(a.id, "normal"));
  });

  it("no hay dos combinaciones jugador + nivel de la lista con el mismo código", () => {
    const codes = players.flatMap((p) => NIVELES.map((n) => encodeChallenge(p.id, n)));
    expect(new Set(codes).size).toBe(players.length * NIVELES.length);
  });
});

describe("decodeChallenge", () => {
  it("ida y vuelta para cada jugador y nivel", () => {
    for (const p of players) {
      for (const nivel of NIVELES) {
        const code = encodeChallenge(p.id, nivel);
        expect(decodeChallenge(code)).toEqual({ code, targetId: p.id, nivel });
      }
    }
  });

  it("tolera mayúsculas, espacios y signos pegados al copiar", () => {
    const code = encodeChallenge(b.id, "facil");
    for (const raw of [code.toUpperCase(), ` ${code} `, `${code}.`, `${code}!`, `${code.slice(0, 3)}-${code.slice(3)}`]) {
      expect(decodeChallenge(raw)?.targetId).toBe(b.id);
    }
  });

  it("código inválido → null", () => {
    for (const raw of [null, undefined, "", "abc", "zzzzzzzz", "0000000", "ñññññññ", "a".repeat(200)]) {
      expect(decodeChallenge(raw)).toBeNull();
    }
  });

  it("si el jugador ya no existe en la lista → null", () => {
    const code = encodeChallenge(a.id, "normal");
    const sinA: Player[] = players.filter((p) => p.id !== a.id);
    expect(decodeChallenge(code, sinA)).toBeNull();
  });

  it("no depende del orden de la lista", () => {
    const code = encodeChallenge(a.id, "normal");
    expect(decodeChallenge(code, [...players].reverse())?.targetId).toBe(a.id);
  });

  it("normalizeCode", () => {
    expect(normalizeCode(" AbC-12.3 ")).toBe("abc123");
  });
});

describe("challengeUrl", () => {
  it("arma /?reto=CODIGO sobre la URL del juego, sin otros parámetros", () => {
    expect(challengeUrl("https://futbolazo.pe/", "k3x9q2m")).toBe("https://futbolazo.pe/?reto=k3x9q2m");
    expect(challengeUrl("https://futbolazo.pe/?reto=viejo&x=1#a", "k3x9q2m")).toBe("https://futbolazo.pe/?reto=k3x9q2m");
  });
});

describe("invitación", () => {
  const url = "https://futbolazo.pe/?reto=k3x9q2m";

  it("sin resultado: texto fijo y link al final", () => {
    expect(buildInviteText(url)).toBe(`${INVITE_TEXT}\n\n${url}`);
    expect(INVITE_TEXT).toBe(
      "Te reto a adivinar al jugador misterioso de Futbolazo ⚽ ¿Lo adivinas en menos intentos que yo?",
    );
  });

  it("con resultado de quien reta, sin nombre", () => {
    const text = buildInviteText(url, { won: true, attempts: 4, points: 650 });
    expect(text.split("\n")).toEqual([INVITE_TEXT, "Yo lo saqué en 4/6 · 650 pts", "", url]);
    for (const p of players) expect(text).not.toContain(p.nombre);
  });

  it("si quien reta perdió", () => {
    expect(challengerLine({ won: false, attempts: 6, points: 120 })).toBe("Yo no lo saqué: X/6 · 120 pts");
  });
});
