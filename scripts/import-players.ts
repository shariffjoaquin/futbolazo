// Uso: npm run import:players [ruta.csv]  (por defecto data/raw/liga1-2026.csv)
// Valida todo el CSV y, solo si no hay errores, sobrescribe data/players.ts.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseCsv, renderPlayersTs, validateRows } from "../lib/importPlayers";

const DEFAULT_INPUT = "data/raw/liga1-2026.csv";
const OUTPUT = "data/players.ts";

// npm run ejecuta desde la raíz del proyecto.
const root = process.cwd();
const input = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_INPUT);
// Ruta relativa al proyecto para el aviso del archivo generado; absoluta si el CSV está fuera.
const relative = path.relative(root, input);
const source = relative.startsWith("..") ? input : relative.split(path.sep).join("/");

let table: string[][];
try {
  table = parseCsv(readFileSync(input, "utf8"));
} catch (err) {
  console.error(`✗ No se pudo leer ${source}: ${(err as Error).message}`);
  process.exit(1);
}

const result = validateRows(table);
if (!result.ok) {
  console.error(`✗ ${result.errors.length} error(es) en ${source}. No se modificó ${OUTPUT}.`);
  for (const e of result.errors) console.error(`  - ${e}`);
  process.exit(1);
}

writeFileSync(path.join(root, OUTPUT), renderPlayersTs(result.players, source));
const clubs = new Set(result.players.map((p) => p.club)).size;
console.log(`✓ ${result.players.length} jugadores de ${clubs} clubes → ${OUTPUT} (desde ${source})`);
