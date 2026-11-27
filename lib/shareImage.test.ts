import { describe, expect, it } from "vitest";
import type { CompareResult, Status } from "./compare";
import { CREST_OUTLINE, CREST_PATH, CREST_SIGLA_SIZE, getCrest } from "./crests";
import { ATTRIBUTES } from "./share";
import {
  CARD_COLORS,
  CARD_CREST_SIZE,
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
  targetClub: "ADT",
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
      club: "ADT",
      challenge: false,
    });
  });

  it("perdió: X/6 y la frase de derrota, con el nombre fuera de retos", () => {
    const c = shareCardContent({ ...base, results: Array(6).fill(MISS), won: false, points: 160 });
    expect(c).toMatchObject({ attempts: "X/6", headline: "No pude adivinar al jugador", playerName: "Ángel Ojeda" });
  });

  it("en un reto de amigos nunca lleva el nombre ni el club, gane o pierda", () => {
    for (const won of [true, false]) {
      expect(shareCardContent({ ...base, won, challenge: true })).toMatchObject({ playerName: null, club: null });
    }
  });

  it("el nivel solo aparece en Fácil", () => {
    expect(shareCardContent({ ...base, nivel: "facil" }).nivel).toBe("FÁCIL");
    expect(shareCardContent(base).nivel).toBeNull();
  });
});

describe("layoutShareCard", () => {
  it("dibuja título, puntaje, N/6, frase, nombre y el pie", () => {
    const t = texts(layoutShareCard(shareCardContent(base)));
    expect(t).toEqual(["FUTBOL", "AZO", "650", "PTS", "4/6", "·", "1", "Lo adiviné en 4 intentos", "ÁNGEL OJEDA", "ADT", SHARE_IMAGE_FOOTER]);
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
    expect(texts(noHints)).toEqual(["FUTBOL", "AZO", "650", "PTS", "4/6", "Lo adiviné en 4 intentos", "ÁNGEL OJEDA", "ADT", SHARE_IMAGE_FOOTER]);
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

  it("reto de amigos: 'Reto de amigos' en lugar del nombre, sin escudo ni club", () => {
    const ops = layoutShareCard(shareCardContent({ ...base, challenge: true }));
    const t = texts(ops);
    expect(t).toContain(CHALLENGE_LABEL.toUpperCase());
    expect(t.join(" ").toLowerCase()).not.toContain("ojeda");
    expect(t).not.toContain("ADT");
    expect(items(ops).some((i) => i.type === "crest")).toBe(false);
  });

  it("debajo del nombre va el escudo del club (de lib/crests.ts) con el nombre del club al lado", () => {
    const ops = layoutShareCard(shareCardContent({ ...base, targetClub: "Cienciano" }));
    const nameRow = ops.findIndex((op) => op.kind === "row" && op.items.some((i) => i.type === "text" && i.text === "ÁNGEL OJEDA"));
    const crestRow = ops[nameRow + 1];
    expect(crestRow.kind).toBe("row");
    if (crestRow.kind !== "row") return;
    const [crest, club] = crestRow.items;
    expect(crest).toMatchObject({ type: "crest", crest: getCrest("Cienciano"), size: CARD_CREST_SIZE });
    expect(club).toMatchObject({ type: "text", text: "Cienciano" });
    // Centrado y debajo del nombre.
    expect(crestRow.x).toBe(CARD_WIDTH / 2);
    expect(opBounds(crestRow)!.top).toBeGreaterThanOrEqual(opBounds(ops[nameRow])!.bottom);
  });

  it("el escudo tiene entre 140 y 180 px de alto", () => {
    expect(CARD_CREST_SIZE).toBeGreaterThanOrEqual(140);
    expect(CARD_CREST_SIZE).toBeLessThanOrEqual(180);
  });

  it("un club sin escudo muestra solo su nombre", () => {
    const ops = layoutShareCard(shareCardContent({ ...base, targetClub: "Club Sin Escudo" }));
    expect(items(ops).some((i) => i.type === "crest")).toBe(false);
    expect(texts(ops)).toContain("Club Sin Escudo");
  });

  const LONG_NAME = "Maximiliano Amondarain Fernández de la Cruz";
  const SCENARIOS: [string, ShareCardInput][] = [
    ["ganó al primero", { ...base, results: [HIT] }],
    ["ganó al sexto con 2 pistas en Fácil", { ...base, results: [...Array(5).fill(MISS), HIT], hintsUsed: 2, nivel: "facil" }],
    ["perdió con 6 filas y 2 pistas", { ...base, results: Array(6).fill(MISS), won: false, hintsUsed: 2 }],
    ["reto con 6 filas", { ...base, results: Array(6).fill(MISS), won: false, challenge: true }],
    ["nombre y club largos con 6 filas", { ...base, results: Array(6).fill(MISS), won: false, targetName: LONG_NAME, targetClub: "Juan Pablo II College", hintsUsed: 2, nivel: "facil" }],
    ["club sin escudo con 6 filas", { ...base, results: Array(6).fill(MISS), won: false, targetClub: "Club Sin Escudo" }],
  ];

  it.each(SCENARIOS)("%s: todo queda dentro de los márgenes seguros", (_, input) => {
    for (const op of layoutShareCard(shareCardContent(input))) {
      const b = opBounds(op);
      if (!b) continue;
      expect(b.left).toBeGreaterThanOrEqual(SAFE_AREA.side);
      expect(b.right).toBeLessThanOrEqual(CARD_WIDTH - SAFE_AREA.side);
      expect(b.top).toBeGreaterThanOrEqual(SAFE_AREA.top);
      expect(b.bottom).toBeLessThanOrEqual(CARD_HEIGHT - SAFE_AREA.bottom);
    }
  });

  it.each(SCENARIOS)("%s: los bloques no se pisan", (_, input) => {
    const rows = layoutShareCard(shareCardContent(input))
      .map(opBounds)
      .filter((b): b is NonNullable<typeof b> => !!b)
      .sort((a, b) => a.top - b.top);
    // Las celdas de una misma fila comparten alto: se agrupan por `top`.
    const bands = [...new Map(rows.map((b) => [b.top, b])).values()];
    for (let i = 1; i < bands.length; i++) expect(bands[i].top).toBeGreaterThanOrEqual(bands[i - 1].bottom);
  });

  it("con 6 filas y escudo, la grilla mantiene cuadraditos legibles (≥ 48 px)", () => {
    const grid = cells(layoutShareCard(shareCardContent(SCENARIOS[2][1])));
    expect(grid).toHaveLength(36);
    expect(grid[0].w).toBeGreaterThanOrEqual(48);
  });
});

/** Contexto 2D simulado: cada letra mide `size × 0.5`. */
function fakeContext() {
  const calls: { text: string; x: number; font: string; fill: unknown }[] = [];
  const log: string[] = [];
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
    measureText: (t: string) => ({ width: t.length * Number(/([\d.]+)px/.exec(font)![1]) * 0.5 }),
    fillText(t: string, x: number) {
      calls.push({ text: t, x, font, fill: this.fillStyle });
    },
    fillRect(x: number, y: number, w: number, h: number) {
      log.push(`fillRect ${this.fillStyle} ${x},${y},${w},${h}`);
    },
    beginPath: () => {},
    roundRect: () => {},
    arc: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {},
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    save: () => log.push("save"),
    restore: () => log.push("restore"),
    translate: (x: number, y: number) => log.push(`translate ${x},${y}`),
    scale: (x: number) => log.push(`scale ${x}`),
    clip: (p: { d: string }) => log.push(`clip ${p.d}`),
    stroke(p: { d: string }) {
      log.push(`stroke ${p.d} ${this.strokeStyle} ${this.lineWidth}`);
    },
    lineWidth: 1,
    strokeStyle: "" as unknown,
  };
  return { ctx: ctx as unknown as CardContext, calls, log };
}

/** `Path2D` simulado: guarda el trazado. */
const fakePath = (d: string) => ({ d }) as unknown as Path2D;

const FONTS = { display: "'Barlow Condensed'", sans: "Inter" };

describe("drawShareCard", () => {
  it("dibuja cada texto con la fuente del juego", () => {
    const { ctx, calls } = fakeContext();
    drawShareCard(ctx, layoutShareCard(shareCardContent(base)), FONTS, fakePath);
    // Los textos de la tarjeta, más la sigla del escudo antes del nombre del club.
    const expected = texts(layoutShareCard(shareCardContent(base)));
    expected.splice(expected.indexOf("ADT"), 0, "ADT");
    expect(calls.map((c) => c.text)).toEqual(expected);
    expect(calls[0].font).toBe("italic 800 150px 'Barlow Condensed'");
    expect(calls.at(-1)!.font).toBe("600 40px Inter");
  });

  it("un nombre muy largo se achica hasta caber en el ancho seguro", () => {
    const { ctx, calls } = fakeContext();
    const longName = "Maximiliano Amondarain Fernández de la Cruz";
    drawShareCard(ctx, layoutShareCard(shareCardContent({ ...base, targetName: longName })), FONTS, fakePath);
    const name = calls.find((c) => c.text === longName.toUpperCase())!;
    const size = Number(/([\d.]+)px/.exec(name.font)![1]);
    expect(size).toBeLessThan(80);
    const width = name.text.length * size * 0.5;
    expect(name.x).toBeGreaterThanOrEqual(SAFE_AREA.side - 1);
    expect(name.x + width).toBeLessThanOrEqual(CARD_WIDTH - SAFE_AREA.side + 1);
  });

  it("fontsToLoad pide cada combinación de peso y estilo una sola vez", () => {
    const list = fontsToLoad(layoutShareCard(shareCardContent(base)), FONTS);
    expect(new Set(list).size).toBe(list.length);
    expect(list).toContain("italic 800 150px 'Barlow Condensed'");
    expect(list).toContain("600 44px Inter");
    // La sigla del escudo (3 letras: ADT).
    expect(list).toContain(`800 ${CREST_SIGLA_SIZE[3]}px 'Barlow Condensed'`);
  });

  it.each([
    ["Cienciano", "jefe", "CIE"],
    ["Melgar", "punta", "FBC"],
    ["Universitario", "borde", "U"],
  ])("%s: el escudo se dibuja con el trazado y las medidas de la página (%s, %s)", (club, pattern, sigla) => {
    const { ctx, calls, log } = fakeContext();
    const crest = getCrest(club)!;
    drawShareCard(ctx, layoutShareCard(shareCardContent({ ...base, targetClub: club })), FONTS, fakePath);
    const scale = CARD_CREST_SIZE / 28;
    expect(log).toContain(`scale ${scale}`);
    expect(log).toContain(`clip ${CREST_PATH}`);
    expect(log).toContain(`fillRect ${crest.primary} 0,0,24,28`);
    if (pattern === "jefe") expect(log).toContain(`fillRect ${crest.secondary} 0,0,24,8`);
    if (pattern === "punta") expect(log).toContain(`fillRect ${crest.secondary} 0,19.5,24,28`);
    if (pattern === "borde") expect(log).toContain(`stroke ${CREST_PATH} ${crest.secondary} 5`);
    expect(log).toContain(`stroke ${CREST_PATH} ${CREST_OUTLINE.color} ${CREST_OUTLINE.width}`);
    const siglaCall = calls.find((c) => c.text === sigla)!;
    expect(siglaCall.font).toBe(`800 ${CREST_SIGLA_SIZE[sigla.length]}px 'Barlow Condensed'`);
  });

  it("en un reto no se dibuja ningún escudo", () => {
    const { ctx, log } = fakeContext();
    drawShareCard(ctx, layoutShareCard(shareCardContent({ ...base, challenge: true })), FONTS, fakePath);
    expect(log.some((l) => l.startsWith("clip"))).toBe(false);
  });
});
