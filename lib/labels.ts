import type { Player } from "../data/players";

export const POSITION_LABEL: Record<Player["posicion"], string> = {
  POR: "Portero",
  DEF: "Defensa",
  MED: "Medio",
  DEL: "Delantero",
};

/** Etiqueta corta para la celda (el dato sigue siendo D / I / Ambos). */
export const PIE_LABEL: Record<Player["pie"], string> = { D: "Diestro", I: "Zurdo", Ambos: "Ambos" };

/** Nombre de cada categoría de pista, en el orden de `ATTRIBUTES`. */
export const CATEGORY_LABEL = {
  club: "Club",
  nacionalidad: "País",
  posicion: "Posición",
  edad: "Edad",
  dorsal: "Dorsal",
  pie: "Pie",
} as const;
