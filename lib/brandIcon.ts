/**
 * Ícono propio de Futbolazo: balón blanco de formas gruesas sobre fondo "noche de estadio", cruzado
 * por la banda roja diagonal. Sin logos ni imágenes de nadie. Una sola fuente para `app/icon.svg`,
 * `app/favicon.ico` y los PNG (los genera `scripts/generate-icons.tsx`).
 */

export const ICON_COLORS = {
  /** Fondo de la página (`--stadium-night`): también `theme_color` y `background_color`. */
  night: "#050d09",
  glow: "#123222",
  red: "#d91023",
  white: "#ffffff",
} as const;

/** Tamaños dentro de `app/favicon.ico`. */
export const ICO_SIZES = [16, 32, 48] as const;

/** Íconos del manifiesto, en `public/icons/` (los genera `npm run icons`). */
export const MANIFEST_ICONS = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
] as const;

const VIEW = 64;
const C = VIEW / 2;
const BALL_R = 21;
const PENTAGON_R = 8;
const EDGE_PATCH_R = 6.5;
const EDGE_PATCH_DISTANCE = 17.5;

const round = (n: number) => Math.round(n * 100) / 100;

/** Vértice `k` (0–4) de un pentágono con punta arriba. */
function vertex(k: number, r: number): [number, number] {
  const a = ((-90 + 72 * k) * Math.PI) / 180;
  return [round(C + r * Math.cos(a)), round(C + r * Math.sin(a))];
}

export interface IconOptions {
  /**
   * Esquinas redondeadas (pestaña y PWA). Sin redondear para `apple-icon` y el maskable: el sistema
   * pone su propia máscara.
   */
  rounded: boolean;
  /** Margen alrededor del balón (0–1 del lado), para la zona segura de los íconos maskable. */
  padding?: number;
}

export function brandIconSvg({ rounded, padding = 0 }: IconOptions): string {
  const radius = rounded ? 14 : 0;
  const pentagon = (cx: number, cy: number, r: number, turn = 0) =>
    [0, 1, 2, 3, 4]
      .map((k) => {
        const a = ((-90 + turn + 72 * k) * Math.PI) / 180;
        return `${round(cx + r * Math.cos(a))},${round(cy + r * Math.sin(a))}`;
      })
      .join(" ");
  // Costuras: de cada punta del pentágono central hacia el parche del borde.
  const seams = [0, 1, 2, 3, 4]
    .map((k) => {
      const [x1, y1] = vertex(k, PENTAGON_R);
      const [x2, y2] = vertex(k, EDGE_PATCH_DISTANCE);
      return `M${x1} ${y1}L${x2} ${y2}`;
    })
    .join("");
  // Parches del borde: pentágonos en la dirección de cada punta, cortados por el balón.
  const patches = [0, 1, 2, 3, 4]
    .map((k) => {
      const [x, y] = vertex(k, EDGE_PATCH_DISTANCE + EDGE_PATCH_R * 0.75);
      return `<polygon points="${pentagon(x, y, EDGE_PATCH_R, 180 + 72 * k)}"/>`;
    })
    .join("");
  const scale = round(1 - padding * 2);
  const ink = ICON_COLORS.night;
  const ball =
    `<circle cx="${C}" cy="${C}" r="${BALL_R}" fill="${ICON_COLORS.white}"/>` +
    `<g clip-path="url(#b)" fill="${ink}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round">` +
    `<path d="${seams}" stroke-width="2.4" stroke-linecap="round"/>${patches}` +
    `<polygon points="${pentagon(C, C, PENTAGON_R)}"/></g>` +
    `<circle cx="${C}" cy="${C}" r="${BALL_R}" fill="none" stroke="${ink}" stroke-width="2"/>`;
  const content =
    `<rect x="-24" y="${C - 7}" width="${VIEW + 48}" height="14" fill="${ICON_COLORS.red}" transform="rotate(45 ${C} ${C})"/>` +
    (scale === 1 ? ball : `<g transform="translate(${C} ${C}) scale(${scale}) translate(${-C} ${-C})">${ball}</g>`);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}">` +
    `<defs><radialGradient id="g" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="${ICON_COLORS.glow}"/><stop offset="1" stop-color="${ICON_COLORS.night}"/></radialGradient>` +
    `<clipPath id="c"><rect width="${VIEW}" height="${VIEW}" rx="${radius}"/></clipPath>` +
    `<clipPath id="b"><circle cx="${C}" cy="${C}" r="${BALL_R}"/></clipPath></defs>` +
    `<g clip-path="url(#c)"><rect width="${VIEW}" height="${VIEW}" fill="url(#g)"/>${content}</g>` +
    `</svg>\n`
  );
}
