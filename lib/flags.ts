/**
 * Banderas estilizadas, dibujadas en una caja de 30 × 20 (proporción 3:2) con figuras simples.
 * Son datos puros (sin React) para poder testear que no falte ninguna; `components/Flag.tsx` las dibuja.
 * Escudos y emblemas van simplificados a una figura geométrica.
 */

export type FlagShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; fill: string; rx?: number }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number }
  | { kind: "polygon"; points: string; fill: string }
  | { kind: "path"; d: string; stroke: string; strokeWidth: number };

export const FLAG_WIDTH = 30;
export const FLAG_HEIGHT = 20;

const W = FLAG_WIDTH;
const H = FLAG_HEIGHT;

const rect = (x: number, y: number, w: number, h: number, fill: string, rx?: number): FlagShape => ({
  kind: "rect",
  x,
  y,
  w,
  h,
  fill,
  rx,
});
const circle = (cx: number, cy: number, r: number, fill: string, stroke?: string, strokeWidth?: number): FlagShape => ({
  kind: "circle",
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth,
});

/** Franjas horizontales de igual alto, de arriba abajo. */
const horizontal = (...colors: string[]): FlagShape[] =>
  colors.map((c, i) => rect(0, (H / colors.length) * i, W, H / colors.length, c));

/** Franjas verticales de igual ancho, de izquierda a derecha. */
const vertical = (...colors: string[]): FlagShape[] =>
  colors.map((c, i) => rect((W / colors.length) * i, 0, W / colors.length, H, c));

/** Estrella de cinco puntas con la punta hacia arriba. */
export function star(cx: number, cy: number, outer: number, fill: string): FlagShape {
  const inner = outer * 0.4;
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return { kind: "polygon", points, fill };
}

const WHITE = "#ffffff";

export const FLAGS: Record<string, FlagShape[]> = {
  Perú: vertical("#d91023", WHITE, "#d91023"),

  Argentina: [...horizontal("#74acdf", WHITE, "#74acdf"), circle(15, 10, 2.4, "#f6b40e")],

  Uruguay: [
    rect(0, 0, W, H, WHITE),
    ...[1, 3, 5, 7].map((i) => rect(0, (H / 9) * i, W, H / 9, "#0038a8")),
    rect(0, 0, 12, (H / 9) * 5, WHITE),
    circle(6, 5.5, 2.6, "#fcd116"),
  ],

  // Escudo simplificado: un círculo con borde.
  Paraguay: [...horizontal("#d52b1e", WHITE, "#0038a8"), circle(15, 10, 2, WHITE, "#0038a8", 0.8)],

  Chile: [rect(0, 0, W, 10, WHITE), rect(0, 10, W, 10, "#d52b1e"), rect(0, 0, 10, 10, "#0039a6"), star(5, 5, 3, WHITE)],

  // Escudo simplificado: un óvalo dorado.
  Ecuador: [
    rect(0, 0, W, 10, "#ffd100"),
    rect(0, 10, W, 5, "#034ea2"),
    rect(0, 15, W, 5, "#ed1c24"),
    circle(15, 10, 2.8, "#ffd100", "#034ea2", 0.8),
  ],

  Bolivia: horizontal("#d52b1e", "#f9e300", "#007934"),

  Brasil: [
    rect(0, 0, W, H, "#009c3b"),
    { kind: "polygon", points: "3,10 15,2.2 27,10 15,17.8", fill: "#ffdf00" },
    circle(15, 10, 4.4, "#002776"),
    { kind: "path", d: "M10.8 9.2 Q15 7.4 19.3 10.4", stroke: WHITE, strokeWidth: 0.9 },
  ],

  Colombia: [rect(0, 0, W, 10, "#fcd116"), rect(0, 10, W, 5, "#003893"), rect(0, 15, W, 5, "#ce1126")],

  // Arco de ocho estrellas simplificado a ocho puntos.
  Venezuela: [
    ...horizontal("#ffcc00", "#00247d", "#cf142b"),
    ...Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI * (1.15 + (i * 0.7) / 7);
      return circle(15 + 4.6 * Math.cos(a), 12.6 + 4.6 * Math.sin(a), 0.55, WHITE);
    }),
  ],

  // Escudo simplificado: un círculo café con anillo verde.
  México: [...vertical("#006847", WHITE, "#ce1126"), circle(15, 10, 2.4, "#8c5a2b", "#006847", 0.7)],

  // Escudo simplificado: un rectángulo redondeado.
  España: [rect(0, 0, W, 5, "#aa151b"), rect(0, 5, W, 10, "#f1bf00"), rect(0, 15, W, 5, "#aa151b"), rect(7, 7.2, 3.6, 5.6, "#aa151b", 1)],

  Italia: vertical("#009246", WHITE, "#ce2b37"),

  Panamá: [
    rect(0, 0, W, H, WHITE),
    rect(15, 0, 15, 10, "#da121a"),
    rect(0, 10, 15, 10, "#072357"),
    star(7.5, 5, 3, "#072357"),
    star(22.5, 15, 3, "#da121a"),
  ],
};

export function getFlag(country: string): FlagShape[] | undefined {
  return Object.hasOwn(FLAGS, country) ? FLAGS[country] : undefined;
}
