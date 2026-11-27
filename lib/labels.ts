import type { Player } from "../data/players";

export const POSITION_LABEL: Record<Player["posicion"], string> = {
  POR: "Portero",
  DEF: "Defensa",
  MED: "Medio",
  DEL: "Delantero",
};

/** Etiqueta corta para la celda (el dato sigue siendo D / I / Ambos). */
export const PIE_LABEL: Record<Player["pie"], string> = { D: "Diestro", I: "Zurdo", Ambos: "Ambos" };
