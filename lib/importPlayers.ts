import type { Pie, Player, Posicion } from "../data/players";

export const REQUIRED_COLUMNS = [
  "temporada",
  "jugador_id",
  "nombre",
  "club_id",
  "club_nombre",
  "nacionalidad",
  "posicion",
  "fecha_nacimiento",
  "dorsal",
  "pie",
  "elegible",
] as const;
type Column = (typeof REQUIRED_COLUMNS)[number];

export const POSICIONES: Posicion[] = ["POR", "DEF", "MED", "DEL"];
export const PIES: Pie[] = ["D", "I", "Ambos"];
/** Lista cerrada: la pista de país compara texto exacto, así que no se aceptan variantes. */
export const PAISES = [
  "Perú",
  "Argentina",
  "Uruguay",
  "Paraguay",
  "Chile",
  "Ecuador",
  "Bolivia",
  "Brasil",
  "Colombia",
  "Venezuela",
  "México",
  "España",
  "Italia",
  "Panamá",
];

export type ImportResult = { ok: true; players: Player[] } | { ok: false; errors: string[] };

/**
 * CSV a filas de celdas. Soporta campos entre comillas (con comas, saltos de línea y `""`
 * como comilla escapada), finales de línea LF o CRLF, BOM y falta de salto de línea al final.
 * Ignora líneas vacías. Lanza un error si queda una comilla sin cerrar.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch !== '"') field += ch;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = false;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (inQuotes) throw new Error("CSV mal formado: hay una comilla sin cerrar");
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** "Matías Di Benedetto" → "matias-di-benedetto". */
export function slugify(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Valida todas las filas (la primera es el encabezado) y devuelve los jugadores elegibles
 * ordenados por club y dorsal, o la lista completa de errores. Todo o nada.
 * Las filas se numeran como en una hoja de cálculo: el encabezado es la fila 1.
 */
export function validateRows(table: string[][]): ImportResult {
  const [header = [], ...records] = table;
  const cols = header.map((h) => h.trim());
  const missing = REQUIRED_COLUMNS.filter((c) => !cols.includes(c));
  if (missing.length) return { ok: false, errors: [`Faltan columnas obligatorias: ${missing.join(", ")}`] };
  if (records.length === 0) return { ok: false, errors: ["El CSV no tiene filas de jugadores"] };

  const errors: string[] = [];
  const players: Player[] = [];
  const idRow = new Map<string, number>();
  const dorsalRow = new Map<string, { fila: number; nombre: string }>();

  records.forEach((cells, i) => {
    const fila = i + 2;
    const get = (c: Column) => (cells[cols.indexOf(c)] ?? "").trim();
    const nombre = get("nombre");
    const before = errors.length;
    const fail = (msg: string) => errors.push(`Fila ${fila} (${nombre || "sin nombre"}): ${msg}`);
    const required = (c: Column) => {
      const v = get(c);
      if (!v) fail(`falta ${c}`);
      return v;
    };

    if (cells.length !== cols.length) fail(`tiene ${cells.length} columnas y el encabezado ${cols.length}`);

    required("nombre");
    const clubId = required("club_id");
    const club = required("club_nombre");

    const nacionalidad = required("nacionalidad");
    if (nacionalidad && !PAISES.includes(nacionalidad))
      fail(`nacionalidad "${nacionalidad}" no está en la lista de países (${PAISES.join(", ")})`);

    const posicion = required("posicion");
    if (posicion && !POSICIONES.includes(posicion as Posicion))
      fail(`posición "${posicion}" inválida (usa ${POSICIONES.join(", ")})`);

    const pie = required("pie");
    if (pie && !PIES.includes(pie as Pie)) fail(`pie "${pie}" inválido (usa D, I o Ambos)`);

    const fecha = required("fecha_nacimiento");
    if (fecha && !isRealDate(fecha)) fail(`fecha_nacimiento "${fecha}" no es una fecha real en formato YYYY-MM-DD`);

    const dorsalText = required("dorsal");
    const dorsal = Number(dorsalText);
    const dorsalOk = /^\d+$/.test(dorsalText) && dorsal >= 1 && dorsal <= 99;
    if (dorsalText && !dorsalOk) fail(`dorsal "${dorsalText}" debe ser un entero entre 1 y 99`);

    const elegibleText = get("elegible").toLowerCase();
    if (elegibleText && elegibleText !== "true" && elegibleText !== "false")
      fail(`elegible "${get("elegible")}" debe ser true o false`);

    const id = get("jugador_id") || slugify(nombre);
    if (id) {
      const prev = idRow.get(id);
      if (prev) fail(`jugador_id "${id}" repetido (ya está en la fila ${prev})`);
      else idRow.set(id, fila);
    }

    if (clubId && dorsalOk) {
      const key = `${clubId}#${dorsal}`;
      const prev = dorsalRow.get(key);
      if (prev) fail(`dorsal ${dorsal} repetido en ${club || clubId} (ya lo usa ${prev.nombre}, fila ${prev.fila})`);
      else dorsalRow.set(key, { fila, nombre });
    }

    if (errors.length === before && elegibleText !== "false") {
      players.push({
        id,
        nombre,
        club,
        nacionalidad,
        posicion: posicion as Posicion,
        fechaNacimiento: fecha,
        dorsal,
        pie: pie as Pie,
      });
    }
  });

  if (errors.length) return { ok: false, errors };
  if (players.length === 0) return { ok: false, errors: ["No hay ningún jugador con elegible=true"] };

  players.sort((a, b) => a.club.localeCompare(b.club, "es") || a.dorsal - b.dorsal);
  return { ok: true, players };
}

/** Contenido completo de `data/players.ts` para estos jugadores. */
export function renderPlayersTs(players: Player[], source: string): string {
  const s = JSON.stringify;
  const lines = players.map(
    (p) =>
      `  { id: ${s(p.id)}, nombre: ${s(p.nombre)}, club: ${s(p.club)}, nacionalidad: ${s(p.nacionalidad)}, ` +
      `posicion: ${s(p.posicion)}, fechaNacimiento: ${s(p.fechaNacimiento)}, dorsal: ${p.dorsal}, pie: ${s(p.pie)} },`,
  );
  return `// Generado por scripts/import-players.ts desde ${source}. No editar a mano. Datos: Wikipedia (CC BY-SA 4.0) y Wikidata (CC0).

export type Posicion = "POR" | "DEF" | "MED" | "DEL";
export type Pie = "D" | "I" | "Ambos";

export interface Player {
  id: string;
  nombre: string;
  club: string;
  nacionalidad: string;
  posicion: Posicion;
  /** Formato YYYY-MM-DD */
  fechaNacimiento: string;
  dorsal: number;
  pie: Pie;
}

export const players: Player[] = [
${lines.join("\n")}
];

export function getPlayerById(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}
`;
}
