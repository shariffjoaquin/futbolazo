import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PAISES, PIES, POSICIONES, parseCsv } from "./importPlayers";
import { buildSeedSql, SEED_COLUMNS, sqlLiteral } from "./seedSql";

const CSV_PATH = "data/raw/liga1-2026.csv";
const HEADER = SEED_COLUMNS.join(",");
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n");
const build = (text: string) => buildSeedSql(parseCsv(text), "test.csv");
const sqlOf = (text: string) => {
  const r = build(text);
  if (!r.ok) throw new Error(r.errors.join("\n"));
  return r.sql;
};
const errorsOf = (text: string) => {
  const r = build(text);
  return r.ok ? [] : r.errors;
};

type Value = string | number | boolean | null;

/**
 * Lee de vuelta las filas del `insert ... values` como lo haría Postgres: literales entre comillas
 * simples con `''` como comilla, y `null`, `true`, `false` o números sin comillas.
 */
function parseInsertRows(sql: string): Value[][] {
  const start = sql.indexOf(") values\n");
  const end = sql.lastIndexOf(";\n\ncommit;");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const body = sql.slice(start + ") values\n".length, end);

  const rows: Value[][] = [];
  let i = 0;
  const skipSpace = () => {
    while (i < body.length && /\s/.test(body[i])) i++;
  };
  while (true) {
    skipSpace();
    if (i >= body.length) break;
    expect(body[i]).toBe("(");
    i++;
    const row: Value[] = [];
    while (true) {
      skipSpace();
      if (body[i] === "'") {
        let text = "";
        i++;
        while (true) {
          if (i >= body.length) throw new Error("literal sin cerrar");
          if (body[i] === "'") {
            if (body[i + 1] === "'") {
              text += "'";
              i += 2;
              continue;
            }
            i++;
            break;
          }
          text += body[i++];
        }
        row.push(text);
      } else {
        const word = /^[^,)\s]+/.exec(body.slice(i))?.[0] ?? "";
        i += word.length;
        if (word === "null") row.push(null);
        else if (word === "true" || word === "false") row.push(word === "true");
        else if (/^\d+$/.test(word)) row.push(Number(word));
        else throw new Error(`valor sin comillas inesperado: "${word}"`);
      }
      skipSpace();
      if (body[i] === ",") {
        i++;
        continue;
      }
      expect(body[i]).toBe(")");
      i++;
      break;
    }
    rows.push(row);
    skipSpace();
    if (body[i] === ",") i++;
  }
  return rows;
}

describe("sqlLiteral", () => {
  it("dobla las comillas simples y deja todo lo demás igual", () => {
    expect(sqlLiteral("Jhamir D'Arrigo")).toBe("'Jhamir D''Arrigo'");
    expect(sqlLiteral("''")).toBe("''''''");
    expect(sqlLiteral('dice "zurdo"')).toBe(`'dice "zurdo"'`);
    expect(sqlLiteral("Muñoz Pérez")).toBe("'Muñoz Pérez'");
    expect(sqlLiteral("C:\\ruta")).toBe("'C:\\ruta'");
    expect(sqlLiteral("")).toBe("''");
    expect(sqlLiteral(null)).toBe("null");
  });
});

describe("buildSeedSql con el CSV real", () => {
  const table = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const records = table.slice(1);
  const result = buildSeedSql(table, CSV_PATH);

  it("genera una fila por cada fila del CSV, elegibles y no elegibles", () => {
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const col = table[0].indexOf("elegible");
    const noElegibles = records.filter((r) => r[col].trim().toLowerCase() === "false").length;
    expect(result.rows).toBe(records.length);
    expect(result.elegibles).toBe(records.length - noElegibles);
    expect(parseInsertRows(result.sql)).toHaveLength(records.length);
  });

  it("cada valor vuelve igual a como está en el CSV (apóstrofes, comillas y tildes incluidos)", () => {
    if (!result.ok) throw new Error("el CSV real no es válido");
    const header = table[0].map((h) => h.trim());
    const rows = parseInsertRows(result.sql);
    rows.forEach((row, r) => {
      expect(row).toHaveLength(SEED_COLUMNS.length);
      SEED_COLUMNS.forEach((c, k) => {
        const cell = (records[r][header.indexOf(c)] ?? "").trim();
        const value = row[k];
        if (c === "temporada" || c === "dorsal") expect(value).toBe(Number(cell));
        else if (c === "elegible") expect(value).toBe(cell.toLowerCase() !== "false");
        else if (cell === "") expect(value === null || value === "").toBe(true);
        else expect(value).toBe(cell);
      });
    });
    expect(rows.some((row) => String(row[2]).includes("'"))).toBe(true);
  });

  it("borra solo las temporadas del CSV dentro de una transacción", () => {
    if (!result.ok) throw new Error("el CSV real no es válido");
    expect(result.sql).toMatch(/^begin;$/m);
    expect(result.sql).toMatch(/^commit;\n$/m);
    expect(result.sql).toContain(`delete from public.players where temporada in (${result.temporadas.join(", ")});`);
    expect(result.sql.indexOf("delete from")).toBeLessThan(result.sql.indexOf("insert into"));
  });

  it("supabase/seed.sql está al día con el CSV (correr npm run db:seed-sql si falla)", () => {
    if (!result.ok) throw new Error("el CSV real no es válido");
    expect(readFileSync("supabase/seed.sql", "utf8")).toBe(result.sql);
  });
});

describe("buildSeedSql con casos especiales", () => {
  it("no rompe con apóstrofes, comillas, tildes, eñes, barras y saltos de línea", () => {
    const sql = sqlOf(
      csv(
        `2026,jhamir-darrigo,Jhamir D'Arrigo,alianza-lima,Alianza Lima,Perú,MED,2004-11-12,20,D,true,https://x,2026-11-27,a,b,c,"dice ""zurdo"" y 'diestro'"`,
        `2026,,José Ñañez O'Brien,cusco-fc,Cusco FC,España,DEL,1999-01-31,9,Ambos,true,"C:\\fuente, con coma",,,,,"línea 1\nlínea 2"`,
        `2026,') ; drop table players; --,Ataque,cusco-fc,Cusco FC,Perú,POR,1999-01-31,1,I,false,,,,,,`,
      ),
    );
    const rows = parseInsertRows(sql);
    expect(rows).toHaveLength(3);
    expect(rows[0][2]).toBe("Jhamir D'Arrigo");
    expect(rows[0][16]).toBe(`dice "zurdo" y 'diestro'`);
    expect(rows[1].slice(1, 3)).toEqual(["jose-nanez-o-brien", "José Ñañez O'Brien"]);
    expect(rows[1][11]).toBe("C:\\fuente, con coma");
    expect(rows[1][16]).toBe("línea 1\nlínea 2");
    expect(rows[2][1]).toBe("') ; drop table players; --");
    expect(sql).toContain("''') ; drop table players; --'");
    expect(sql).toContain("José Ñañez");
  });

  it("celdas opcionales vacías y columnas que faltan van como null; elegible vacío es true", () => {
    const sql = sqlOf(
      [
        "temporada,jugador_id,nombre,club_id,club_nombre,nacionalidad,posicion,fecha_nacimiento,dorsal,pie,elegible",
        "2026,a,Ana Uno,c,Club,Perú,POR,2000-01-01,1,D,",
        "2026,b,Beto Dos,c,Club,Perú,DEF,2000-01-01,2,I,FALSE",
      ].join("\n"),
    );
    const [a, b] = parseInsertRows(sql);
    expect(a.slice(11)).toEqual([null, null, null, null, null, null]);
    expect(a[10]).toBe(true);
    expect(b[10]).toBe(false);
  });

  it("con errores del importador no genera SQL", () => {
    const errors = errorsOf(csv("2026,a,Ana,c,Club,Francia,ARQ,2000-02-30,0,X,true,,,,,,"));
    expect(errors.join("\n")).toMatch(/nacionalidad "Francia"/);
    expect(errors.join("\n")).toMatch(/posición "ARQ"/);
    expect(errors.join("\n")).toMatch(/fecha_nacimiento "2000-02-30"/);
    expect(errors.join("\n")).toMatch(/dorsal "0"/);
    expect(errors.join("\n")).toMatch(/pie "X"/);
  });

  it("valida temporada y verificado_en, que el importador no revisa", () => {
    expect(errorsOf(csv("26,a,Ana,c,Club,Perú,POR,2000-01-01,1,D,true,,2026-11-27,,,,"))).toEqual([
      'Fila 2 (Ana): temporada "26" debe ser un año de 4 cifras',
    ]);
    expect(errorsOf(csv("2026,a,Ana,c,Club,Perú,POR,2000-01-01,1,D,true,,27/11/2026,,,,"))).toEqual([
      'Fila 2 (Ana): verificado_en "27/11/2026" no es una fecha real en formato YYYY-MM-DD',
    ]);
  });

  it("rechaza caracteres nulos (Postgres no los acepta en text)", () => {
    expect(errorsOf(csv("2026,a,Ana,c,Club,Perú,POR,2000-01-01,1,D,true,,,,,,nota\u0000mala"))).toEqual([
      "Fila 2 (Ana): tiene un carácter nulo",
    ]);
  });

  it("sin columnas obligatorias o sin filas no genera SQL", () => {
    expect(errorsOf("nombre\nAna")[0]).toMatch(/Faltan columnas obligatorias/);
    expect(errorsOf(HEADER)).toEqual(["El CSV no tiene filas de jugadores"]);
  });
});

describe("supabase/schema.sql", () => {
  const schema = readFileSync("supabase/schema.sql", "utf8");
  const inList = (column: string) => {
    const match = new RegExp(`check \\(${column} in \\(([^)]*)\\)\\)`).exec(schema);
    expect(match, `falta el check de ${column}`).not.toBeNull();
    return [...match![1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  };

  it("acepta los mismos países, posiciones y pies que el importador", () => {
    expect(inList("nacionalidad")).toEqual(PAISES);
    expect(inList("posicion")).toEqual(POSICIONES);
    expect(inList("pie")).toEqual(PIES);
  });

  it("tiene las mismas columnas que inserta el seed, con jugador_id único", () => {
    const body = /create table if not exists public\.players \(([\s\S]*?)\n\);/.exec(schema)![1];
    const columns = body
      .split("\n")
      .map((line) => /^ {2}([a-z_]+)\s/.exec(line)?.[1])
      .filter((c): c is string => !!c && c !== "constraint");
    expect(columns).toEqual([...SEED_COLUMNS]);
    expect(body).toMatch(/jugador_id\s+text\s+primary key/);
    expect(body).toContain("check (dorsal between 1 and 99)");
    expect(body).toMatch(/fecha_nacimiento\s+date\s+not null/);
    expect(body).toContain("unique (temporada, club_id, dorsal)");
  });

  it("activa RLS con una sola política: lectura de anon solo de elegibles, sin escritura", () => {
    expect(schema).toContain("alter table public.players enable row level security;");
    const policies = [...schema.matchAll(/create policy[\s\S]*?;/g)].map((m) => m[0]);
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatch(/for select\s+to anon\s+using \(elegible = true\)/);
    expect(schema).toContain("revoke all on table public.players from anon, authenticated;");
    const grants = [...schema.matchAll(/^grant .*;$/gm)].map((m) => m[0]);
    expect(grants).toEqual(["grant select on table public.players to anon;"]);
  });
});
