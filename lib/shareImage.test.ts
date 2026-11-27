import { describe, expect, it } from "vitest";
import type { CompareResult, Status } from "./compare";
import { ATTRIBUTES } from "./share";
import {
  CARD_COLORS,
  CARD_HEIGHT,
  CARD_WIDTH,
  CHALLENGE_LABEL,
  drawShareCard,
  fontsToLoad,
  layoutShareCard,
  opBounds,
  resultHeadline,
  SAFE_AREA,
  SHARE_IMAGE_FOOTER,
  shareCardContent,
  type CardContext,
  type DrawOp,
  type InlineItem,
  type ShareCardInput,
} from "./shareImage";

function result(statuses: Status[]): CompareResult {
  const entries = ATTRIBUTES.map((a, i) => [a, { status: statuses[i] }]);
  return { ...Object.fromEntries(entries), isCorrect: statuses.every((s) => s === "correct") } as CompareResult;
}

const MISS = result(["wrong", "correct", "close", "wrong", "close", "correct"]);
const HIT = result(["correct", "correct", "correct", "correct", "correct", "correct"]);

const base: ShareCardInput = {
  results: [MISS, MISS, MISS, HIT],
  won: true,
  points: 650,
  targetName: "Ángel Ojeda",
  hintsUsed: 1,
  nivel: "normal",
  challenge: false,
};

/** Todos los textos que se dibujan, en orden. */
const texts = (ops: DrawOp[]) =>
  ops.flatMap((op) => (op.kind === "row" ? op.items.flatMap((i) => (i.type === "text" ? [i.text] : [])) : []));
const items = (ops: DrawOp[]): InlineItem[] => ops.flatMap((op) => (op.kind === "row" ? op.items : []));
const cells = (ops: DrawOp[]) =>
  ops.filter((op): op is Extract<DrawOp, { kind: "rect" }> => op.kind === "rect" && op.w === op.h);

describe("resultHeadline", () => {
  it("dice en cuántos intentos se adivinó, sin el nombre", () => {
    expect(resultHeadline(true, 1)).toBe("Lo adiviné al primer intento");
    expect(resultHeadline(true, 4)).toBe("Lo adiviné en 4 intentos");
    expect(resultHeadline(true, 6)).toBe("Lo adiviné en 6 intentos");
    expect(resultHeadline(false, 6)).toBe("No pude adivinar al jugador");
  });
});

describe("shareCardContent", () => {
  it("ganó: N/6, puntaje, frase, nombre y filas", () => {
    expect(shareCardContent(base)).toEqual({
      rows: [
        ["wrong", "correct", "close", "wrong", "close", "correct"],
        ["wrong", "correct", "close", "wrong", "close", "correct"],
        ["wrong", "correct", "close", "wrong", "close", "correct"],
        ["correct", "correct", "correct", "correct", "correct", "correct"],
      ],
      attempts: "4/6",
      points: "650",
      hints: 1,
      nivel: null,
      headline: "Lo adiviné en 4 intentos",
      playerName: "Ángel Ojeda",
      challenge: false,
    });
  });

  it("perdió: X/6 y la frase de derrota, con el nombre fuera de retos", () => {
    const c = shareCardContent({ ...base, results: Array(6).fill(MISS), won: false, points: 160 });
    expect(c).toMatchObject({ attempts: "X/6", headline: "No pude adivinar al jugador", playerName: "Ángel Ojeda" });
  });

  it("en un reto de amigos nunca lleva el nombre, gane o pierda", () => {
    expect(shareCardContent({ ...base, challenge: true }).playerName).toBeNull();
    expect(shareCardContent({ ...base, won: false, challenge: true }).playerName).toBeNull();
  });

  it("el nivel solo aparece en Fácil", () => {
    expect(shareCardContent({ ...base, nivel: "facil" }).nivel).toBe("FÁCIL");
    expect(shareCardContent(base).nivel).toBeNull();
  });
});

describe("layoutShareCard", () => {
  it("dibuja título, puntaje, N/6, frase, nombre y el pie", () => {
    const t = texts(layoutShareCard(shareCardContent(base)));
    expect(t).toEqual(["FUTBOL", "AZO", "650", "PTS", "4/6", "·", "1", "Lo adiviné en 4 intentos", "ÁNGEL OJEDA", SHARE_IMAGE_FOOTER]);
  });

  it("'AZO' va en rojo y 'FUTBOL' en blanco, en la fuente de títulos", () => {
    const [futbol, azo] = items(layoutShareCard(shareCardContent(base)));
    expect(futbol).toMatchObject({ text: "FUTBOL", color: CARD_COLORS.white, font: { role: "display" } });
    expect(azo).toMatchObject({ text: "AZO", color: CARD_COLORS.red, font: { role: "display" } });
  });

  it("franja rojo-blanco-rojo bajo el título", () => {
    const stripes = layoutShareCard(shareCardContent(base)).filter((op) => op.kind === "rect" && op.w !== op.h);
    expect(stripes.map((s) => (s.kind === "rect" ? s.color : ""))).toEqual([CARD_COLORS.red, CARD_COLORS.white, CARD_COLORS.red]);
  });

  it("una celda por categoría e intento, con el color de su resultado, y sin textos de pistas", () => {
    const ops = layoutShareCard(shareCardContent(base));
    const grid = cells(ops);
    expect(grid).toHaveLength(4 * ATTRIBUTES.length);
    expect(grid.slice(0, 6).map((c) => c.color)).toEqual(
      ["wrong", "correct", "close", "wrong", "close", "correct"].map((s) => CARD_COLORS.status[s as Status]),
    );
    expect(grid.slice(-6).every((c) => c.color === CARD_COLORS.status.correct)).toBe(true);
    for (const word of ["Club", "País", "Pos", "Edad", "Dorsal", "Pie"]) expect(texts(ops).join(" ")).not.toContain(word);
  });

  it("la pista es una bombilla dibujada con el número; sin pistas no hay bombilla", () => {
    const withHints = items(layoutShareCard(shareCardContent({ ...base, hintsUsed: 2 })));
    expect(withHints.filter((i) => i.type === "bulb")).toHaveLength(1);
    expect(texts(layoutShareCard(shareCardContent({ ...base, hintsUsed: 2 })))).toContain("2");
    const noHints = layoutShareCard(shareCardContent({ ...base, hintsUsed: 0 }));
    expect(items(noHints).some((i) => i.type === "bulb")).toBe(false);
    expect(texts(noHints)).toEqual(["FUTBOL", "AZO", "650", "PTS", "4/6", "Lo adiviné en 4 intentos", "ÁNGEL OJEDA", SHARE_IMAGE_FOOTER]);
  });

  it("ningún texto usa emoji", () => {
    for (const ops of [layoutShareCard(shareCardContent(base)), layoutShareCard(shareCardContent({ ...base, challenge: true, nivel: "facil" }))]) {
      for (const t of texts(ops)) expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("Fácil agrega FÁCIL en la línea de N/6", () => {
    const t = texts(layoutShareCard(shareCardContent({ ...base, nivel: "facil", hintsUsed: 0 })));
    expect(t.slice(4, 7)).toEqual(["4/6", "·", "FÁCIL"]);
  });

  it("reto de amigos: 'Reto de amigos' en lugar del nombre", () => {
    const t = texts(layoutShareCard(shareCardContent({ ...base, challenge: true })));
    expect(t).toContain(CHALLENGE_LABEL.toUpperCase());
    expect(t.join(" ").toLowerCase()).not.toContain("ojeda");
  });

  it.each([
    ["ganó al primero", { ...base, results: [HIT] }],
    ["ganó al sexto con 2 pistas en Fácil", { ...base, results: [...Array(5).fill(MISS), HIT], hintsUsed: 2, nivel: "facil" as const }],
    ["perdió", { ...base, results: Array(6).fill(MISS), won: false }],
    ["reto", { ...base, challenge: true }],
  ])("%s: todo queda dentro de los márgenes seguros", (_, input) => {
    for (const op of layoutShareCard(shareCardContent(input))) {
      const b = opBounds(op);
      if (!b) continue;
      expect(b.left).toBeGreaterThanOrEqual(SAFE_AREA.side);
      expect(b.right).toBeLessThanOrEqual(CARD_WIDTH - SAFE_AREA.side);
      expect(b.top).toBeGreaterThanOrEqual(SAFE_AREA.top);
      expect(b.bottom).toBeLessThanOrEqual(CARD_HEIGHT - SAFE_AREA.bottom);
    }
  });

  it("los bloques no se pisan: cada fila de texto empieza debajo de la anterior", () => {
    const rows = layoutShareCard(shareCardContent({ ...base, results: [...Array(5).fill(MISS), HIT] }))
      .map(opBounds)
      .filter((b): b is NonNullable<typeof b> => !!b)
      .sort((a, b) => a.top - b.top);
    // Las celdas de una misma fila comparten alto: se agrupan por `top`.
    const bands = [...new Map(rows.map((b) => [b.top, b])).values()];
    for (let i = 1; i < bands.length; i++) expect(bands[i].top).toBeGreaterThanOrEqual(bands[i - 1].bottom);
  });
});

/** Contexto 2D simulado: cada letra mide `size × 0.5`. */
function fakeContext() {
  const calls: { text: string; x: number; font: string; fill: unknown }[] = [];
  let font = "";
  const gradient = { addColorStop: () => {} };
  const ctx = {
    fillStyle: "" as unknown,
    textAlign: "start",
    textBaseline: "alphabetic",
    get font() {
      return font;
    },
    set font(f: string) {
      font = f;
    },
    measureText: (t: string) => ({ width: t.length * Number(/(\d+)px/.exec(font)![1]) * 0.5 }),
    fillText(t: string, x: number) {
      calls.push({ text: t, x, font, fill: this.fillStyle });
    },
    fillRect: () => {},
    beginPath: () => {},
    roundRect: () => {},
    arc: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {},
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  };
  return { ctx: ctx as unknown as CardContext, calls };
}

const FONTS = { display: "'Barlow Condensed'", sans: "Inter" };

describe("drawShareCard", () => {
  it("dibuja cada texto con la fuente del juego", () => {
    const { ctx, calls } = fakeContext();
    drawShareCard(ctx, layoutShareCard(shareCardContent(base)), FONTS);
    expect(calls.map((c) => c.text)).toEqual(texts(layoutShareCard(shareCardContent(base))));
    expect(calls[0].font).toBe("italic 800 170px 'Barlow Condensed'");
    expect(calls.at(-1)!.font).toBe("600 44px Inter");
  });

  it("un nombre muy largo se achica hasta caber en el ancho seguro", () => {
    const { ctx, calls } = fakeContext();
    const longName = "Maximiliano Amondarain Fernández de la Cruz";
    drawShareCard(ctx, layoutShareCard(shareCardContent({ ...base, targetName: longName })), FONTS);
    const name = calls.find((c) => c.text === longName.toUpperCase())!;
    const size = Number(/(\d+)px/.exec(name.font)![1]);
    expect(size).toBeLessThan(92);
    const width = name.text.length * size * 0.5;
    expect(name.x).toBeGreaterThanOrEqual(SAFE_AREA.side - 1);
    expect(name.x + width).toBeLessThanOrEqual(CARD_WIDTH - SAFE_AREA.side + 1);
  });

  it("fontsToLoad pide cada combinación de peso y estilo una sola vez", () => {
    const list = fontsToLoad(layoutShareCard(shareCardContent(base)), FONTS);
    expect(new Set(list).size).toBe(list.length);
    expect(list).toContain("italic 800 170px 'Barlow Condensed'");
    expect(list).toContain("600 50px Inter");
  });
});
