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
  - [x] T07.1 Armar el CSV con el formato de `data-model.md` §3.1 (`data/raw/liga1-2026.csv`, 65 jugadores)
  - [x] T07.2 Normalizar nombres de clubes y países (lista cerrada de 13 países)
  - [x] T07.3 Importador CSV → `data/players.ts` con validación todo o nada (`npm run import:players`)
  - [x] T07.4 Revisar que los tests sigan pasando con la lista real, sin depender de cuántos jugadores hay
  - [x] T07.5 Tests del importador (válido, pie vacío, posición inválida, dorsal repetido, fecha inválida, comillas)
  - [x] T07.6 Crédito "Datos de jugadores: Wikipedia (CC BY-SA 4.0) y Wikidata" con enlace a la licencia
  - [ ] T07.7 Completar a mano los datos sin verificar del CSV: 61 de 65 `pie` sin fuente y 6 fechas que difieren de Wikidata (columnas `verif_*`)

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
  - [x] T22.9 Sin escudos oficiales, logos, fotos ni imágenes oficiales (restricción legal; ver T45 para las insignias genéricas)
  - [x] T22.10 Probado con Playwright en Chromium emulando 390 px, 360 px y escritorio 1280 px
  - [ ] T22.11 Revisar en celulares reales (iOS Safari y Android Chrome), incluido el menú nativo de compartir

- [x] T39 **Banderas en la columna País**
  - [x] T39.1 Banderas estilizadas en SVG propio para los 14 países de la lista (`lib/flags.ts`)
  - [x] T39.2 Componente `Flag` y celda de País con bandera + nombre pequeño; solo texto si falta la bandera
  - [x] T39.3 Bandera en el ejemplo del diálogo "¿Cómo se juega?"
  - [x] T39.4 Test: cada país de la lista tiene bandera
  - [x] T39.5 Probado en navegador a 360 px y 1280 px

- [x] T40 **Botón de pista**
  - [x] T40.1 Lógica pura en `lib/hints.ts` (disponibles, sorteo con azar inyectable, estado del botón, texto)
  - [x] T40.2 Pistas guardadas con la partida en curso (`hints`), reinicio en partida nueva
  - [x] T40.3 Botón "💡 Pista" (desde el 2.º intento fallido, máx. 2, "Sin pistas", deshabilitado al terminar)
  - [x] T40.4 Fila especial de pista (borde dorado, 💡, bandera para país, texto accesible)
  - [x] T40.5 Compartir con " 💡N" solo si se usaron pistas
  - [x] T40.6 Tests: atributo acertado, grupo secundario, máximo 2, aparición del botón, recarga, compartir
  - [x] T40.7 Probado en navegador a 360 px y 1280 px

- [x] T41 **Puntaje y texto de compartir**
  - [x] T41.1 Lógica pura en `lib/score.ts` con constantes ajustables (base por intento, bonus por pistas, parciales por categoría)
  - [x] T41.2 Mejor puntaje y total acumulado en `futbolazo:v2:puntaje`, sumados una sola vez al terminar
  - [x] T41.3 Tarjeta final: desglose, total con conteo animado (respeta movimiento reducido), mejor y acumulado
  - [x] T41.4 Compartir: ` · N pts` en el encabezado, frase con el jugador (singular/plural) y URL al final
  - [x] T41.5 Tests: ganar en cada intento con 0, 1 y 2 pistas; perder con parciales; todo gris = 0; tope 240 < 250; pistas no suman; récords; texto de compartir
  - [x] T41.6 Probado en navegador a 360 px y 1280 px

- [x] T42 **Nivel de dificultad (Fácil / Normal)**
  - [x] T42.1 `lib/difficulty.ts`: niveles, `EASY_CLUBS` (constante única) y `secretPool` con caída a Normal
  - [x] T42.2 Sorteo del secreto según el nivel; buscador e intentos con todos los jugadores
  - [x] T42.3 Nivel elegido en `futbolazo:v2:nivel` y `nivel` en la partida guardada (por defecto Normal)
  - [x] T42.4 Selector accesible antes del primer intento y en la tarjeta final; sin cambios a media partida
  - [x] T42.5 Compartir con " · Fácil" solo en Fácil
  - [x] T42.6 Récords (mejor y acumulado) por nivel, leyendo el formato anterior como Normal
  - [x] T42.7 Tests: sorteo por nivel, lista vacía → Normal, clubes existen, guardado del nivel, récords por nivel, compartir
  - [x] T42.8 Probado en navegador a 360 px y 1280 px

- [x] T43 **Reto de amigos (mismo jugador para el grupo)**
  - [x] T43.1 `lib/challenge.ts`: codificar, decodificar y validar el código (ofuscado, 7 caracteres, tolerante)
  - [x] T43.2 Invitación con link y resultado sin nombre; menú nativo o portapapeles
  - [x] T43.3 Al abrir `/?reto=`: jugar ese jugador y nivel, chip "🏆 Reto de amigos", sin selector; inválido → aviso y juego normal
  - [x] T43.4 Partidas de reto guardadas aparte (`futbolazo:v2:retos`); reto terminado no se vuelve a jugar; récords una sola vez
  - [x] T43.5 Compartir un reto: línea "🏆 Reto de amigos", link del reto, sin nombre
  - [x] T43.6 "Jugar otra vez" tras un reto vuelve al juego normal y limpia la URL
  - [x] T43.7 Tests de `challenge`, guardado de retos, arranque con `?reto=` y textos
  - [x] T43.8 Probado en navegador a 360 px y 1280 px

- [ ] T44 **Sonidos y vibración**
  - [x] T44.1 `lib/sounds.ts`: notas de cada sonido, política (ajuste + movimiento reducido) y plan por evento
  - [x] T44.2 `lib/audio.ts`: motor Web Audio que solo arranca tras un gesto, vibración segura
  - [x] T44.3 Sonidos al intentar (escalonados con el volteo), al pedir pista, al ganar y al perder; vibración
  - [x] T44.4 Botón Volume2 / VolumeX en la cabecera, accesible, guardado en `futbolazo:v2:sonido`
  - [x] T44.5 Tests: plan por evento, movimiento reducido, silenciado, motor con contexto y vibración simulados, guardado
  - [x] T44.6 Probado en navegador: el botón silencia, se recuerda al recargar, sin errores en consola
  - [ ] T44.7 Sonido real y vibración en celulares (lo prueba el usuario)

- [ ] T45 **Escudos genéricos de los clubes**
  - [x] T45.1 `lib/crests.ts`: un escudo por club (sigla, dos colores, diseño), sin símbolos oficiales
  - [x] T45.2 Componente `Crest` con el estilo de `Flag`
  - [x] T45.3 Escudo en la celda de Club, en la fila de pista de club y en el ejemplo de la ayuda (no en el buscador)
  - [x] T45.4 Tests: todos los clubes, sin colores ni siglas repetidos, contraste de la sigla
  - [x] T45.5 Probado en navegador a 360 px y 1280 px sobre celdas verde, amarilla y gris
  - [ ] T45.6 Revisar colores y siglas con el dueño del producto (los de confianza baja)

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
  - [ ] T29.1 Crear proyecto Supabase (lo hace el dueño del producto)
  - [x] T29.2 `supabase/schema.sql`: tabla plana `players` con las columnas del CSV y restricciones (spec §2.15, plan decisión 23)
  - [x] T29.3 RLS: una política de lectura `anon` solo `elegible = true`; sin escritura para `anon`
  - [x] T29.4 `lib/seedSql.ts` + `npm run db:seed-sql` → `supabase/seed.sql` con todas las filas, validado como el importador
  - [x] T29.6 Tests: filas = CSV, apóstrofes y tildes, `null`, errores, `seed.sql` al día, listas de `schema.sql` = importador
  - [x] T29.7 Probado en Postgres local: schema y seed dos veces, inserts inválidos rechazados, lectura como `anon`
  - [ ] T29.8 Pegar `schema.sql` y `seed.sql` en el SQL Editor de Supabase (lo hace el dueño del producto)
  - [ ] T29.5 La app lee los jugadores de la temporada vigente desde Supabase (pendiente; sin claves todavía)

## Publicación
- [ ] T30 **Repo y despliegue en Vercel**
  - [x] T30.1 `git init` y primer commit
  - [x] T30.2 Repo en GitHub (`shariffjoaquin/futbolazo`)
  - [ ] T30.3 Conectar a Vercel y desplegar
  - [ ] T30.4 Variables de entorno de Supabase en Vercel
  - [ ] T30.5 Dominio (opcional)

## Seguridad y mantenimiento
- [x] T31 **Revisión de vulnerabilidades de npm**
  - [x] T31.1 Analizar `npm audit`: había 3 (2 críticas, 1 moderada), todas por `vitest` 3.x → `tinypool`, `@vitest/mocker`; solo de desarrollo
  - [x] T31.2 Subir a `vitest` 4.x (cambio mayor, aprobado) y volver a correr los tests
  - [x] T31.3 Confirmar `npm audit` limpio: 0 vulnerabilidades (con y sin dependencias de desarrollo)
  - [x] T31.4 `.github/dependabot.yml`: npm, semanal
- [ ] T46 **Seguridad básica para publicar** (spec §2.13, plan decisión 16)
  - [x] T46.1 `lib/securityHeaders.ts` (CSP y cabeceras, pura) con tests
  - [x] T46.2 `next.config.ts`: `headers()` para todas las rutas y `poweredByHeader: false`
  - [x] T46.3 Auditar entradas: `?reto=`, `localStorage` (partida, recientes, récords, nivel, sonido, retos, ayuda), buscador y texto de compartir; sin `dangerouslySetInnerHTML`, `eval` ni HTML con texto del usuario
  - [x] T46.4 Validar que la fecha guardada sea un día real; buscador recortado a 40 caracteres (`lib/search.ts`)
  - [x] T46.5 Tests de casos hostiles: JSON inválido, tipos incorrectos, cadenas enormes, `<script>` en el parámetro
  - [x] T46.6 Secretos: sin `.env` ni claves en el repo ni en el historial; `.gitignore` los cubre
  - [x] T46.7 Sin rutas API ni server actions expuestas
  - [x] T46.8 Navegador a 360 y 1280 px con la CSP activa: juego completo y sin violaciones en consola
  - [ ] T46.9 Revisar las cabeceras en el despliegue real de Vercel (pendiente de T30.3)

## Ícono y textos
- [x] T47 **Ícono propio** (spec §2.14, plan decisión 17)
  - [x] T47.1 `lib/brandIcon.ts`: SVG del balón con banda roja, legible a 16 y 32 px
  - [x] T47.2 `scripts/generate-icons.tsx` (`npm run icons`): `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`, `public/icons/` 192, 512 y maskable
  - [x] T47.3 Reemplazar el `favicon.ico` de Next.js por el generado
  - [x] T47.4 `app/manifest.ts` y `themeColor` desde `ICON_COLORS.night`
  - [x] T47.5 Tests: `icon.svg` igual al generado, tamaños de los PNG e ICO, manifiesto, colores del tema
  - [x] T47.6 Navegador: pestaña a 16 y 32 px, manifiesto e íconos cargan, sin errores de CSP
- [x] T48 **Texto "el jugador secreto"** en el selector de nivel y en la leyenda de colores

## Tarjeta como imagen
- [ ] T49 **Compartir imagen** (spec §2.8.1, plan decisión 18)
  - [x] T49.1 `lib/shareImage.ts`: `shareCardContent` y `layoutShareCard` (puros) con tests (cada tipo de resultado, regla del nombre en retos, texto de intentos, márgenes seguros)
  - [x] T49.2 `drawShareCard` y `createShareImage` (Canvas 2D, fuentes del juego, bombilla dibujada), con test de contexto simulado
  - [x] T49.3 Botón "Compartir imagen" en la tarjeta final; compartir archivo o descargar `futbolazo-resultado.png`; mensajes "Imagen lista" / "No se pudo generar la imagen"
  - [x] T49.4 Pre-generar la imagen al aparecer la tarjeta final
  - [x] T49.5 Navegador a 360 y 1280 px: generar, abrir y revisar la imagen (ganar, perder, reto, Fácil con pistas); sin errores de CSP
  - [ ] T49.6 Menú de compartir en celular real (lo prueba el usuario)
- [x] T50 **Escudo del club en la imagen de resultado** (spec §2.8.1, plan decisión 18)
  - [x] T50.1 Medidas de dibujo del escudo en `lib/crests.ts`, compartidas por `components/Crest.tsx` y el canvas
  - [x] T50.2 `shareCardContent` con el club (nada en retos); fila "escudo + club" en `layoutShareCard`; dibujo con `Path2D`
  - [x] T50.3 Reajustar el diseño: grilla en el espacio que queda, dentro de márgenes con escudo, nombre largo y 6 filas
  - [x] T50.4 Tests: con escudo, sin escudo (retos, club sin escudo), márgenes y sin pisarse en todos los escenarios
  - [x] T50.5 Navegador: ganar al primer intento, perder con 6 filas y 2 pistas, reto, Cienciano (sigla de 3 letras)

## Futuro (fuera de la fase 1)
- [ ] F01 **Modo diario**: exponer `lib/daily.ts` como modo aparte, con su guardado, número de puzzle y `puzzles_diarios` en Supabase
