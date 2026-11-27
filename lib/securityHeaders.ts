/**
 * Cabeceras de seguridad de todas las respuestas (ver plan, decisión 16). Puras para poder
 * testearlas sin build; `next.config.ts` las aplica con `headers()`.
 */

export interface Header {
  key: string;
  value: string;
}

/**
 * Content-Security-Policy: solo recursos del propio sitio.
 * - `'unsafe-inline'` en scripts: la página es estática y Next mete el payload de React en
 *   `<script>` inline; los nonces exigen render dinámico y los hashes cambian en cada build.
 * - `'unsafe-inline'` en estilos: el diálogo de Radix bloquea el scroll con un `<style>` que lleva el
 *   ancho de la barra de scroll de cada dispositivo, así que no sirve un hash.
 * - `'unsafe-eval'` solo en `next dev`, donde React lo usa para las trazas de error.
 */
export function contentSecurityPolicy(dev: boolean): string {
  const directives: [string, ...string[]][] = [
    ["default-src", "'self'"],
    ["script-src", "'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'"],
    ["font-src", "'self'"],
    ["connect-src", "'self'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    // En `next dev` se sirve por http://localhost; forzar https rompería la carga.
    ...(dev ? [] : [["upgrade-insecure-requests"] as [string]]),
  ];
  return directives.map((d) => d.join(" ")).join("; ");
}

/** Funciones del navegador que el juego no usa: cerradas para la página y cualquier iframe. */
export const PERMISSIONS_POLICY = [
  "camera",
  "microphone",
  "geolocation",
  "payment",
  "usb",
  "accelerometer",
  "gyroscope",
  "magnetometer",
]
  .map((feature) => `${feature}=()`)
  .join(", ");

/** Dos años; sin `preload` hasta tener dominio propio (ver plan, decisión 16). */
export const HSTS = "max-age=63072000; includeSubDomains";

export function securityHeaders(dev: boolean): Header[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(dev) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    { key: "Strict-Transport-Security", value: HSTS },
  ];
}
