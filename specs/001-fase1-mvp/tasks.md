# Tareas — Fase 1

Leyenda: `[x]` hecho · `[ ]` pendiente · `[~]` hecho pero fuera de uso (funcionalidad futura)

## Base del proyecto
- [x] T01 Proyecto Next.js 16 + React 19 + TypeScript + Tailwind 4
- [x] T02 ESLint configurado (`npm run lint`)
- [x] T03 Vitest configurado (`npm test`)
- [x] T04 README con comandos y archivos principales

## Datos
- [x] T05 Tipo `Player` (id, nombre, club, nacionalidad, posición, fecha de nacimiento, dorsal, pie)
- [x] T06 Lista de 10 jugadores ficticios de prueba en `data/players.ts`
- [ ] T07 **Datos reales de Liga 1** (temporada vigente)
  - [ ] T07.1 Armar el CSV con el formato de `data-model.md` §3.1
  - [ ] T07.2 Normalizar nombres de clubes y países
  - [ ] T07.3 Script CSV → `data/players.ts` con validación
  - [ ] T07.4 Revisar que los tests sigan pasando con la lista real (`share.test.ts` usa los dos primeros jugadores)

## Lógica del juego
- [x] T08 Fecha del día en hora de Lima (`getLimaDateKey`)
- [~] T09 Número de puzzle desde el lanzamiento 2026-11-26 (`getPuzzleNumber`) — modo diario futuro
- [~] T10 Jugador del día determinista, sin repetir en el ciclo ni dos días seguidos (`getDailyPlayer`) — modo diario futuro
- [x] T11 Comparación de pistas: club, país, posición (vecina = cerca), edad (±2), dorsal (±3), pie, con flechas
- [x] T12 Edad en años cumplidos a una fecha dada (`ageOn`)
- [x] T13 Acierto por `id`, máximo 6 intentos
- [x] T14 Texto para compartir con grilla de emojis y `X/6` al perder
- [x] T32 **Partidas ilimitadas**: sorteo al azar sin repetir los últimos 10 (`lib/random.ts`)
- [x] T33 Empezar o retomar partida, guardando la fecha de inicio para calcular edades (`lib/game.ts`)
- [x] T34 Texto para compartir sin número de puzzle: `Futbolazo 🇵🇪 4/6`

## Interfaz
- [x] T15 Buscador con autocompletado, sin tildes ni mayúsculas, solo jugadores de la lista
- [x] T16 Navegación por teclado (↑ ↓ Enter Esc) y atributos ARIA de combobox
- [x] T17 Filas de pistas con colores y flechas, más reciente arriba, huecos vacíos
- [x] T18 Pantalla de fin (gana / pierde) que revela al jugador
- [x] T19 Botón Compartir: `navigator.share` con respaldo a portapapeles y aviso
- [x] T20 Leyenda de colores y flechas
- [x] T21 Carga solo en el cliente (`GameLoader` con `ssr: false`)
- [x] T35 Botón "Jugar otra vez" al terminar; contador "Intento N de 6" sin número de puzzle
- [x] T22 **Rediseño visual "noche de estadio"** (tanda 3, ver `plan.md` §4)
  - [x] T22.1 Paleta como variables CSS (fondo césped, acento rojo/blanco, pistas verde/amarillo)
  - [x] T22.2 Fuentes con `next/font`: Barlow Condensed + Inter
  - [x] T22.3 shadcn/ui (Button, Dialog, Command) e íconos Lucide
  - [x] T22.4 Animaciones con Motion: volteo de celdas, rebote de fila nueva, transición del panel final
  - [x] T22.5 Confeti al ganar y mensaje de derrota con humor
  - [x] T22.6 Pantalla final con resultado en emojis y botones grandes
  - [x] T22.7 Diálogo "¿Cómo se juega?" con ejemplos de pistas (se abre solo la primera vez)
  - [x] T22.8 `prefers-reduced-motion` y contraste AA (mínimo 5,2:1 en texto normal)
  - [x] T22.9 Sin escudos, logos, fotos ni imágenes oficiales (restricción legal)
  - [x] T22.10 Probado con Playwright en Chromium emulando 390 px, 360 px y escritorio 1280 px
  - [ ] T22.11 Revisar en celulares reales (iOS Safari y Android Chrome), incluido el menú nativo de compartir

## Persistencia
- [~] T23 Progreso del día en `localStorage` (`futbolazo:v1:<fecha>`) — reemplazado por T36; las claves viejas se borran
- [x] T24 Tolerancia a datos corruptos o `localStorage` bloqueado
- [x] T36 Partida en curso en `futbolazo:v2:partida` y últimos sorteados en `futbolazo:v2:recientes`

## Tests
- [x] T25 Tests de `daily` (zona horaria, número, determinismo, ciclos, sin repetir seguidos) — se mantienen
- [x] T26 Tests de `compare` (cada pista, tolerancias, flechas, edad)
- [x] T27 Tests de `share` (formato sin número, `X/6`)
- [x] T28 Tests de `storage` (cargar, guardar, datos corruptos, `localStorage` bloqueado, limpieza de `v1`)
- [x] T37 Tests de `random` (excluye últimos 10, listas cortas, recientes sin duplicados y máx. 10)
- [x] T38 Tests de `game` (retomar tras recargar, no gastar jugador al recargar, jugar otra vez)

## Base de datos
- [ ] T29 **Base de datos Supabase**
  - [ ] T29.1 Crear proyecto Supabase
  - [ ] T29.2 Migraciones: `clubes`, `jugadores`, `plantillas`, vista `jugadores_temporada`
  - [ ] T29.3 Políticas RLS (lectura pública, escritura solo `service_role`)
  - [ ] T29.4 Script de importación del CSV con validación
  - [ ] T29.5 La app lee los jugadores de la temporada vigente desde Supabase

## Publicación
- [ ] T30 **Repo y despliegue en Vercel**
  - [x] T30.1 `git init` y primer commit
  - [x] T30.2 Repo en GitHub (`shariffjoaquin/futbolazo`)
  - [ ] T30.3 Conectar a Vercel y desplegar
  - [ ] T30.4 Variables de entorno de Supabase en Vercel
  - [ ] T30.5 Dominio (opcional)

## Seguridad y mantenimiento
- [ ] T31 **Revisión de vulnerabilidades de npm**
  - [ ] T31.1 Analizar `npm audit`: hoy 3 (2 críticas, 1 moderada), todas por `vitest` 3.x → `tinypool`, `@vitest/mocker`; solo de desarrollo
  - [ ] T31.2 Subir a `vitest` 4.x (cambio mayor) y volver a correr los tests
  - [ ] T31.3 Confirmar `npm audit` limpio o dejar justificado lo que quede

## Futuro (fuera de la fase 1)
- [ ] F01 **Modo diario**: exponer `lib/daily.ts` como modo aparte, con su guardado, número de puzzle y `puzzles_diarios` en Supabase
