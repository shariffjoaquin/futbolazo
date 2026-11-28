// Uso: npm run db:seed-sql [ruta.csv]  (por defecto data/raw/liga1-2026.csv)
// Valida todo el CSV y, solo si no hay errores, sobrescribe supabase/seed.sql.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseCsv } from "../lib/importPlayers";
import { buildSeedSql } from "../lib/seedSql";

const DEFAULT_INPUT = "data/raw/liga1-2026.csv";
const OUTPUT = "supabase/seed.sql";

// npm run ejecuta desde la raíz del proyecto.
const root = process.cwd();
const input = path.resolve(root, process.argv[2] ?? DEFAULT_INPUT);
const relative = path.relative(root, input);
const source = relative.startsWith("..") ? input : relative.split(path.sep).join("/");

let table: string[][];
try {
  table = parseCsv(readFileSync(input, "utf8"));
} catch (err) {
  console.error(`✗ No se pudo leer ${source}: ${(err as Error).message}`);
  process.exit(1);
}

const result = buildSeedSql(table, source);
if (!result.ok) {
  console.error(`✗ ${result.errors.length} error(es) en ${source}. No se modificó ${OUTPUT}.`);
  for (const e of result.errors) console.error(`  - ${e}`);
  process.exit(1);
}

mkdirSync(path.join(root, "supabase"), { recursive: true });
writeFileSync(path.join(root, OUTPUT), result.sql);
console.log(
  `✓ ${result.rows} filas (${result.elegibles} elegibles, ${result.rows - result.elegibles} no elegibles) → ${OUTPUT} (desde ${source})`,
);
