import { isRealDate, slugify, validateRows } from "./importPlayers";

/** Columnas de `public.players` (ver `supabase/schema.sql`), en el orden del `insert`. */
export const SEED_COLUMNS = [
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
  "fuente",
  "verificado_en",
  "verif_fecha",
  "verif_dorsal",
  "verif_pie",
  "notas_revision",
] as const;
type SeedColumn = (typeof SEED_COLUMNS)[number];

/** Columnas de fuente y verificación: opcionales en el CSV, `null` si faltan o están vacías. */
const OPTIONAL: SeedColumn[] = ["fuente", "verificado_en", "verif_fecha", "verif_dorsal", "verif_pie", "notas_revision"];
const NUMERIC: SeedColumn[] = ["temporada", "dorsal"];

export type SeedResult =
  | { ok: true; sql: string; rows: number; elegibles: number; temporadas: number[] }
  | { ok: false; errors: string[] };

/**
 * Literal de texto de Postgres: entre comillas simples y con las internas dobladas (`D'Arrigo` →
 * `'D''Arrigo'`). Correcto con `standard_conforming_strings = on` (por defecto en Postgres y Supabase),
 * donde la barra invertida no escapa nada.
 */
export function sqlLiteral(value: string | null): string {
  return value === null ? "null" : `'${value.replace(/'/g, "''")}'`;
}

/**
 * CSV (ya parseado, con encabezado) → contenido de `supabase/seed.sql` con **todas** las filas,
 * elegibles y no elegibles. Valida primero como el importador (todo o nada) y además temporada,
 * `verificado_en` y que no haya caracteres nulos, que Postgres no acepta en `text`.
 */
export function buildSeedSql(table: string[][], source: string): SeedResult {
  const validation = validateRows(table);
  const errors = validation.ok ? [] : [...validation.errors];
  // Sin encabezado válido o sin filas no hay nada más que revisar.
  if (table.length <= 1 || errors[0]?.startsWith("Faltan columnas")) return { ok: false, errors };

  const [header = [], ...records] = table;
  const cols = header.map((h) => h.trim());
  const rows: Record<SeedColumn, string | null>[] = [];

  records.forEach((cells, i) => {
    const fila = i + 2;
    const raw = (c: SeedColumn) => {
      const index = cols.indexOf(c);
      return index === -1 ? "" : (cells[index] ?? "").trim();
    };
    const nombre = raw("nombre");
    const fail = (msg: string) => errors.push(`Fila ${fila} (${nombre || "sin nombre"}): ${msg}`);

    const temporada = raw("temporada");
    if (!/^\d{4}$/.test(temporada)) fail(`temporada "${temporada}" debe ser un año de 4 cifras`);
    const verificado = raw("verificado_en");
    if (verificado && !isRealDate(verificado))
      fail(`verificado_en "${verificado}" no es una fecha real en formato YYYY-MM-DD`);
    if (cells.some((c) => c.includes("\u0000"))) fail("tiene un carácter nulo");

    const row = {} as Record<SeedColumn, string | null>;
    for (const c of SEED_COLUMNS) {
      const v = raw(c);
      row[c] = OPTIONAL.includes(c) && v === "" ? null : v;
    }
    row.jugador_id = raw("jugador_id") || slugify(nombre);
    row.elegible = raw("elegible").toLowerCase() === "false" ? "false" : "true";
    rows.push(row);
  });

  if (errors.length) return { ok: false, errors };

  const value = (c: SeedColumn, v: string | null) =>
    NUMERIC.includes(c) || c === "elegible" ? (v as string) : sqlLiteral(v);
  const tuples = rows.map((r) => `  (${SEED_COLUMNS.map((c) => value(c, r[c])).join(", ")})`);
  const temporadas = [...new Set(rows.map((r) => Number(r.temporada)))].sort((a, b) => a - b);
  const elegibles = rows.filter((r) => r.elegible === "true").length;

  const sql = `-- Generado por scripts/generate-seed-sql.ts desde ${source}. No editar a mano: npm run db:seed-sql
-- Datos: Wikipedia (CC BY-SA 4.0) y Wikidata (CC0).
-- ${rows.length} filas (${elegibles} elegibles, ${rows.length - elegibles} no elegibles).
-- Pegar en el SQL Editor de Supabase después de schema.sql. Se puede volver a correr: reemplaza la temporada.

begin;

delete from public.players where temporada in (${temporadas.join(", ")});

insert into public.players (${SEED_COLUMNS.join(", ")}) values
${tuples.join(",\n")};

commit;
`;
  return { ok: true, sql, rows: rows.length, elegibles, temporadas };
}
