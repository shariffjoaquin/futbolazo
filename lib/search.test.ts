import { describe, expect, it } from "vitest";
import { players, type Player } from "../data/players";
import { MAX_QUERY_LENGTH, normalizeName, searchPlayers } from "./search";

const make = (id: string, nombre: string): Player => ({ ...players[0], id, nombre });
const list = [make("a", "Yeferson Rondón"), make("b", "Ánderson Santamaría"), make("c", "Hernán Barcos")];

describe("searchPlayers", () => {
  it("encuentra sin tildes ni mayúsculas", () => {
    expect(searchPlayers("rondon", [], list).map((p) => p.id)).toEqual(["a"]);
    expect(searchPlayers("  ANDERSON ", [], list).map((p) => p.id)).toEqual(["b"]);
  });

  it("no sugiere a los ya intentados ni busca con texto vacío", () => {
    expect(searchPlayers("an", ["b"], list).map((p) => p.id)).toEqual(["c"]);
    expect(searchPlayers("   ", [], list)).toEqual([]);
  });

  it("los nombres reales caben en el máximo", () => {
    for (const p of players) expect(p.nombre.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH);
  });

  describe("entradas hostiles", () => {
    it("una etiqueta de script es solo texto: no encuentra a nadie", () => {
      expect(searchPlayers('<script>alert("x")</script>', [], list)).toEqual([]);
      expect(searchPlayers("<img src=x onerror=alert(1)>", [], list)).toEqual([]);
    });

    it("caracteres especiales de regex no rompen la búsqueda", () => {
      expect(searchPlayers(".*", [], list)).toEqual([]);
      expect(searchPlayers("(((", [], list)).toEqual([]);
      expect(searchPlayers("\\", [], list)).toEqual([]);
    });

    it("una cadena enorme se recorta y responde rápido", () => {
      const huge = "barcos" + "x".repeat(1_000_000);
      const start = performance.now();
      expect(searchPlayers(huge, [], players)).toEqual([]);
      expect(performance.now() - start).toBeLessThan(100);
      // Se recorta al máximo: lo que va antes del corte sí cuenta.
      expect(searchPlayers("barcos" + " ".repeat(10_000), [], list).map((p) => p.id)).toEqual(["c"]);
    });

    it("emojis, nulos y caracteres de control no rompen nada", () => {
      expect(() => searchPlayers("⚽🇵🇪\u0000‮", [], list)).not.toThrow();
      expect(normalizeName("\u0000")).toBe("\u0000");
    });
  });
});
