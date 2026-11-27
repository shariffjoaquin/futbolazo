import { describe, expect, it } from "vitest";
import { parseCsv, renderPlayersTs, slugify, validateRows } from "./importPlayers";

const HEADER =
  "temporada,jugador_id,nombre,club_id,club_nombre,nacionalidad,posicion,fecha_nacimiento,dorsal,pie,elegible,fuente,notas_revision";

const csv = (...rows: string[]) => [HEADER, ...rows].join("\n");
const run = (text: string) => validateRows(parseCsv(text));
const errorsOf = (text: string) => {
  const r = run(text);
  return r.ok ? [] : r.errors;
};

const VALID = csv(
  "2026,diego-romero,Diego Romero,universitario,Universitario,Perú,POR,2001-08-17,1,D,true,https://es.wikipedia.org/x,",
  '2026,,Matías Di Benedetto,universitario,Universitario,Argentina,DEF,1992-11-19,5,I,true,"wiki, wikidata","dice ""zurdo"""',
  "2026,hernan-barcos,Hernán Barcos,alianza-lima,Alianza Lima,Argentina,DEL,1984-04-11,9,Ambos,true,,",
  "2026,suplente,Suplente Uno,alianza-lima,Alianza Lima,Perú,MED,2004-01-01,30,D,false,,",
);

describe("parseCsv", () => {
  it("respeta comas, comillas escapadas y saltos de línea dentro de comillas", () => {
    expect(parseCsv('a,"b, c","di ""hola""","x\ny"\n1,2,3,4')).toEqual([
      ["a", "b, c", 'di "hola"', "x\ny"],
      ["1", "2", "3", "4"],
    ]);
  });

  it("acepta CRLF, BOM, celdas vacías al final y archivo sin salto final", () => {
    expect(parseCsv("﻿a,b,\r\n1,2,\r\n\r\n")).toEqual([
      ["a", "b", ""],
      ["1", "2", ""],
    ]);
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("falla con una comilla sin cerrar", () => {
    expect(() => parseCsv('a,"b\n1,2')).toThrow(/comilla sin cerrar/);
  });
});

describe("validateRows", () => {
  it("caso válido: solo elegibles, ordenados por club y dorsal, con id generado si falta", () => {
    const r = run(VALID);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.players.map((p) => p.id)).toEqual(["hernan-barcos", "diego-romero", "matias-di-benedetto"]);
    expect(r.players[2]).toEqual({
      id: "matias-di-benedetto",
      nombre: "Matías Di Benedetto",
      club: "Universitario",
      nacionalidad: "Argentina",
      posicion: "DEF",
      fechaNacimiento: "1992-11-19",
      dorsal: 5,
      pie: "I",
    });
  });

  it("un campo con comillas y coma no desplaza las columnas", () => {
    const r = run(csv('2026,a,"Pérez, Juan",cienciano,Cienciano,Perú,MED,2000-02-29,8,D,true,"x, y",'));
    expect(r.ok && r.players[0]).toMatchObject({ nombre: "Pérez, Juan", club: "Cienciano", dorsal: 8 });
  });

  it("pie vacío → 'falta pie' con fila y nombre", () => {
    expect(errorsOf(csv("2026,a,Ana Pie,c,Club,Perú,DEF,2000-01-01,4,,true,,"))).toEqual(["Fila 2 (Ana Pie): falta pie"]);
  });

  it("posición inválida", () => {
    expect(errorsOf(csv("2026,a,Beto,c,Club,Perú,ARQ,2000-01-01,1,D,true,,"))).toEqual([
      'Fila 2 (Beto): posición "ARQ" inválida (usa POR, DEF, MED, DEL)',
    ]);
  });

  it("dorsal repetido en el mismo club (en otro club sí se puede)", () => {
    const errs = errorsOf(
      csv(
        "2026,a,Uno,c1,Club Uno,Perú,DEF,2000-01-01,10,D,true,,",
        "2026,b,Dos,c2,Club Dos,Perú,DEF,2000-01-01,10,D,true,,",
        "2026,c,Tres,c1,Club Uno,Perú,MED,2000-01-01,10,I,true,,",
      ),
    );
    expect(errs).toEqual(["Fila 4 (Tres): dorsal 10 repetido en Club Uno (ya lo usa Uno, fila 2)"]);
  });

  it("fecha inválida: formato o día que no existe", () => {
    const errs = errorsOf(
      csv("2026,a,Uno,c,Club,Perú,DEF,2001-02-29,1,D,true,,", "2026,b,Dos,c,Club,Perú,DEF,17/08/2001,2,D,true,,"),
    );
    expect(errs).toEqual([
      'Fila 2 (Uno): fecha_nacimiento "2001-02-29" no es una fecha real en formato YYYY-MM-DD',
      'Fila 3 (Dos): fecha_nacimiento "17/08/2001" no es una fecha real en formato YYYY-MM-DD',
    ]);
  });

  it("dorsal fuera de rango, país fuera de la lista e id repetido", () => {
    const errs = errorsOf(
      csv(
        "2026,x,Uno,c,Club,Perú,DEF,2000-01-01,0,D,true,,",
        "2026,x,Dos,c,Club,Holanda,DEF,2000-01-01,7.5,D,true,,",
      ),
    );
    expect(errs).toEqual([
      'Fila 2 (Uno): dorsal "0" debe ser un entero entre 1 y 99',
      expect.stringContaining('Fila 3 (Dos): nacionalidad "Holanda" no está en la lista'),
      'Fila 3 (Dos): dorsal "7.5" debe ser un entero entre 1 y 99',
      'Fila 3 (Dos): jugador_id "x" repetido (ya está en la fila 2)',
    ]);
  });

  it("acepta los países de la lista, incluido Panamá", () => {
    const r = run(csv("2026,a,Uno,c,Club,Panamá,DEL,2000-01-01,9,D,true,,"));
    expect(r.ok && r.players[0].nacionalidad).toBe("Panamá");
  });

  it("lista todos los errores, no solo el primero", () => {
    const errs = errorsOf(csv("2026,a,Uno,c,Club,Perú,XX,2000-13-01,100,,true,,"));
    expect(errs).toHaveLength(4);
  });

  it("faltan columnas obligatorias", () => {
    expect(errorsOf("nombre,club_nombre\nUno,Club")).toEqual([
      expect.stringMatching(/^Faltan columnas obligatorias: temporada, jugador_id, club_id/),
    ]);
  });
});

describe("slugify", () => {
  it("minúsculas, sin tildes, con guiones", () => {
    expect(slugify("  Matías Di Benedetto ")).toBe("matias-di-benedetto");
    expect(slugify("Yeferson Rondón Ñique")).toBe("yeferson-rondon-nique");
  });
});

describe("renderPlayersTs", () => {
  it("genera el archivo con aviso, tipos, datos y getPlayerById", () => {
    const r = run(VALID);
    if (!r.ok) throw new Error("debería ser válido");
    const ts = renderPlayersTs(r.players, "data/raw/x.csv");
    expect(ts.split("\n")[0]).toBe(
      "// Generado por scripts/import-players.ts desde data/raw/x.csv. No editar a mano. Datos: Wikipedia (CC BY-SA 4.0) y Wikidata (CC0).",
    );
    expect(ts).toContain('export type Posicion = "POR" | "DEF" | "MED" | "DEL";');
    expect(ts).toContain("export function getPlayerById(id: string)");
    expect(ts).toContain('{ id: "diego-romero", nombre: "Diego Romero", club: "Universitario"');
    expect(ts).not.toContain("suplente");
  });
});
