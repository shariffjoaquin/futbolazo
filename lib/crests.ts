/**
 * Escudos genéricos de los clubes: una forma de escudo propia con dos colores y una sigla.
 * No calcan ni imitan los escudos oficiales (sin animales, balones ni símbolos de cada club).
 * Son datos puros (sin React) para poder testearlos; `components/Crest.tsx` los dibuja.
 */

/** Diseño del escudo: dónde va el color secundario. */
export type CrestPattern =
  /** Franja arriba (jefe). */
  | "jefe"
  /** Borde interior (bordura). */
  | "borde"
  /** Punta inferior. */
  | "punta";

export interface CrestData {
  /** 1 a 3 letras o números, en mayúsculas. */
  sigla: string;
  /** Color del campo, detrás de la sigla. */
  primary: string;
  secondary: string;
  pattern: CrestPattern;
}

export const CREST_WIDTH = 24;
export const CREST_HEIGHT = 28;

/** Contorno del escudo en la caja de 24 × 28: arriba recto con esquinas suaves, abajo en punta. */
export const CREST_PATH =
  "M3.5 1.5 H20.5 Q22.5 1.5 22.5 3.5 V12.5 C22.5 19.5 17.5 24.3 12 26.5 C6.5 24.3 1.5 19.5 1.5 12.5 V3.5 Q1.5 1.5 3.5 1.5 Z";

/** Medidas del dibujo, compartidas por `components/Crest.tsx` (SVG) y la imagen de resultado (canvas). */
export const CREST_PATTERN = {
  /** Franja arriba: alto. */
  jefeHeight: 8,
  /** Punta inferior: desde qué altura. */
  puntaY: 19.5,
  /** Borde: trazo centrado en el contorno; con el recorte queda la mitad interior (2,5). */
  bordeStroke: 5,
} as const;

/** Alto de la sigla según cuántas letras tiene (índice = largo). */
export const CREST_SIGLA_SIZE = [0, 13, 10, 7.6] as const;

/** Centro vertical de la sigla: con franja arriba baja un poco para quedar sobre el campo. */
export function crestSiglaY(pattern: CrestPattern): number {
  return pattern === "jefe" ? 16.8 : pattern === "punta" ? 13 : 14.6;
}

/** Interletra de la sigla: las de 3 letras se juntan un poco. */
export const crestLetterSpacing = (sigla: string) => (sigla.length === 3 ? -0.2 : 0);

/** Contorno fino y oscuro que separa el escudo del fondo. */
export const CREST_OUTLINE = { color: "rgba(0, 0, 0, 0.45)", width: 1 } as const;

const BLANCO = "#f5f5f0";
const NEGRO = "#16181a";
const ROJO = "#c8102e";
const AZUL_MARINO = "#14245a";
const AZUL = "#1f5fbf";
const CELESTE = "#4fb3e8";

/** Una entrada por club de `data/players.ts`, con el nombre tal cual aparece ahí. */
export const CRESTS: Record<string, CrestData> = {
  ADT: { sigla: "ADT", primary: CELESTE, secondary: AZUL_MARINO, pattern: "borde" },
  "Alianza Atlético": { sigla: "AA", primary: BLANCO, secondary: AZUL, pattern: "jefe" },
  "Alianza Lima": { sigla: "AL", primary: AZUL_MARINO, secondary: BLANCO, pattern: "borde" },
  "Atlético Grau": { sigla: "AG", primary: BLANCO, secondary: NEGRO, pattern: "punta" },
  Cienciano: { sigla: "CIE", primary: ROJO, secondary: BLANCO, pattern: "jefe" },
  "Comerciantes Unidos": { sigla: "CU", primary: "#187a42", secondary: BLANCO, pattern: "borde" },
  "Cusco FC": { sigla: "CFC", primary: "#d4a017", secondary: NEGRO, pattern: "jefe" },
  "Deportivo Garcilaso": { sigla: "DG", primary: BLANCO, secondary: CELESTE, pattern: "borde" },
  "Deportivo Moquegua": { sigla: "DM", primary: "#e8711a", secondary: BLANCO, pattern: "punta" },
  "FC Cajamarca": { sigla: "FCC", primary: "#5b2a86", secondary: BLANCO, pattern: "jefe" },
  "Juan Pablo II College": { sigla: "JP2", primary: "#f2c230", secondary: AZUL_MARINO, pattern: "punta" },
  "Los Chankas": { sigla: "CH", primary: NEGRO, secondary: "#2fa35a", pattern: "jefe" },
  Melgar: { sigla: "FBC", primary: ROJO, secondary: NEGRO, pattern: "punta" },
  "Sport Boys": { sigla: "SB", primary: "#f49ac1", secondary: NEGRO, pattern: "borde" },
  "Sport Huancayo": { sigla: "SH", primary: BLANCO, secondary: ROJO, pattern: "jefe" },
  "Sporting Cristal": { sigla: "SC", primary: CELESTE, secondary: BLANCO, pattern: "jefe" },
  UTC: { sigla: "UTC", primary: AZUL, secondary: BLANCO, pattern: "punta" },
  Universitario: { sigla: "U", primary: "#f1e2c4", secondary: "#8b1e2d", pattern: "borde" },
};

/** Escudo del club, o `undefined` si no tiene (la celda muestra solo el texto). */
export function getCrest(club: string): CrestData | undefined {
  return Object.hasOwn(CRESTS, club) ? CRESTS[club] : undefined;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Luminancia relativa (WCAG). */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Distancia entre dos colores (RGB euclídea, 0–441). */
export function colorDistance(a: string, b: string): number {
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

export const INK_LIGHT = "#ffffff";
export const INK_DARK = NEGRO;

/** Color de la sigla sobre el campo: blanco o casi negro, el que contraste más. */
export function crestInk(primary: string): string {
  return contrast(primary, INK_LIGHT) >= contrast(primary, INK_DARK) ? INK_LIGHT : INK_DARK;
}
