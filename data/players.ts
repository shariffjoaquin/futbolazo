// Generado por scripts/import-players.ts desde data/raw/liga1-2026.csv. No editar a mano. Datos: Wikipedia (CC BY-SA 4.0) y Wikidata (CC0).

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
  { id: "alejandro-duarte", nombre: "Alejandro Duarte", club: "Alianza Lima", nacionalidad: "Perú", posicion: "POR", fechaNacimiento: "1994-04-05", dorsal: 1, pie: "D" },
  { id: "gianfranco-chavez", nombre: "Gianfranco Chávez", club: "Alianza Lima", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1998-08-10", dorsal: 4, pie: "D" },
  { id: "esteban-pavez", nombre: "Esteban Pavez", club: "Alianza Lima", nacionalidad: "Chile", posicion: "MED", fechaNacimiento: "1990-05-01", dorsal: 5, pie: "D" },
  { id: "renzo-garces", nombre: "Renzo Garcés", club: "Alianza Lima", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1996-06-12", dorsal: 6, pie: "D" },
  { id: "fernando-gaibor", nombre: "Fernando Gaibor", club: "Alianza Lima", nacionalidad: "Ecuador", posicion: "MED", fechaNacimiento: "1991-10-08", dorsal: 7, pie: "D" },
  { id: "eryc-castillo", nombre: "Eryc Castillo", club: "Alianza Lima", nacionalidad: "Ecuador", posicion: "DEL", fechaNacimiento: "1995-02-05", dorsal: 8, pie: "D" },
  { id: "luis-advincula", nombre: "Luis Advíncula", club: "Alianza Lima", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1990-03-02", dorsal: 17, pie: "D" },
  { id: "kevin-quevedo", nombre: "Kevin Quevedo", club: "Alianza Lima", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1997-02-22", dorsal: 27, pie: "D" },
  { id: "paolo-guerrero", nombre: "Paolo Guerrero", club: "Alianza Lima", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1984-01-01", dorsal: 34, pie: "D" },
  { id: "pedro-aquino", nombre: "Pedro Aquino", club: "Alianza Lima", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1995-09-13", dorsal: 55, pie: "D" },
  { id: "federico-girotti", nombre: "Federico Girotti", club: "Alianza Lima", nacionalidad: "Argentina", posicion: "DEL", fechaNacimiento: "1999-06-02", dorsal: 99, pie: "D" },
  { id: "gonzalo-falcon", nombre: "Gonzalo Falcón", club: "Cienciano", nacionalidad: "Uruguay", posicion: "POR", fechaNacimiento: "1996-11-16", dorsal: 1, pie: "D" },
  { id: "maximiliano-amondarain", nombre: "Maximiliano Amondarain", club: "Cienciano", nacionalidad: "Uruguay", posicion: "DEF", fechaNacimiento: "1993-01-22", dorsal: 4, pie: "D" },
  { id: "juan-romagnoli", nombre: "Juan Romagnoli", club: "Cienciano", nacionalidad: "Argentina", posicion: "DEL", fechaNacimiento: "1996-06-20", dorsal: 9, pie: "D" },
  { id: "alejandro-hohberg", nombre: "Alejandro Hohberg", club: "Cienciano", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1991-08-20", dorsal: 10, pie: "D" },
  { id: "neri-bandiera", nombre: "Neri Bandiera", club: "Cienciano", nacionalidad: "Argentina", posicion: "DEL", fechaNacimiento: "1989-07-03", dorsal: 11, pie: "D" },
  { id: "sebastian-cavero", nombre: "Sebastián Cavero", club: "Cienciano", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "2002-06-20", dorsal: 14, pie: "I" },
  { id: "ray-sandoval", nombre: "Ray Sandoval", club: "Cienciano", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1995-02-12", dorsal: 17, pie: "D" },
  { id: "carlos-garces", nombre: "Carlos Garcés", club: "Cienciano", nacionalidad: "Ecuador", posicion: "DEL", fechaNacimiento: "1990-03-01", dorsal: 21, pie: "D" },
  { id: "gerson-barreto", nombre: "Gerson Barreto", club: "Cienciano", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1995-08-18", dorsal: 88, pie: "D" },
  { id: "alvaro-ampuero", nombre: "Álvaro Ampuero", club: "Cusco FC", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1992-09-25", dorsal: 6, pie: "I" },
  { id: "jose-manzaneda", nombre: "José Manzaneda", club: "Cusco FC", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1994-09-10", dorsal: 7, pie: "D" },
  { id: "aldair-fuentes", nombre: "Aldair Fuentes", club: "Cusco FC", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1998-04-25", dorsal: 8, pie: "D" },
  { id: "facundo-callejo", nombre: "Facundo Callejo", club: "Cusco FC", nacionalidad: "Argentina", posicion: "DEL", fechaNacimiento: "1992-07-02", dorsal: 9, pie: "D" },
  { id: "ivan-colman", nombre: "Iván Colman", club: "Cusco FC", nacionalidad: "Argentina", posicion: "MED", fechaNacimiento: "1995-05-06", dorsal: 10, pie: "D" },
  { id: "juan-tevez", nombre: "Juan Tévez", club: "Cusco FC", nacionalidad: "Argentina", posicion: "DEL", fechaNacimiento: "1987-08-28", dorsal: 11, pie: "D" },
  { id: "andy-vidal", nombre: "Andy Vidal", club: "Cusco FC", nacionalidad: "Perú", posicion: "POR", fechaNacimiento: "1994-08-23", dorsal: 13, pie: "D" },
  { id: "leonel-gonzalez", nombre: "Leonel González", club: "Melgar", nacionalidad: "Argentina", posicion: "DEF", fechaNacimiento: "1994-03-15", dorsal: 3, pie: "I" },
  { id: "alec-deneumostier", nombre: "Alec Deneumostier", club: "Melgar", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1999-05-05", dorsal: 5, pie: "D" },
  { id: "cristian-bordacahar", nombre: "Cristian Bordacahar", club: "Melgar", nacionalidad: "Argentina", posicion: "DEL", fechaNacimiento: "1991-10-27", dorsal: 7, pie: "D" },
  { id: "bernardo-cuesta", nombre: "Bernardo Cuesta", club: "Melgar", nacionalidad: "Argentina", posicion: "DEL", fechaNacimiento: "1988-12-20", dorsal: 9, pie: "D" },
  { id: "nicolas-quagliata", nombre: "Nicolás Quagliata", club: "Melgar", nacionalidad: "Uruguay", posicion: "MED", fechaNacimiento: "1999-06-05", dorsal: 10, pie: "D" },
  { id: "jhonny-vidales", nombre: "Jhonny Vidales", club: "Melgar", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1992-04-22", dorsal: 11, pie: "D" },
  { id: "carlos-caceda", nombre: "Carlos Cáceda", club: "Melgar", nacionalidad: "Perú", posicion: "POR", fechaNacimiento: "1991-09-27", dorsal: 12, pie: "D" },
  { id: "walter-tandazo", nombre: "Walter Tandazo", club: "Melgar", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "2000-06-14", dorsal: 24, pie: "D" },
  { id: "carlos-zambrano", nombre: "Carlos Zambrano", club: "Sport Boys", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1989-07-10", dorsal: 3, pie: "D" },
  { id: "luis-urruti", nombre: "Luis Urruti", club: "Sport Boys", nacionalidad: "Uruguay", posicion: "DEL", fechaNacimiento: "1992-09-11", dorsal: 11, pie: "D" },
  { id: "diego-melian", nombre: "Diego Melián", club: "Sport Boys", nacionalidad: "Uruguay", posicion: "POR", fechaNacimiento: "1991-11-04", dorsal: 22, pie: "D" },
  { id: "hansell-riojas", nombre: "Hansell Riojas", club: "Sport Boys", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1991-10-15", dorsal: 26, pie: "D" },
  { id: "percy-liza", nombre: "Percy Liza", club: "Sport Boys", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "2000-04-10", dorsal: 30, pie: "D" },
  { id: "miguel-trauco", nombre: "Miguel Trauco", club: "Sport Boys", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1992-08-25", dorsal: 47, pie: "I" },
  { id: "gustavo-dulanto", nombre: "Gustavo Dulanto", club: "Sport Boys", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1995-05-09", dorsal: 55, pie: "I" },
  { id: "christian-cueva", nombre: "Christian Cueva", club: "Sport Boys", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1991-11-23", dorsal: 99, pie: "D" },
  { id: "diego-enriquez", nombre: "Diego Enríquez", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "POR", fechaNacimiento: "2002-01-24", dorsal: 1, pie: "D" },
  { id: "santiago-gonzalez", nombre: "Santiago González", club: "Sporting Cristal", nacionalidad: "Argentina", posicion: "DEL", fechaNacimiento: "1999-07-25", dorsal: 7, pie: "D" },
  { id: "leandro-sosa", nombre: "Leandro Sosa", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1994-06-24", dorsal: 8, pie: "D" },
  { id: "christofer-gonzales", nombre: "Christofer Gonzales", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1992-10-12", dorsal: 10, pie: "D" },
  { id: "irven-avila", nombre: "Irven Ávila", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1990-07-02", dorsal: 11, pie: "D" },
  { id: "cristian-benavente", nombre: "Cristian Benavente", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1994-05-15", dorsal: 14, pie: "D" },
  { id: "yoshimar-yotun", nombre: "Yoshimar Yotún", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1990-04-07", dorsal: 19, pie: "I" },
  { id: "miguel-araujo", nombre: "Miguel Araujo", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1994-10-24", dorsal: 20, pie: "D" },
  { id: "martin-tavara", nombre: "Martín Távara", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1999-03-25", dorsal: 25, pie: "I" },
  { id: "hernan-barcos", nombre: "Hernán Barcos", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1984-04-11", dorsal: 29, pie: "D" },
  { id: "luis-abram", nombre: "Luis Abram", club: "Sporting Cristal", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1996-02-27", dorsal: 96, pie: "I" },
  { id: "diego-romero", nombre: "Diego Romero", club: "Universitario", nacionalidad: "Perú", posicion: "POR", fechaNacimiento: "2001-08-17", dorsal: 1, pie: "D" },
  { id: "williams-riveros", nombre: "Williams Riveros", club: "Universitario", nacionalidad: "Paraguay", posicion: "DEF", fechaNacimiento: "1992-11-20", dorsal: 3, pie: "D" },
  { id: "matias-di-benedetto", nombre: "Matías Di Benedetto", club: "Universitario", nacionalidad: "Argentina", posicion: "DEF", fechaNacimiento: "1992-11-19", dorsal: 5, pie: "I" },
  { id: "jesus-castillo", nombre: "Jesús Castillo", club: "Universitario", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "2001-06-11", dorsal: 6, pie: "D" },
  { id: "horacio-calcaterra", nombre: "Horacio Calcaterra", club: "Universitario", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1989-02-22", dorsal: 10, pie: "D" },
  { id: "jairo-concha", nombre: "Jairo Concha", club: "Universitario", nacionalidad: "Perú", posicion: "MED", fechaNacimiento: "1999-05-27", dorsal: 17, pie: "D" },
  { id: "gianluca-lapadula", nombre: "Gianluca Lapadula", club: "Universitario", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1990-02-07", dorsal: 18, pie: "I" },
  { id: "edison-flores", nombre: "Edison Flores", club: "Universitario", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1994-05-14", dorsal: 19, pie: "I" },
  { id: "alex-valera", nombre: "Álex Valera", club: "Universitario", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1996-05-16", dorsal: 20, pie: "I" },
  { id: "andy-polo", nombre: "Andy Polo", club: "Universitario", nacionalidad: "Perú", posicion: "DEL", fechaNacimiento: "1994-09-29", dorsal: 24, pie: "D" },
  { id: "aldo-corzo", nombre: "Aldo Corzo", club: "Universitario", nacionalidad: "Perú", posicion: "DEF", fechaNacimiento: "1989-05-20", dorsal: 29, pie: "D" },
];

export function getPlayerById(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}
