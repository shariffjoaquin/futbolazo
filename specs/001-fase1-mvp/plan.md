# Plan técnico — Fase 1

**Revisión 2:** partidas ilimitadas con jugador al azar. El modo diario queda como funcionalidad futura.

## 1. Stack

| Capa | Ahora (fase 1) | Después |
|---|---|---|
| Framework | **Next.js 16.4.6** (App Router, Turbopack) + React 19.3 + TypeScript 5 | igual |
| Estilos | Tailwind CSS 4.3 (vía loader `@tailwindcss/turbopack`) + variables CSS de marca | igual |
| UI | shadcn/ui (Button, Dialog, Command) + íconos Lucide | igual |
| Animación | Motion (`motion/react`) + `canvas-confetti` | igual |
| Fuentes | `next/font/google`: Barlow Condensed (títulos y datos) + Inter (texto) | igual |
| Datos de jugadores | Array estático en `data/players.ts` (10 jugadores ficticios) | **Supabase** (Postgres), cargado desde CSV |
| Estado del usuario | `localStorage`: partida en curso + últimos 10 sorteados | sigue en `localStorage` (no hay login en fase 1) |
| Tests | Vitest 4.1 (`npm test`) | igual |
| Lint | ESLint 9 + `eslint-config-next` (core-web-vitals + typescript) | igual |
| Hosting | local (`npm run dev`) | **Vercel** |
| Repo | sin control de versiones todavía | repo Git (GitHub) conectado a Vercel |

> Nota: esta versión de Next.js trae cambios respecto a versiones anteriores. Antes de tocar
> código, revisar la guía en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## 2. Estructura de carpetas actual

```
futbolazo/
├── app/
│   ├── layout.tsx        # HTML raíz, fuentes (Inter, Barlow Condensed), metadata, lang="es", themeColor
│   ├── page.tsx          # Portada: título + <GameLoader />
│   ├── globals.css       # Tailwind + variables de marca
│   ├── manifest.ts       # Manifiesto: nombre, colores, standalone, íconos
│   ├── icon.svg          # Favicon (generado desde lib/brandIcon.ts)
│   ├── favicon.ico       # 16/32/48 px, mismo diseño (generado)
│   └── apple-icon.png    # 180 px (generado)
├── public/icons/         # icon-192.png, icon-512.png, icon-maskable-512.png (generados)
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
│   ├── score.ts          # Puntaje de la partida, constantes y récords (mejor y acumulado)
│   ├── difficulty.ts     # Niveles Fácil / Normal, clubes de Fácil y grupo de sorteo del secreto
│   ├── challenge.ts      # Reto de amigos: código del link (codificar, decodificar, validar) e invitación
│   ├── crests.ts         # Escudos genéricos de los clubes (colores, sigla, diseño) y contraste
│   ├── sounds.ts         # Qué sonido y qué vibración para cada evento (lógica pura) y definición de notas
│   ├── audio.ts          # Motor Web Audio + vibración, ajuste de sonido en memoria (fuera de la lógica pura)
│   ├── shareImage.ts     # Tarjeta de resultado en PNG: contenido y diseño (puros) + dibujo en Canvas
│   ├── search.ts         # Búsqueda de jugadores sin tildes, con largo máximo (40)
│   ├── brandIcon.ts      # SVG del ícono (balón y banda roja) y colores; fuente de todos los íconos
│   ├── securityHeaders.ts # CSP y cabeceras de seguridad (las aplica next.config.ts)
│   ├── daily.ts          # Fecha de Lima (en uso) y modo diario (futuro, sin uso en la UI)
│   └── *.test.ts         # Tests de cada módulo; hostile.test.ts: URL y localStorage manipulados
├── specs/
│   └── 001-fase1-mvp/    # Esta especificación
├── .github/
│   └── dependabot.yml    # Dependabot: npm, semanal
├── next.config.ts        # cacheComponents, partialPrefetching, cabeceras de seguridad, sin X-Powered-By, regla Turbopack para CSS
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
    - `futbolazo:v2:partida` → `{ "targetId": string, "guesses": string[], "fecha": "YYYY-MM-DD", "hints": HintType[] }`
      (`hints` es opcional al leer: una partida guardada antes del botón de pista se carga con `[]`)
    - `futbolazo:v2:recientes` → `string[]` (máx. 10, el más reciente al final)
    - `futbolazo:v2:nivel` → `"facil" | "normal"` (por defecto `"normal"`)
    - `futbolazo:v2:puntaje` → `{ "normal": { mejor, total }, "facil": { mejor, total } }` (enteros ≥ 0;
      lo que falte o no sea válido cuenta como 0; el formato viejo `{ mejor, total }` se lee como Normal)
    - La partida guarda `nivel`; sin `nivel` se carga como `"normal"`.
    - `futbolazo:v2:retos` → `{ [código]: partida }` (mismo formato que `partida`, máx. 30).
    - `futbolazo:v2:sonido` → `"on" | "off"` (si falta: ajuste por defecto).
    - Al cargar se descartan ids desconocidos, duplicados y lo que pase de 6 intentos. Si el
      `targetId` no existe o la fecha no es válida, la partida se descarta.
    - Al guardar se borran las claves antiguas `futbolazo:v1:*` del modo diario.
11. **Compartir**: `navigator.share` primero y portapapeles como respaldo. El texto no lleva número de
    puzzle; desde la revisión 4 lleva el puntaje y una frase con el jugador secreto de la partida
    (cada partida es al azar, así que no arruina la de otro). `buildShareText` recibe un objeto
    (`results`, `won`, `hintsUsed`, `points`, `targetName`, `url`) y no calcula el puntaje: lo recibe,
    para que `share.ts` no dependa de `score.ts`.
12. **Puntaje** (`lib/score.ts`, lógica pura):
    - Constantes en un solo lugar: `WIN_BASE = [1000, 850, 700, 550, 400, 250]`,
      `UNUSED_HINT_BONUS = 100`, `CATEGORY_POINTS = { correct: 40, close: 20, wrong: 0 }`; de ahí salen
      `MAX_WIN_SCORE` (1200) y `MAX_LOSS_SCORE` (240).
    - `computeScore(results, hintsUsed)` devuelve el desglose (ganada: intento, base, pistas sin usar,
      bonus, total; perdida: mejor estado y puntos por categoría, total). Ganar se deduce de que algún
      intento sea el jugador secreto. Las pistas del botón no entran: solo se miran los intentos.
    - `addScore(stats, points)` actualiza mejor y acumulado. `recordScore(points)` en `storage.ts` lo
      persiste. Se llama **solo en el envío del intento que termina la partida**, nunca al cargar, así
      recargar una partida terminada no suma dos veces.
    - El conteo animado usa `animate` de Motion sobre un `MotionValue`; con movimiento reducido
      (`useReducedMotion`) se pone el valor final directo. El número animado va `aria-hidden` y el
      total se lee una sola vez con texto para lectores de pantalla.
13. **Nivel de dificultad** (`lib/difficulty.ts`, lógica pura):
    - `EASY_CLUBS` es la única lista de clubes de Fácil. Se compara por **nombre de club** porque
      `Player` no guarda `club_id` (el CSV sí: `universitario`, `alianza-lima`, `sporting-cristal`,
      `cienciano`, `melgar`). Un test comprueba que cada club de la lista exista en `data/players.ts`.
    - `secretPool(nivel, lista, clubes)` devuelve los candidatos a secreto; en Fácil filtra por club y,
      si queda vacío, devuelve la lista completa (cae a Normal).
    - `startNewGame` sortea con `pickRandomPlayer(recientes, secretPool(nivel))`; el nivel sale por
      defecto de la preferencia guardada. El buscador sigue usando `players` completo.
    - Preferencia (`nivel`) y nivel de la partida (`game.nivel`) son cosas distintas: la preferencia se
      cambia en el selector; la partida conserva el suyo. Antes del primer intento, cambiar la
      preferencia vuelve a sortear; en la tarjeta final solo guarda la preferencia para "Jugar otra vez".
    - Selector como grupo de radios nativos dentro de un `fieldset` con `legend`:
      flechas, Tab y Espacio funcionan sin código extra.
14. **Reto de amigos** (`lib/challenge.ts`, lógica pura; sin backend ni dependencias nuevas):
    - `encodeChallenge(id, nivel)`: FNV-1a de 32 bits con un prefijo fijo, base 36, 7 caracteres.
      Corto y opaco; no es seguridad (alguien podría probar códigos), solo evita leer el nombre.
    - `decodeChallenge(codigo, lista)`: normaliza (minúsculas, quita lo que no sea `[0-9a-z]`), valida
      el largo y busca entre todos los jugadores × niveles; `null` si no hay coincidencia.
    - `challengeUrl(base, código)`, `buildInviteText(url, resultado?)` y el resultado compacto
      ("Yo lo saqué en 4/6 · 650 pts").
    - `lib/game.ts`: `bootGame(search)` decide al cargar entre reto válido, reto inválido (aviso) o
      partida normal; `resumeOrStartChallenge(código)` retoma o crea la partida de ese reto.
      `storage.ts` guarda los retos en su propia clave, con el mismo validador que la partida normal.
    - `Game.tsx` lleva el código del reto en estado y guarda con `saveChallenge` o `saveGame` según
      el modo. La URL se lee de `window.location` al iniciar (el juego ya corre solo en el cliente) y
      se limpia con `window.history.replaceState`, que Next 16 integra con su router.
    - Los récords se suman en el mismo punto que una partida normal (el intento que la termina), y
      como un reto terminado no se puede reabrir para jugar, suman una sola vez.
15. **Sonidos y vibración** (sin dependencias ni archivos de audio):
    - `lib/sounds.ts` (puro, con tests): cada sonido es una lista de notas (frecuencia, inicio,
      duración, forma de onda, ganancia); `feedbackPolicy(ajuste, movimientoReducido)` decide si hay
      sonido, sonidos de animación y vibración; `planGuess(...)` y `planHint(...)` devuelven qué
      sonidos van en qué segundo y qué patrón de vibración, ya filtrados por la política. Los tiempos
      salen de las mismas constantes del volteo (`FLIP_STAGGER`, `FLIP_DURATION`).
    - `lib/audio.ts`: motor con `AudioContext` inyectable. **No crea el contexto al construirse**:
      `unlock()` lo crea o lo reanuda y solo se llama dentro de manejadores de eventos del usuario.
      `play` programa osciladores con `currentTime + inicio` (sin `setTimeout`); la vibración usa un
      temporizador y está envuelta en `try/catch`. Un volumen maestro bajo (0,25) para todo.
      Los tests usan un `AudioContext` y un `vibrate` simulados.
    - El ajuste vive en memoria (y se guarda en `localStorage`), así silenciar funciona aunque
      `localStorage` esté bloqueado. El botón de la cabecera se carga solo en el cliente, como la ayuda.
    - El movimiento reducido se lee con `useReducedMotion` de Motion en el momento del evento.
16. **Seguridad básica** (sin backend; ver spec §2.13):
    - **Cabeceras en `next.config.ts`** (`headers()` para todas las rutas) y `poweredByHeader: false`.
      La CSP se arma en `lib/securityHeaders.ts` (pura, con tests) para poder revisarla sin build.
    - **CSP:** `default-src 'self'`; `script-src 'self' 'unsafe-inline'`; `style-src 'self'
      'unsafe-inline'`; `img-src 'self'` (banderas y escudos son SVG inline, sin imágenes); `font-src 'self'`; `connect-src 'self'`;
      `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`;
      `upgrade-insecure-requests` (solo en producción).
      - **Por qué `'unsafe-inline'` en scripts:** la página es estática (prerenderizada con
        `cacheComponents`) y Next mete el payload de React en `<script>` inline. Los nonces exigen
        render dinámico en cada visita y no funcionan con el prerender parcial; los hashes cambian
        en cada build. Se acepta porque la página no muestra HTML hecho con datos del usuario (ver
        auditoría de entradas), así que no hay por dónde inyectar un script; la CSP sigue
        bloqueando scripts de otros dominios, `eval`, `<object>`, `<base>` y el iframe.
      - **Por qué `'unsafe-inline'` en estilos:** el diálogo de Radix ("¿Cómo se juega?") bloquea el
        scroll de fondo con un `<style>` que lleva el ancho de la barra de scroll de cada
        dispositivo, así que un hash no sirve. Los `style=` de Motion se ponen desde JS y no lo
        necesitan. Inyectar CSS no ejecuta código.
      - **Confeti sin worker:** `canvas-confetti` crea por defecto un Web Worker desde un `blob:`;
        se usa una instancia con `useWorker: false` para no abrir `worker-src blob:`.
      - **`'unsafe-eval'` solo en `next dev`**: React lo usa para reconstruir trazas de error. En
        producción no se usa.
      - `next/font` sirve las fuentes desde el propio sitio (`/_next/static/media`), así que basta
        `font-src 'self'`. Banderas y escudos son SVG inline; el audio se genera con Web Audio
        (no necesita `media-src`).
    - **Otras cabeceras:** `X-Content-Type-Options: nosniff`, `Referrer-Policy:
      strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(),
      microphone=(), geolocation=()` (más pago, USB y sensores de movimiento, que el juego no usa) y
      `Strict-Transport-Security: max-age=63072000; includeSubDomains` (sin `preload` hasta tener
      dominio propio).
    - **Entradas:** el código de reto se normaliza a `[0-9a-z]` y solo vale si coincide con un
      jugador; lo leído de `localStorage` pasa por validadores que descartan lo que no encaja (la
      fecha de la partida debe ser un día real del calendario); el buscador se recorta a 40
      caracteres (`lib/search.ts`, pura). Todo se muestra como texto con React.
    - **Dependencias:** Vitest 4 (cierra las vulnerabilidades de `tinypool` y `@vitest/mocker`) y
      Dependabot semanal para npm.
17. **Ícono del juego** (spec §2.14; sin dependencias nuevas):
    - **Una sola fuente**: `lib/brandIcon.ts` arma el SVG (viewBox 64 × 64) con opciones de esquinas
      redondeadas y margen. Formas gruesas para 16 px: balón de radio 21, pentágono central, cinco
      costuras de 2,4 y parches del borde recortados por el balón, contorno oscuro de 2 para separarlo
      de la banda roja.
    - **`npm run icons`** (`scripts/generate-icons.tsx`) escribe `app/icon.svg` y convierte el SVG a
      PNG con `ImageResponse` de `next/og`, que ya viene con Next: `app/apple-icon.png` (180),
      `public/icons/icon-192.png`, `icon-512.png` e `icon-maskable-512.png` (margen del 10 %, el balón
      queda dentro de la zona segura). `app/favicon.ico` se arma a mano: cabecera ICO con PNG de 16,
      32 y 48 px adentro. Los archivos generados se versionan; un test avisa si `app/icon.svg` no
      coincide con `lib/brandIcon.ts`.
    - **Esquinas**: redondeadas en `icon.svg`, `favicon.ico` y los íconos de 192/512; cuadradas en
      `apple-icon` y el maskable, porque el sistema les pone su propia máscara.
    - **Manifiesto** con `app/manifest.ts` (Next lo sirve en `/manifest.webmanifest` y agrega el
      `<link>`); `theme_color` y `background_color` salen de `ICON_COLORS.night`, el mismo valor que
      `themeColor` del layout y `--stadium-night`.
    - La CSP no cambia: íconos y manifiesto son del propio sitio (`img-src 'self'`, `default-src 'self'`).
18. **Tarjeta de resultado como imagen** (spec §2.8.1; sin dependencias):
    - `lib/shareImage.ts` en tres capas:
      1. `shareCardContent(...)` (pura): qué se muestra (frase, nombre o "Reto de amigos", N/6,
         puntaje, pistas, nivel, filas de colores). La regla del nombre es la misma del texto.
      2. `layoutShareCard(content)` (pura): lista de operaciones de dibujo con posiciones, tamaños,
         fuentes y colores en la caja de 1080 × 1920. Los tests comprueban que todo queda dentro de los
         márgenes seguros (260 arriba, 380 abajo, 120 a los lados) y que los bloques no se pisan; la
         grilla usa celdas de 56 px y se centra en el espacio de 6 filas.
      3. `drawShareCard(ctx, ops, fonts)` dibuja en un `CanvasRenderingContext2D` (se prueba con un
         contexto simulado) y `createShareImage(...)` arma el canvas, espera las fuentes y devuelve
         el `Blob` PNG. Los textos con ancho máximo se achican hasta caber (`measureText`).
    - **Fuentes**: se leen las familias de `--font-display` y `--font-sans` (las de `next/font`) y se
      cargan con `document.fonts.load` en el peso y estilo exactos antes de dibujar; luego
      `document.fonts.ready`.
    - **Sin emoji en el canvas**: la pista es una bombilla dibujada (círculo, cuello y base).
    - **Compartir**: `navigator.canShare({ files: [png] })` → `navigator.share({ files })`; si no se
      puede o el navegador lo rechaza (`NotAllowedError`), se descarga con un `<a download>` y un
      `blob:` temporal que se libera enseguida. Cancelar (`AbortError`) no hace nada.
    - **CSP sin cambios**: la imagen no se muestra en la página, solo se comparte como archivo o se
      descarga, así que no hace falta `img-src blob:` ni `data:`.
    - **Pre-generación**: al aparecer la tarjeta final se genera la imagen en segundo plano y se
      guarda; el clic la comparte sin esperar, dentro del gesto del usuario (Safari rechaza
      `navigator.share` si pasa demasiado tiempo). Si aún no está, se genera al pulsar.
19. **Lógica pura separada de la UI.** `random`, `compare`, `share` y `daily` son funciones puras;
    `storage` y `game` se prueban con un `localStorage` simulado. `Game.tsx` solo orquesta estado y presentación.
20. **Modo diario conservado.** `lib/daily.ts` y `lib/daily.test.ts` se mantienen sin cambios para
    retomarlo como modo aparte; hoy la UI solo usa `getLimaDateKey`.
21. **Textos de la interfaz en español** y `lang="es"`.
22. **Sin dependencias de runtime** aparte de Next y React.

## 4. Diseño visual (tanda 3)

Dirección: **móvil primero, "noche de estadio"**. Sin cambiar la lógica del juego ni los tests.

- **Colores como variables CSS** en `app/globals.css` (`:root`), expuestas a Tailwind con `@theme`:
  - Fondo: casi negro verdoso con un degradado sutil verde césped y un halo de "reflector" arriba.
  - Acento de marca: **rojo y blanco** (guiño a Perú): título, botón principal, franja.
  - Pistas: **verde** = correcto, **amarillo** = cerca, gris pizarra = no. Texto oscuro sobre verde y
    amarillo para que el contraste sea AA.
  - Los nombres de shadcn (`--background`, `--primary`, etc.) apuntan a estas variables.
- **Tipografía** con `next/font/google`: **Barlow Condensed** (600–800) para el título, las cifras de
  las celdas y los botones; **Inter** para el texto. Se eligió Barlow Condensed sobre Bebas Neue porque
  tiene minúsculas y varios pesos, y se lee mejor en celdas pequeñas.
- **Componentes shadcn/ui** en `components/ui/`: `Button`, `Dialog` (¿Cómo se juega?) y `Command`
  (buscador con `cmdk`). El filtrado sigue siendo el nuestro (sin tildes ni mayúsculas): `Command`
  usa `shouldFilter={false}` y solo se encarga del teclado y la accesibilidad.
- **Íconos** con `lucide-react`.
- **Animaciones** con Motion:
  - La fila nueva entra con un rebote pequeño (spring).
  - Sus 6 celdas se voltean una a una (giro en X, ~0,12 s de desfase entre celdas).
  - Las filas ya reveladas (p. ej. al recargar) se muestran sin animar.
  - El panel final aparece con fundido y escala.
- **Confeti** con `canvas-confetti` al ganar, en rojo, blanco, verde y amarillo.
- **Derrota con humor**: frases cortas al azar ("Te faltó el último pase", etc.).
- **Adorno de la tarjeta final**: franja diagonal rojo-blanco-rojo que cruza la esquina superior
  derecha, como la banda de una camiseta, en SVG propio. Un brillo de reflector la recorre de vez en
  cuando; con movimiento reducido queda quieta.
- **Pantalla final**: grilla de emojis del resultado presentada como "marcador" y botones
  "Compartir" y "Jugar otra vez" de al menos 48 px de alto y a todo el ancho en móvil.
- **"¿Cómo se juega?"**: botón en la cabecera que abre un diálogo con ejemplos de cada pista.
  Se abre solo la primera vez que se visita (se recuerda en `localStorage`, `futbolazo:v2:visto-ayuda`).
- **Movimiento reducido**: con `prefers-reduced-motion` no hay volteo, rebote ni confeti
  (`MotionConfig reducedMotion="user"` y comprobación antes del confeti).
- **Banderas** (`lib/flags.ts` + `components/Flag.tsx`): una por cada país de la lista cerrada del
  importador, dibujadas como formas SVG simples en proporción 3:2, colores planos, esquinas redondeadas
  y un borde oscuro fino para que se distingan sobre las celdas verde, amarilla y gris. Escudos y
  emblemas simplificados a una figura geométrica (círculo, estrella, rectángulo). Los datos de cada
  bandera son una lista de figuras sin React, así un test comprueba que no falte ninguna. Sin bandera
  definida, la celda muestra solo el texto.
- **Botón de pista** (`lib/hints.ts` + `components/HintPanel.tsx`):
  - Lógica pura y testeable: `availableHints` (qué queda por revelar según intentos en verde y pistas
    ya dadas, grupo principal primero), `pickHint` (sorteo con `rand` inyectable, `null` si no
    corresponde), `hintButtonState` (oculto / disponible / sin pistas / terminada) y `describeHint`
    (texto visible y texto para lectores de pantalla).
  - Solo se guarda el **tipo** de cada pista (`"pais" | "club" | "posicion" | "inicial" | "pie" | "edad"`);
    el valor se deriva del jugador secreto, así no hay datos duplicados.
  - Las filas de pista van sobre el tablero, con borde dorado (`--hint-gold`) e ícono 💡, en una lista
    con `aria-live="polite"`. Entran con el mismo rebote que las filas de intento (sin animación con
    movimiento reducido).
  - Las etiquetas de posición y pie pasan a `lib/labels.ts` para compartirlas entre celdas y pistas.
- **Puntaje en la tarjeta final**: bloque "Puntaje" entre el jugador revelado y la grilla de emojis:
  total grande en Barlow Condensed con conteo, desglose en filas (al perder, una casilla por
  categoría con el color de su mejor resultado) y una línea "Mejor · Acumulado" debajo.
- **Escudos genéricos** (`lib/crests.ts` + `components/Crest.tsx`), como las banderas: datos puros
  (sigla, color principal, secundario y diseño `jefe` / `borde` / `punta`) y un componente que los
  dibuja en una caja de 24 × 28 con la misma forma para todos, recortada con `clipPath`, la sigla en
  Barlow Condensed y un borde oscuro fino. El color de la sigla (blanco o casi negro) se elige por
  contraste. Los tests comprueban que no falte ningún club, que no haya colores ni siglas repetidos y
  el contraste de la sigla. En la celda van con el nombre en pequeño debajo (como País).
- **Restricción legal**: **sin escudos oficiales, logos, fotos ni imágenes oficiales** de clubes o
  jugadores. Todo con texto, color y formas propias (la "marca" es tipografía + franja roja y blanca).
  Los escudos de los clubes son **insignias genéricas propias** (forma común, dos colores y sigla), sin
  ningún símbolo ni diseño de los escudos oficiales.

## 5. Plan para lo pendiente

1. **Datos reales de Liga 1**: reemplazar los jugadores ficticios por la plantilla real de la
   temporada vigente, todavía en `data/players.ts`, generado desde el CSV definido en `data-model.md`.
   Con más de 10 jugadores, la exclusión de recientes pasa a ser de 10 completos.
2. **Diseño visual**: hecho en la tanda 3 (ver §4); falta revisión en dispositivos reales.
3. **Supabase**: crear las tablas de `data-model.md`, script de importación del CSV y lectura de
   jugadores desde la app. El sorteo sigue en el cliente y el estado sigue en `localStorage`.
4. **Repo y Vercel**: inicializar Git, subir a GitHub, conectar a Vercel, configurar variables de
   entorno de Supabase (no subir `.env*`, ya está en `.gitignore`).
5. **Vulnerabilidades de npm**: resuelto con Vitest 4 (ver §3, decisión 16). Dependabot avisa de
   las nuevas cada semana.
6. **Modo diario (futuro, fuera de fase 1)**: exponer `lib/daily.ts` como un modo aparte, con su
   propio guardado y número de puzzle, y con `puzzles_diarios` en Supabase.
