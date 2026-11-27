import { describe, expect, it } from "vitest";
import { players } from "../data/players";
import { compare } from "./compare";
import { buildShareText } from "./share";

describe("buildShareText", () => {
  const day = "2026-11-26";
  const [a, b] = players;

  it("arma título sin número de puzzle, filas de emojis y URL", () => {
    const results = [compare(b, a, day), compare(a, a, day)];
    const text = buildShareText(results, true, "https://futbolazo.pe/");
    const lines = text.split("\n");
    expect(lines[0]).toBe("Futbolazo 🇵🇪 2/6");
    expect(lines[3]).toBe("🟩🟩🟩🟩🟩🟩");
    expect(lines.at(-1)).toBe("https://futbolazo.pe/");
  });

  it("usa X/6 al perder", () => {
    const results = Array.from({ length: 6 }, () => compare(b, a, day));
    expect(buildShareText(results, false, "u").split("\n")[0]).toBe("Futbolazo 🇵🇪 X/6");
  });

  it("sin pistas el título queda igual; con pistas agrega 💡N", () => {
    const results = [compare(b, a, day), compare(b, a, day), compare(b, a, day), compare(a, a, day)];
    expect(buildShareText(results, true, "u").split("\n")[0]).toBe("Futbolazo 🇵🇪 4/6");
    expect(buildShareText(results, true, "u", 0).split("\n")[0]).toBe("Futbolazo 🇵🇪 4/6");
    expect(buildShareText(results, true, "u", 1).split("\n")[0]).toBe("Futbolazo 🇵🇪 4/6 💡1");
    expect(buildShareText(results.slice(0, 3), false, "u", 2).split("\n")[0]).toBe("Futbolazo 🇵🇪 X/6 💡2");
  });

  it("no incluye nombres de jugadores", () => {
    const text = buildShareText([compare(b, a, day), compare(a, a, day)], true, "u");
    for (const p of players) expect(text).not.toContain(p.nombre);
  });
});
