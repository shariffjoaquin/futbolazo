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

// Jugadores ficticios de prueba.
export const players: Player[] = [
  { id: "diego-quispe", nombre: "Diego Quispe", club: "Universitario", nacionalidad: "Perú", posicion: "POR", fechaNacimiento: "1994-03-12", dorsal: 1, pie: "D" },
  { id: "renzo-carrillo", nombre: "Renzo Carrillo", club: "Alianza Lima", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1998-07-21", dorsal: 4, pie: "D" },
  { id: "matias-ferreyra", nombre: "Matías Ferreyra", club: "Sporting Cristal", nacionalidad: "Argentina", posicion: "DEF", fechaNacimiento: "1996-11-02", dorsal: 2, pie: "I" },
  { id: "jhon-mosquera", nombre: "Jhon Mosquera", club: "Melgar", nacionalidad: "Colombia", posicion: "MED", fechaNacimiento: "1999-01-30", dorsal: 8, pie: "D" },
  { id: "piero-valdivia", nombre: "Piero Valdivia", club: "Cienciano", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "2002-05-17", dorsal: 10, pie: "Ambos" },
  { id: "santiago-olivera", nombre: "Santiago Olivera", club: "Universitario", nacionalidad: "Uruguay", posicion: "DEL", fechaNacimiento: "1995-09-08", dorsal: 9, pie: "D" },
  { id: "kevin-chumpitaz", nombre: "Kevin Chumpitaz", club: "Alianza Lima", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "2004-12-03", dorsal: 16, pie: "I" },
  { id: "luis-arana", nombre: "Luis Arana", club: "Sport Huancayo", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "2000-02-25", dorsal: 11, pie: "D" },
  { id: "yeferson-rondon", nombre: "Yeferson Rondón", club: "ADT", nacionalidad: "Venezuela", posicion: "DEF", fechaNacimiento: "1997-06-14", dorsal: 3, pie: "D" },
  { id: "bruno-saldana", nombre: "Bruno Saldaña", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "POR", fechaNacimiento: "2001-08-19", dorsal: 21, pie: "D" },
];

export function getPlayerById(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}
