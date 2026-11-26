import type { Player, Posicion } from "../data/players";

export type Status = "correct" | "close" | "wrong";
export type Arrow = "up" | "down";

export interface AttrResult {
  status: Status;
  /** Solo en atributos numéricos: hacia dónde está el objetivo respecto al intento. */
  arrow?: Arrow;
}

export interface CompareResult {
  club: AttrResult;
  nacionalidad: AttrResult;
  posicion: AttrResult;
  edad: AttrResult;
  dorsal: AttrResult;
  pie: AttrResult;
  isCorrect: boolean;
}

export const POSITION_ORDER: Posicion[] = ["POR", "DEF", "MED", "DEL"];
export const AGE_TOLERANCE = 2;
export const DORSAL_TOLERANCE = 3;

/** Edad cumplida en la fecha `dateKey` (YYYY-MM-DD). */
export function ageOn(fechaNacimiento: string, dateKey: string): number {
  const [by, bm, bd] = fechaNacimiento.split("-").map(Number);
  const [y, m, d] = dateKey.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}

function exact<T>(guess: T, target: T): AttrResult {
  return { status: guess === target ? "correct" : "wrong" };
}

function numeric(guess: number, target: number, tolerance: number): AttrResult {
  if (guess === target) return { status: "correct" };
  return {
    status: Math.abs(guess - target) <= tolerance ? "close" : "wrong",
    arrow: target > guess ? "up" : "down",
  };
}

function position(guess: Posicion, target: Posicion): AttrResult {
  const distance = Math.abs(POSITION_ORDER.indexOf(guess) - POSITION_ORDER.indexOf(target));
  return { status: distance === 0 ? "correct" : distance === 1 ? "close" : "wrong" };
}

export function compare(guess: Player, target: Player, dateKey: string): CompareResult {
  return {
    club: exact(guess.club, target.club),
    nacionalidad: exact(guess.nacionalidad, target.nacionalidad),
    posicion: position(guess.posicion, target.posicion),
    edad: numeric(ageOn(guess.fechaNacimiento, dateKey), ageOn(target.fechaNacimiento, dateKey), AGE_TOLERANCE),
    dorsal: numeric(guess.dorsal, target.dorsal, DORSAL_TOLERANCE),
    pie: exact(guess.pie, target.pie),
    isCorrect: guess.id === target.id,
  };
}
