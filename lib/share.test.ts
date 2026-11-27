import { describe, expect, it } from "vitest";
import { players } from "../data/players";
import { compare } from "./compare";
import { buildShareText, shareSentence, type ShareInput } from "./share";

describe("buildShareText", () => {
  const day = "2026-11-26";
  const [a, b] = players;
  const miss = () => compare(b, a, day);
  const hit = () => compare(a, a, day);
  const input = (over: Partial<ShareInput>): ShareInput => ({
    results: [miss(), hit()],
    won: true,
    points: 1050,
    targetName: a.nombre,
    url: "https://futbolazo.pe/",
    ...over,
  });

  it("encabezado con puntaje, filas de emojis, frase con el jugador y URL al final", () => {
    const text = buildShareText(input({}));
    expect(text.split("\n")).toEqual([
      "Futbolazo 🇵🇪 2/6 · 1050 pts",
      "",
      expect.stringMatching(/^[🟩🟨⬜]{6}$/u),
      "🟩🟩🟩🟩🟩🟩",
      "",
      `Me tomó 2 intentos adivinar que el jugador era ${a.nombre}`,
      "",
      "https://futbolazo.pe/",
    ]);
  });

  it("ejemplo del encabezado con pista: 4/6 💡1 · 650 pts", () => {
    const results = [miss(), miss(), miss(), hit()];
    expect(buildShareText(input({ results, hintsUsed: 1, points: 650 })).split("\n")[0]).toBe(
      "Futbolazo 🇵🇪 4/6 💡1 · 650 pts",
    );
  });

  it("sin pistas el encabezado no lleva 💡", () => {
    const results = [miss(), miss(), miss(), hit()];
    expect(buildShareText(input({ results, points: 750 })).split("\n")[0]).toBe("Futbolazo 🇵🇪 4/6 · 750 pts");
    expect(buildShareText(input({ results, points: 750, hintsUsed: 0 })).split("\n")[0]).toBe(
      "Futbolazo 🇵🇪 4/6 · 750 pts",
    );
  });

  it("al perder usa X/6, la frase de derrota y el puntaje parcial", () => {
    const results = Array.from({ length: 6 }, miss);
    const lines = buildShareText(input({ results, won: false, points: 60, hintsUsed: 2 })).split("\n");
    expect(lines[0]).toBe("Futbolazo 🇵🇪 X/6 💡2 · 60 pts");
    expect(lines.at(-3)).toBe(`No pude adivinar que el jugador era ${a.nombre}`);
    expect(lines.at(-1)).toBe("https://futbolazo.pe/");
  });

  it("al primer intento usa la frase en singular", () => {
    const text = buildShareText(input({ results: [hit()], points: 1200 }));
    expect(text).toContain(`Lo adiviné al primer intento: ${a.nombre}`);
    expect(text).not.toContain("intentos");
  });

  it("solo nombra al jugador secreto, nunca a los intentados", () => {
    const text = buildShareText(input({}));
    expect(text).toContain(a.nombre);
    expect(text).not.toContain(b.nombre);
  });

  it("en Fácil el encabezado termina con · Fácil; en Normal no menciona el nivel", () => {
    const results = [miss(), miss(), miss(), hit()];
    const header = (over: Partial<ShareInput>) => buildShareText(input({ results, points: 650, hintsUsed: 1, ...over })).split("\n")[0];
    expect(header({ nivel: "facil" })).toBe("Futbolazo 🇵🇪 4/6 💡1 · 650 pts · Fácil");
    expect(header({ nivel: "normal" })).toBe("Futbolazo 🇵🇪 4/6 💡1 · 650 pts");
    expect(header({})).toBe("Futbolazo 🇵🇪 4/6 💡1 · 650 pts");
    expect(buildShareText(input({ results: Array.from({ length: 6 }, miss), won: false, points: 0, nivel: "facil" })).split("\n")[0]).toBe(
      "Futbolazo 🇵🇪 X/6 · 0 pts · Fácil",
    );
  });

  it("reto: línea 🏆 Reto de amigos, link del reto al final y sin nombre del jugador", () => {
    const url = "https://futbolazo.pe/?reto=k3x9q2m";
    const results = [miss(), miss(), miss(), hit()];
    const lines = buildShareText(input({ results, points: 650, hintsUsed: 1, nivel: "facil", url, challenge: true })).split("\n");
    expect(lines).toEqual([
      "Futbolazo 🇵🇪 4/6 💡1 · 650 pts · Fácil",
      "🏆 Reto de amigos",
      "",
      expect.any(String),
      expect.any(String),
      expect.any(String),
      "🟩🟩🟩🟩🟩🟩",
      "",
      "Me tomó 4 intentos adivinar al jugador misterioso",
      "",
      url,
    ]);
    expect(lines.join("\n")).not.toContain(a.nombre);
  });

  it("reto: frases sin nombre al primer intento y al perder", () => {
    const share = (over: Partial<ShareInput>) => buildShareText(input({ challenge: true, ...over }));
    expect(share({ results: [hit()] })).toContain("Lo adiviné al primer intento\n");
    expect(share({ results: Array.from({ length: 6 }, miss), won: false })).toContain("No pude adivinar al jugador misterioso");
  });

  it("partida normal no lleva la línea del reto", () => {
    expect(buildShareText(input({}))).not.toContain("Reto de amigos");
  });

  it("no agrega caracteres de formato de WhatsApp", () => {
    expect(buildShareText(input({ targetName: "Paolo Guerrero" }))).not.toMatch(/[*_~]/);
  });
});

describe("shareSentence", () => {
  it("singular, plural y derrota", () => {
    expect(shareSentence(true, 1, "Paolo Guerrero")).toBe("Lo adiviné al primer intento: Paolo Guerrero");
    expect(shareSentence(true, 2, "Paolo Guerrero")).toBe("Me tomó 2 intentos adivinar que el jugador era Paolo Guerrero");
    expect(shareSentence(true, 6, "Paolo Guerrero")).toBe("Me tomó 6 intentos adivinar que el jugador era Paolo Guerrero");
    expect(shareSentence(false, 6, "Paolo Guerrero")).toBe("No pude adivinar que el jugador era Paolo Guerrero");
  });
});
