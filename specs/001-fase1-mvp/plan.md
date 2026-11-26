# Plan técnico — Fase 1

**Revisión 2:** partidas ilimitadas con jugador al azar. El modo diario queda como funcionalidad futura.

## 1. Stack

| Capa | Ahora (fase 1) | Después |
|---|---|---|
| Framework | **Next.js 16.4.6** (App Router, Turbopack) + React 19.3 + TypeScript 5 | igual |
| Estilos | Tailwind CSS 4.3 (vía loader `@tailwindcss/turbopack`) | rediseño visual pendiente |
| Datos de jugadores | Array estático en `data/players.ts` (10 jugadores ficticios) | **Supabase** (Postgres), cargado desde CSV |
| Estado del usuario | `localStorage`: partida en curso + últimos 10 sorteados | sigue en `localStorage` (no hay login en fase 1) |
| Tests | Vitest 3.2 (`npm test`) | igual |
| Lint | ESLint 9 + `eslint-config-next` (core-web-vitals + typescript) | igual |
| Hosting | local (`npm run dev`) | **Vercel** |
| Repo | sin control de versiones todavía | repo Git (GitHub) conectado a Vercel |

> Nota: esta versión de Next.js trae cambios respecto a versiones anteriores. Antes de tocar
> código, revisar la guía en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## 2. Estructura de carpetas actual

```
futbolazo/
├── app/
│   ├── layout.tsx        # HTML raíz, fuente Geist, metadata, lang="es", themeColor
│   ├── page.tsx          # Portada: título + <GameLoader />
│   ├── globals.css       # Tailwind + variable de fuente
│   └── favicon.ico
├── components/
│   ├── GameLoader.tsx    # Carga <Game /> solo en el cliente (dynamic, ssr: false)
│   └── Game.tsx          # UI: buscador, filas de pistas, fin de partida, compartir, jugar otra vez
├── data/
│   └── players.ts        # Tipos Player/Posicion/Pie, lista de jugadores, getPlayerById
├── lib/
│   ├── random.ts         # Sorteo al azar sin repetir los últimos 10 (pickRandomPlayer, addRecent)
│   ├── game.ts           # Empezar partida nueva o retomar la guardada
│   ├── storage.ts        # Guardar/cargar partida en curso y recientes en localStorage
│   ├── compare.ts        # Comparación intento vs objetivo, cálculo de edad
│   ├── share.ts          # Texto para compartir, MAX_GUESSES, orden de atributos
│   ├── daily.ts          # Fecha de Lima (en uso) y modo diario (futuro, sin uso en la UI)
│   └── *.test.ts         # Tests de random, game, storage, daily, compare y share
├── specs/
│   └── 001-fase1-mvp/    # Esta especificación
├── next.config.ts        # cacheComponents, partialPrefetching, regla Turbopack para CSS
├── vitest.config.ts      # alias "@" y patrón **/*.test.ts
├── eslint.config.mjs
├── tsconfig.json
├── AGENTS.md
└── README.md
```

## 3. Decisiones técnicas

1. **Todo el juego corre en el cliente.** `Game` se carga con `next/dynamic` y `ssr: false`
   porque el sorteo, la fecha de Lima y `localStorage` no existen en el servidor. Evita desajustes de
   hidratación. La página se genera como estática.
2. **Sorteo con `Math.random`, inyectable.** `pickRandomPlayer(recientes, lista, rand)` recibe la
   función aleatoria como parámetro para poder probarla con valores fijos. No hace falta azar
   criptográfico: es un juego.
3. **Exclusión de recientes**: se excluyen los últimos `min(10, N − 1)` ids sorteados, así siempre
   queda al menos un candidato. La lista de recientes se actualiza **al empezar** la partida
   (no al terminarla), para que recargar o dejarla a medias no permita volver a sacar al mismo jugador.
   El id se mueve al final si ya estaba y se recorta a 10.
4. **Empezar o retomar es idempotente.** `resumeOrStartGame()` primero intenta cargar la partida
   guardada y solo si no hay una válida empieza otra (y la guarda en el acto). Por eso el doble
   render de React en modo estricto no gasta dos jugadores.
5. **La partida guarda su fecha de inicio** (fecha de Lima, `"YYYY-MM-DD"`, calculada con
   `Intl.DateTimeFormat` y `timeZone: "America/Lima"`). Las edades se calculan a esa fecha.
6. **Edad derivada de `fechaNacimiento`** en años cumplidos. No se guarda la edad como número para
   que no envejezca mal entre temporadas.
7. **Tolerancias como constantes** en `lib/compare.ts`: `AGE_TOLERANCE = 2`, `DORSAL_TOLERANCE = 3`,
   orden de posiciones `POR → DEF → MED → DEL`.
8. **Acierto por `id`**, no por igualdad de atributos.
9. **Solo se aceptan jugadores de la lista** (autocompletado), así cada intento se puede comparar
   y no hay que manejar errores de tipeo.
10. **`localStorage` con formato `v2`**:
    - `futbolazo:v2:partida` → `{ "targetId": string, "guesses": string[], "fecha": "YYYY-MM-DD" }`
    - `futbolazo:v2:recientes` → `string[]` (máx. 10, el más reciente al final)
    - Al cargar se descartan ids desconocidos, duplicados y lo que pase de 6 intentos. Si el
      `targetId` no existe o la fecha no es válida, la partida se descarta.
    - Al guardar se borran las claves antiguas `futbolazo:v1:*` del modo diario.
11. **Compartir**: `navigator.share` primero y portapapeles como respaldo. El texto no lleva número de
    puzzle ni revela al jugador.
12. **Lógica pura separada de la UI.** `random`, `compare`, `share` y `daily` son funciones puras;
    `storage` y `game` se prueban con un `localStorage` simulado. `Game.tsx` solo orquesta estado y presentación.
13. **Modo diario conservado.** `lib/daily.ts` y `lib/daily.test.ts` se mantienen sin cambios para
    retomarlo como modo aparte; hoy la UI solo usa `getLimaDateKey`.
14. **Textos de la interfaz en español** y `lang="es"`.
15. **Sin dependencias de runtime** aparte de Next y React.

## 4. Plan para lo pendiente

1. **Datos reales de Liga 1**: reemplazar los jugadores ficticios por la plantilla real de la
   temporada vigente, todavía en `data/players.ts`, generado desde el CSV definido en `data-model.md`.
   Con más de 10 jugadores, la exclusión de recientes pasa a ser de 10 completos.
2. **Rediseño visual**: identidad propia (colores, tipografía, escudos), sin cambiar la mecánica.
3. **Supabase**: crear las tablas de `data-model.md`, script de importación del CSV y lectura de
   jugadores desde la app. El sorteo sigue en el cliente y el estado sigue en `localStorage`.
4. **Repo y Vercel**: inicializar Git, subir a GitHub, conectar a Vercel, configurar variables de
   entorno de Supabase (no subir `.env*`, ya está en `.gitignore`).
5. **Vulnerabilidades de npm**: `npm audit` reporta hoy 3 (2 críticas, 1 moderada), todas por
   `vitest` 3.x y sus dependencias (`tinypool`, `@vitest/mocker`). Son de desarrollo, no llegan al
   sitio publicado. La solución propuesta es subir a `vitest` 4.x (cambio mayor) y volver a correr los tests.
6. **Modo diario (futuro, fuera de fase 1)**: exponer `lib/daily.ts` como un modo aparte, con su
   propio guardado y número de puzzle, y con `puzzles_diarios` en Supabase.
