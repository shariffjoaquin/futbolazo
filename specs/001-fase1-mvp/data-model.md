# Modelo de datos

## 1. Modelo actual (en código)

Definido en `data/players.ts`:

```ts
type Posicion = "POR" | "DEF" | "MED" | "DEL";
type Pie = "D" | "I" | "Ambos";

interface Player {
  id: string;              // slug único, p. ej. "diego-quispe"
  nombre: string;          // nombre visible y el que se busca
  club: string;            // texto libre, se compara por igualdad exacta
  nacionalidad: string;    // texto libre, se compara por igualdad exacta
  posicion: Posicion;
  fechaNacimiento: string; // "YYYY-MM-DD"
  dorsal: number;
  pie: Pie;
}
```

- Lista: `players: Player[]`, hoy con **10 jugadores ficticios**.
- Búsqueda: `getPlayerById(id)`.
- El jugador de cada partida se sortea de esta lista (ver `plan.md`, decisiones 2 y 3).
- El estado del usuario guarda **ids** de jugador en `localStorage`, así que el `id` debe ser estable.

Limitaciones:
- Club y país son texto libre: "Alianza Lima" vs "Alianza" contaría como otro club.
- No hay temporada: si un jugador cambia de club, se pierde el dato anterior.
- Con 10 jugadores, la regla de "no repetir los últimos 10" solo puede excluir 9: tras las primeras
  partidas el orden se vuelve una rotación fija. Se resuelve con los datos reales (más de 10 jugadores).

## 1.1 Estado en `localStorage`

| Clave | Valor | Notas |
|---|---|---|
| `futbolazo:v2:partida` | `{ "targetId": "diego-quispe", "guesses": ["luis-arana"], "fecha": "2026-11-26" }` | partida en curso o recién terminada; `fecha` = día de Lima en que empezó, para calcular edades |
| `futbolazo:v2:recientes` | `["renzo-carrillo", "diego-quispe"]` | últimos 10 jugadores sorteados, el más reciente al final |
| `futbolazo:v2:visto-ayuda` | `true` | ya se mostró "¿Cómo se juega?"; si falta, el diálogo se abre solo |
| `futbolazo:v1:<YYYY-MM-DD>` | `{ "guesses": [...] }` | **obsoleta** (modo diario anterior); se borra al guardar |

Si un jugador desaparece de la lista (p. ej. al cambiar de temporada), su id se ignora en `guesses`
y en `recientes`, y una partida cuyo `targetId` ya no existe se descarta.

## 2. Modelo futuro en Supabase

Objetivo: poder **actualizar la Liga 1 entre temporadas subiendo un CSV**, sin tocar código
y manteniendo el historial.

En la fase 1 la app solo necesita `clubes`, `jugadores`, `plantillas` y la vista: el sorteo de cada
partida se hace en el navegador entre los jugadores `elegible` de la temporada vigente.
La tabla `puzzles_diarios` queda diseñada para el **modo diario futuro** y no se crea en la fase 1.

### 2.1 Tablas

#### `clubes`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | slug, p. ej. `universitario` |
| `nombre` | `text` not null | nombre visible: "Universitario" |
| `nombre_corto` | `text` | para celdas pequeñas: "U" / "UNI" |
| `escudo_url` | `text` | opcional, para el rediseño |
| `creado_en` | `timestamptz` default `now()` | |

#### `jugadores`

Datos de la persona, que no cambian entre temporadas.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | slug estable (`diego-quispe`); es el que se guarda en `localStorage` |
| `nombre` | `text` not null | |
| `nacionalidad` | `text` not null | nombre del país en español; ver 2.3 |
| `fecha_nacimiento` | `date` not null | |
| `pie` | `text` not null | `check (pie in ('D','I','Ambos'))` |
| `creado_en` | `timestamptz` default `now()` | |

#### `plantillas` (jugador en un club en una temporada)

Lo que sí cambia de temporada a temporada.

| Columna | Tipo | Notas |
|---|---|---|
| `temporada` | `int` not null | p. ej. `2027` |
| `jugador_id` | `text` FK → `jugadores.id` | |
| `club_id` | `text` FK → `clubes.id` | |
| `posicion` | `text` not null | `check (posicion in ('POR','DEF','MED','DEL'))` |
| `dorsal` | `int` not null | `check (dorsal between 1 and 99)` |
| `elegible` | `boolean` default `true` | `false` = aparece en el buscador pero nunca sale sorteado como jugador secreto |
| PK | `(temporada, jugador_id)` | un jugador, un club por temporada |

> Si un jugador cambia de club a mitad de temporada, se actualiza su fila (último club conocido).

#### `puzzles_diarios` (futuro: modo diario, fuera de la fase 1)

Fija qué jugador salió cada día, para que no cambie aunque se modifique la plantilla.

| Columna | Tipo | Notas |
|---|---|---|
| `fecha` | `date` PK | fecha de Lima |
| `numero` | `int` unique not null | # del puzzle; `fecha - 2026-11-26 + 1` |
| `temporada` | `int` not null | |
| `jugador_id` | `text` not null | |
| FK | `(temporada, jugador_id)` → `plantillas` | las pistas usan club/dorsal/posición de esa temporada |
| `creado_en` | `timestamptz` default `now()` | |

- Se generan por adelantado (p. ej. 30–60 días) con un script o función programada, eligiendo
  entre jugadores `elegible` de la temporada vigente, sin repetir hasta agotar la lista.
- Los días pasados **nunca se modifican**.
- La app lee el puzzle de la fecha de Lima; los intentos se comparan con los datos de la
  plantilla de esa misma `temporada`.

#### `temporadas` (opcional)

| Columna | Tipo | Notas |
|---|---|---|
| `anio` | `int` PK | |
| `vigente` | `boolean` | solo una en `true` (índice único parcial) |

### 2.2 Vista para la app

```sql
create view jugadores_temporada as
select p.temporada, j.id, j.nombre, j.nacionalidad, j.fecha_nacimiento, j.pie,
       c.nombre as club, p.club_id, p.posicion, p.dorsal, p.elegible
from plantillas p
join jugadores j on j.id = p.jugador_id
join clubes   c on c.id = p.club_id;
```

Devuelve filas con la misma forma que el `Player` actual, así el cambio en la app es pequeño.

### 2.3 Seguridad (RLS)

- Lectura pública (`anon`) en `clubes`, `jugadores`, `plantillas` y la vista.
- `puzzles_diarios` (cuando exista el modo diario): lectura pública **solo de `fecha <= hoy en Lima`**,
  para que nadie vea el jugador de mañana consultando la API.
- En el modo de partidas al azar el navegador recibe la lista completa, así que el jugador secreto
  se puede descubrir mirando el código o la red. Se acepta en la fase 1: no hay premios ni rankings.
- Escritura solo con la `service_role` (script de importación), nunca desde el navegador.

## 3. Carga entre temporadas con CSV

### 3.1 Formato del CSV

Un archivo por temporada, UTF-8, separado por comas, con encabezado:

```csv
temporada,jugador_id,nombre,club_id,club_nombre,nacionalidad,posicion,fecha_nacimiento,dorsal,pie,elegible
2027,diego-quispe,Diego Quispe,universitario,Universitario,Perú,POR,1994-03-12,1,D,true
2027,matias-ferreyra,Matías Ferreyra,sporting-cristal,Sporting Cristal,Argentina,DEF,1996-11-02,2,I,true
```

- `jugador_id`: si se deja vacío, se genera desde `nombre` (minúsculas, sin tildes, con guiones).
  Si el jugador ya existe de otra temporada, **hay que reutilizar su id**.
- `elegible`: opcional, por defecto `true`.
- `nacionalidad`: lista cerrada de países en español (Perú, Argentina, Colombia, Uruguay, Venezuela…)
  para que la comparación exacta funcione.

### 3.2 Proceso de importación

1. **Validar** todo el archivo antes de escribir: columnas obligatorias, valores de `posicion` y `pie`,
   fechas válidas, dorsal 1–99, sin `jugador_id` duplicados, sin dos jugadores con el mismo dorsal en el
   mismo club. Si hay errores, se listan con número de fila y no se escribe nada.
2. **Upsert** de `clubes` por `club_id`.
3. **Upsert** de `jugadores` por `id` (actualiza nombre, nacionalidad, fecha, pie).
4. **Reemplazar** las `plantillas` de esa `temporada` (borrar e insertar en una transacción).
   Las de otras temporadas no se tocan.
5. Marcar la temporada como `vigente` cuando corresponda.
6. (Solo con modo diario) Generar los `puzzles_diarios` futuros con la nueva temporada. Los ya
   generados de fechas futuras se pueden regenerar; los pasados no.
7. Informe: N clubes, N jugadores nuevos, N actualizados, N plantillas cargadas.

### 3.3 Mientras no haya Supabase

El mismo CSV se puede convertir a `data/players.ts` con un script, para usar datos reales desde ya
con el mismo formato que después se importará a Supabase.
