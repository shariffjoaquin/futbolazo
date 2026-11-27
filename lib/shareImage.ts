import type { CompareResult, Status } from "./compare";
import { NIVEL_LABEL, type Nivel } from "./difficulty";
import { ATTRIBUTES, MAX_GUESSES } from "./share";

/**
 * Tarjeta de resultado en PNG (formato Stories). Tres capas:
 * 1. `shareCardContent`: qué se muestra (pura).
 * 2. `layoutShareCard`: dónde y cómo se dibuja cada cosa (pura).
 * 3. `drawShareCard` / `createShareImage`: el dibujo en Canvas 2D (solo en el navegador).
 */

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;
/** Márgenes que tapan los textos y botones de Instagram Stories y TikTok. */
export const SAFE_AREA = { top: 260, bottom: 380, side: 120 } as const;
export const SHARE_IMAGE_FILENAME = "futbolazo-resultado.png";
export const SHARE_IMAGE_FOOTER = "futbolazo.app";
export const CHALLENGE_LABEL = "Reto de amigos";

/** Los colores del tema (`app/globals.css`). */
export const CARD_COLORS = {
  night: "#050d09",
  turfDark: "#0a2416",
  red: "#d91023",
  white: "#ffffff",
  ink: "#f3f8f4",
  muted: "#a9c2b4",
  gold: "#e9b949",
  status: { correct: "#2fbf5b", close: "#f5c518", wrong: "#2a3631" } satisfies Record<Status, string>,
} as const;

export interface ShareCardInput {
  results: CompareResult[];
  won: boolean;
  /** Puntaje total de la partida. */
  points: number;
  /** Nombre del jugador secreto. */
  targetName: string;
  hintsUsed: number;
  nivel: Nivel;
  /** Partida de reto de amigos: no se nombra al jugador. */
  challenge: boolean;
}

export interface ShareCardContent {
  /** Una fila por intento, con el resultado de cada categoría en orden. */
  rows: Status[][];
  /** "4/6" o "X/6". */
  attempts: string;
  points: string;
  hints: number;
  /** "FÁCIL", o `null` en Normal (no se menciona). */
  nivel: string | null;
  headline: string;
  /** Nombre del jugador secreto; `null` en un reto de amigos. */
  playerName: string | null;
  challenge: boolean;
}

/** Frase del resultado, sin el nombre del jugador. */
export function resultHeadline(won: boolean, attempts: number): string {
  if (!won) return "No pude adivinar al jugador";
  if (attempts === 1) return "Lo adiviné al primer intento";
  return `Lo adiviné en ${attempts} intentos`;
}

export function shareCardContent({
  results,
  won,
  points,
  targetName,
  hintsUsed,
  nivel,
  challenge,
}: ShareCardInput): ShareCardContent {
  return {
    rows: results.map((r) => ATTRIBUTES.map((a) => r[a].status)),
    attempts: `${won ? results.length : "X"}/${MAX_GUESSES}`,
    points: String(points),
    hints: Math.max(0, hintsUsed),
    nivel: nivel === "facil" ? NIVEL_LABEL.facil.toUpperCase() : null,
    headline: resultHeadline(won, results.length),
    // Misma regla que el texto: en un reto, el chat es donde otros lo van a jugar.
    playerName: challenge ? null : targetName,
    challenge,
  };
}

export type FontRole = "display" | "sans";

export interface FontSpec {
  role: FontRole;
  size: number;
  weight: number;
  italic?: boolean;
}

export type InlineItem =
  | { type: "text"; text: string; color: string; font: FontSpec }
  /** Bombilla dibujada (sin emoji): `size` es su alto. */
  | { type: "bulb"; size: number; color: string };

export type DrawOp =
  | { kind: "background" }
  | { kind: "rect"; x: number; y: number; w: number; h: number; radius: number; color: string }
  /**
   * Fila centrada en `x` con la línea de base en `y`. Si no cabe en `maxWidth`, se achica entera.
   * `height` es el alto de las letras más grandes (para calcular los márgenes).
   */
  | { kind: "row"; x: number; y: number; height: number; maxWidth: number; gap: number; items: InlineItem[] };

const CENTER = CARD_WIDTH / 2;
const CONTENT_WIDTH = CARD_WIDTH - SAFE_AREA.side * 2;
/** Parte de la fuente sobre la línea de base (las mayúsculas de Barlow e Inter quedan por debajo). */
const ASCENT = 0.8;
const DESCENT = 0.25;

const GRID = { top: 1045, cell: 56, gap: 12 } as const;
const GRID_MAX_HEIGHT = MAX_GUESSES * GRID.cell + (MAX_GUESSES - 1) * GRID.gap;

function text(text: string, color: string, font: FontSpec): InlineItem {
  return { type: "text", text, color, font };
}

function row(y: number, items: InlineItem[], gap = 0): DrawOp {
  const height = Math.max(
    ...items.map((i) => (i.type === "text" ? i.font.size * ASCENT : i.size)),
  );
  return { kind: "row", x: CENTER, y, height, maxWidth: CONTENT_WIDTH, gap, items };
}

/** Operaciones de dibujo de la tarjeta, de atrás hacia adelante. */
export function layoutShareCard(content: ShareCardContent): DrawOp[] {
  const ops: DrawOp[] = [{ kind: "background" }];
  const title: FontSpec = { role: "display", size: 170, weight: 800, italic: true };

  // Título: FUTBOL en blanco y AZO en rojo, como en el juego.
  ops.push(row(430, [text("FUTBOL", CARD_COLORS.white, title), text("AZO", CARD_COLORS.red, title)]));

  // Franja rojo-blanco-rojo.
  const stripe = { w: 120, h: 18, y: 475 };
  [CARD_COLORS.red, CARD_COLORS.white, CARD_COLORS.red].forEach((color, i) => {
    ops.push({ kind: "rect", x: CENTER - stripe.w * 1.5 + stripe.w * i, y: stripe.y, w: stripe.w, h: stripe.h, radius: 0, color });
  });

  // Puntaje en grande.
  ops.push(
    row(
      700,
      [
        text(content.points, CARD_COLORS.white, { role: "display", size: 200, weight: 800, italic: true }),
        text("PTS", CARD_COLORS.red, { role: "display", size: 80, weight: 800, italic: true }),
      ],
      20,
    ),
  );

  // N/6, pistas y nivel.
  const meta: FontSpec = { role: "display", size: 64, weight: 700 };
  const dot = () => text("·", CARD_COLORS.muted, meta);
  const metaItems: InlineItem[] = [text(content.attempts, CARD_COLORS.ink, meta)];
  if (content.hints > 0) {
    metaItems.push(dot(), { type: "bulb", size: 56, color: CARD_COLORS.gold }, text(String(content.hints), CARD_COLORS.gold, meta));
  }
  if (content.nivel) metaItems.push(dot(), text(content.nivel, CARD_COLORS.ink, meta));
  ops.push(row(812, metaItems, 18));

  // Frase y jugador (o "Reto de amigos").
  ops.push(row(890, [text(content.headline, CARD_COLORS.muted, { role: "sans", size: 50, weight: 600 })]));
  const name: FontSpec = { role: "display", size: 92, weight: 800, italic: true };
  ops.push(
    row(
      985,
      content.playerName !== null
        ? [text(content.playerName.toUpperCase(), CARD_COLORS.white, name)]
        : [text(CHALLENGE_LABEL.toUpperCase(), CARD_COLORS.gold, name)],
    ),
  );

  // Grilla de colores, centrada en su espacio.
  const height = content.rows.length * GRID.cell + Math.max(0, content.rows.length - 1) * GRID.gap;
  const top = GRID.top + (GRID_MAX_HEIGHT - height) / 2;
  const width = ATTRIBUTES.length * GRID.cell + (ATTRIBUTES.length - 1) * GRID.gap;
  content.rows.forEach((statuses, r) => {
    statuses.forEach((status, c) => {
      ops.push({
        kind: "rect",
        x: CENTER - width / 2 + c * (GRID.cell + GRID.gap),
        y: top + r * (GRID.cell + GRID.gap),
        w: GRID.cell,
        h: GRID.cell,
        radius: 12,
        color: CARD_COLORS.status[status],
      });
    });
  });

  ops.push(row(1525, [text(SHARE_IMAGE_FOOTER, CARD_COLORS.muted, { role: "sans", size: 44, weight: 600 })]));
  return ops;
}

/** Caja que ocupa una operación (para comprobar los márgenes seguros). El fondo no cuenta. */
export function opBounds(op: DrawOp): { left: number; top: number; right: number; bottom: number } | null {
  switch (op.kind) {
    case "background":
      return null;
    case "rect":
      return { left: op.x, top: op.y, right: op.x + op.w, bottom: op.y + op.h };
    case "row": {
      const descent = Math.max(0, ...op.items.map((i) => (i.type === "text" ? i.font.size * DESCENT : 0)));
      return { left: op.x - op.maxWidth / 2, top: op.y - op.height, right: op.x + op.maxWidth / 2, bottom: op.y + descent };
    }
  }
}

/** Familias de fuente para cada rol, como las usa CSS (`'Barlow Condensed', …`). */
export type CardFonts = Record<FontRole, string>;

export function fontString(font: FontSpec, fonts: CardFonts, scale = 1): string {
  return `${font.italic ? "italic " : ""}${font.weight} ${Math.round(font.size * scale)}px ${fonts[font.role]}`;
}

/** Lo que usa el dibujo del contexto 2D (así se puede probar con uno simulado). */
export type CardContext = Pick<
  CanvasRenderingContext2D,
  | "fillStyle"
  | "font"
  | "textAlign"
  | "textBaseline"
  | "fillRect"
  | "fillText"
  | "measureText"
  | "beginPath"
  | "roundRect"
  | "arc"
  | "moveTo"
  | "lineTo"
  | "closePath"
  | "fill"
  | "createLinearGradient"
  | "createRadialGradient"
>;

function drawBulb(ctx: CardContext, x: number, baseline: number, size: number, color: string) {
  const cx = x + size * 0.35;
  const top = baseline - size;
  ctx.fillStyle = color;
  // Globo.
  ctx.beginPath();
  ctx.arc(cx, top + size * 0.35, size * 0.33, 0, Math.PI * 2);
  ctx.fill();
  // Cuello.
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.2, top + size * 0.55);
  ctx.lineTo(cx + size * 0.2, top + size * 0.55);
  ctx.lineTo(cx + size * 0.14, top + size * 0.78);
  ctx.lineTo(cx - size * 0.14, top + size * 0.78);
  ctx.closePath();
  ctx.fill();
  // Rosca.
  ctx.fillRect(cx - size * 0.14, top + size * 0.82, size * 0.28, size * 0.07);
  ctx.fillRect(cx - size * 0.1, top + size * 0.93, size * 0.2, size * 0.07);
}

const bulbWidth = (size: number) => size * 0.7;

function drawBackground(ctx: CardContext) {
  const base = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  base.addColorStop(0, CARD_COLORS.turfDark);
  base.addColorStop(0.55, CARD_COLORS.night);
  base.addColorStop(1, CARD_COLORS.turfDark);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  // Franjas del césped.
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let x = 0; x < CARD_WIDTH; x += 128) ctx.fillRect(x, 0, 64, CARD_HEIGHT);
  // Luz de estadio desde arriba.
  const light = ctx.createRadialGradient(CENTER, -260, 0, CENTER, -260, 1400);
  light.addColorStop(0, "rgba(236, 255, 244, 0.16)");
  light.addColorStop(1, "rgba(236, 255, 244, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
}

function drawRow(ctx: CardContext, op: Extract<DrawOp, { kind: "row" }>, fonts: CardFonts) {
  const measure = (scale: number) =>
    op.items.map((item) => {
      if (item.type === "bulb") return bulbWidth(item.size) * scale;
      ctx.font = fontString(item.font, fonts, scale);
      return ctx.measureText(item.text).width;
    });
  let scale = 1;
  let widths = measure(scale);
  const total = (w: number[]) => w.reduce((a, b) => a + b, 0) + op.gap * scale * (w.length - 1);
  // Lo que no cabe (p. ej. un nombre largo) se achica hasta caber.
  for (let i = 0; i < 5 && total(widths) > op.maxWidth; i++) {
    scale *= op.maxWidth / total(widths);
    widths = measure(scale);
  }
  let x = op.x - total(widths) / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  op.items.forEach((item, i) => {
    if (item.type === "bulb") drawBulb(ctx, x, op.y, item.size * scale, item.color);
    else {
      ctx.font = fontString(item.font, fonts, scale);
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, x, op.y);
    }
    x += widths[i] + op.gap * scale;
  });
}

export function drawShareCard(ctx: CardContext, ops: DrawOp[], fonts: CardFonts): void {
  for (const op of ops) {
    if (op.kind === "background") drawBackground(ctx);
    else if (op.kind === "rect") {
      ctx.fillStyle = op.color;
      ctx.beginPath();
      ctx.roundRect(op.x, op.y, op.w, op.h, op.radius);
      ctx.fill();
    } else drawRow(ctx, op, fonts);
  }
}

/** Fuentes de una lista de operaciones, como cadenas de `ctx.font` (para cargarlas antes de dibujar). */
export function fontsToLoad(ops: DrawOp[], fonts: CardFonts): string[] {
  const specs = ops.flatMap((op) =>
    op.kind === "row" ? op.items.flatMap((i) => (i.type === "text" ? [fontString(i.font, fonts)] : [])) : [],
  );
  return [...new Set(specs)];
}

/** Familias de `next/font` (variables CSS `--font-display` y `--font-sans` del `<html>`). */
function readFonts(): CardFonts {
  const style = getComputedStyle(document.documentElement);
  return {
    display: style.getPropertyValue("--font-display").trim() || "sans-serif",
    sans: style.getPropertyValue("--font-sans").trim() || "sans-serif",
  };
}

/** Dibuja la tarjeta y la devuelve como PNG. Falla (rechaza) si no hay Canvas. */
export async function createShareImage(content: ShareCardContent): Promise<Blob> {
  const ops = layoutShareCard(content);
  const fonts = readFonts();
  // Cada peso y estilo se carga aparte: `fonts.ready` solo espera los que la página ya pidió.
  if (document.fonts) {
    await Promise.all(fontsToLoad(ops, fonts).map((f) => document.fonts.load(f).catch(() => [])));
    await document.fonts.ready;
  }
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  drawShareCard(ctx, ops, fonts);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo crear el PNG"))), "image/png"),
  );
}

/** Descarga un archivo con un `blob:` temporal. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Liberarlo enseguida puede cortar la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
