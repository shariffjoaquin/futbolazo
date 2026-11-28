# Spec 001 — Fase 1: MVP de Futbolazo

**Estado:** en curso · **Fecha:** 2026-11-26 · **Revisión:** 12 (escudo del club en la imagen de resultado; la 11 agregó la tarjeta de resultado como imagen; la 10 agregó el ícono propio y el texto del selector de nivel; la 9 agregó seguridad básica para publicar; la 8 agregó escudos genéricos de los clubes; la 7 agregó sonidos y vibración; la 6 agregó el reto a amigos por link; la 5 agregó el nivel de dificultad Fácil / Normal; la 4 agregó el puntaje y el texto de compartir con el jugador; la 3 agregó el botón de pista; la 2 cambió el puzzle diario por partidas ilimitadas al azar)

## 1. Qué es Futbolazo

Futbolazo 🇵🇪 es un juego web al estilo Wordle. En cada partida hay un jugador secreto
de la **Liga 1 peruana** y el usuario tiene **6 intentos** para adivinarlo. Después de cada
intento recibe pistas sobre seis atributos que lo acercan a la respuesta. Al terminar recibe un
**puntaje**, puede compartir su resultado (grilla de emojis, puntaje y el jugador de su partida) y
**jugar otra vez cuantas veces quiera**, cada vez con un jugador distinto elegido al azar.

Objetivo de la fase 1: un juego jugable de punta a punta, sin cuentas ni servidor,
que se pueda publicar y compartir.

## 2. Mecánica exacta

### 2.1 Jugador de la partida

- Las partidas son **ilimitadas**. Cada partida nueva elige **un jugador al azar** de la lista.
- **Sin repetir los últimos 10 jugados**: se guarda en `localStorage` la lista de los últimos
  10 jugadores que salieron como respuesta, y el sorteo los excluye.
  - Un jugador cuenta como "jugado" en el momento en que **empieza** la partida, la termine o no.
  - Si la lista tiene 10 jugadores o menos, no se pueden excluir 10: se excluyen los más recientes
    posibles dejando siempre al menos un candidato (con N jugadores se excluyen los últimos N − 1).
- Cada dispositivo/navegador tiene su propia secuencia: dos personas no ven necesariamente el mismo jugador.
- El sorteo respeta el **nivel** de la partida (ver 2.1.1). La exclusión de los últimos 10 es una
  sola lista para ambos niveles.

### 2.1.1 Nivel de dificultad

- Dos niveles: **Fácil** y **Normal**. Por defecto: **Normal**.
- El nivel **solo limita de qué jugadores se sortea el jugador secreto**. El buscador y los intentos
  usan **todos** los jugadores en ambos niveles.
  - **Fácil**: el jugador secreto sale solo de los clubes grandes: **Universitario, Alianza Lima, Sporting
    Cristal, Cienciano y Melgar** (`club_id` del CSV: `universitario`, `alianza-lima`,
    `sporting-cristal`, `cienciano`, `melgar`; no confundir Alianza Lima con Alianza Atlético).
    La lista está en una sola constante para poder cambiarla.
  - **Normal**: de todos los jugadores elegibles, como hasta ahora.
  - Si la lista de Fácil no deja ningún jugador (p. ej. se cambian los clubes o los datos), el sorteo
    **cae a Normal** sin romper el juego.
- **Selector** Fácil / Normal, con el estilo del juego y usable con teclado (flechas, Tab, Espacio):
  - **Antes de la primera jugada**: visible sobre el buscador mientras la partida no tiene intentos.
    Cambiarlo ahí vuelve a sortear al jugador secreto con el nivel nuevo (la partida aún no empezó de verdad).
  - **Al terminar**: visible en la tarjeta final como "Nivel de la próxima partida"; se aplica al
    pulsar "Jugar otra vez".
  - **A media partida** (desde el primer intento hasta el final) no se puede cambiar: el selector no
    se muestra y en su lugar se ve el nivel de la partida en curso.
- Debajo del selector, una línea explica el nivel elegido:
  - Fácil: "El jugador secreto es de Universitario, Alianza Lima, Sporting Cristal, Cienciano o Melgar."
  - Normal: "El jugador secreto puede ser de cualquier club."
- El nivel elegido se guarda en `localStorage` y se recuerda al volver. La partida guardada incluye
  su propio nivel; una partida guardada sin nivel (de antes de este cambio) se toma como Normal.

### 2.2 Partida en curso

- La partida en curso (jugador secreto, nivel, intentos hechos, pistas pedidas y fecha en que empezó) se
  guarda en `localStorage` después de cada intento y de cada pista.
- **Al recargar la página se sigue en la misma partida**, con los mismos intentos. Si ya había
  terminado, se vuelve a ver el resultado final con sus botones.
- Una partida nueva solo empieza al abrir el juego por primera vez (o sin partida guardada)
  o al pulsar **"Jugar otra vez"**. No hay forma de abandonar una partida a medias en la fase 1.

### 2.3 Intentos

- Máximo **6 intentos**.
- El usuario escribe en un buscador con autocompletado y **solo puede elegir jugadores de la lista**
  (no se acepta texto libre). La búsqueda ignora mayúsculas y tildes.
- No se puede repetir un jugador ya intentado en la misma partida (desaparece de las sugerencias).
- Navegación por teclado: ↑/↓ para moverse, Enter para elegir, Esc para cerrar.
- Si presiona Enter con texto que no coincide, se muestra el aviso "Elige un jugador de la lista".
- La partida termina al **acertar** (el intento es el mismo jugador, por `id`) o al **agotar los 6 intentos**.
  Que coincidan todos los atributos no cuenta como acierto si es otro jugador.

### 2.4 Pistas

Cada intento muestra una fila con seis celdas, comparando el intento contra el jugador secreto:

| Pista | Verde (correcto) | Amarillo (cerca) | Gris (no) | Flecha |
|---|---|---|---|---|
| **Club** | mismo club | — | otro club | — |
| **País** (nacionalidad) | mismo país | — | otro país | — |
| **Posición** | misma posición | posición vecina en el orden POR → DEF → MED → DEL | a dos o más pasos | — |
| **Edad** | misma edad | diferencia ≤ 2 años | diferencia ≥ 3 | ↑ / ↓ |
| **Dorsal** | mismo número | diferencia ≤ 3 | diferencia ≥ 4 | ↑ / ↓ |
| **Pie hábil** | mismo pie (se muestra Diestro, Zurdo o Ambos) | — | otro | — |

- **Flechas**: solo en Edad y Dorsal cuando no son iguales. ↑ significa que el jugador secreto
  tiene **más** (es mayor o lleva un número más alto); ↓ significa que tiene **menos**.
- **Edad**: años cumplidos a la **fecha de Lima en que empezó la partida**. Así una partida
  guardada que se retoma otro día muestra las mismas edades que al empezar.
- **País con bandera**: la celda de País muestra una bandera estilizada (SVG propio, sin emojis ni
  imágenes externas) con el nombre del país en pequeño debajo. Si un país no tiene bandera definida,
  se muestra solo el nombre. El color de fondo de la celda sigue siendo el de la pista.
- **Club con escudo genérico**: la celda de Club muestra un escudo genérico del club (ver 2.12) con
  el nombre en pequeño debajo, igual que la bandera en País. Si un club no tiene escudo definido, se
  muestra solo el nombre.
- Los intentos se muestran del más reciente al más antiguo; los huecos que quedan se ven como filas vacías.
- Una leyenda bajo el tablero explica colores y flechas.

### 2.5 Botón de pista

Ayuda opcional, aparte de las pistas de cada intento (que no cambian).

- **Cuándo aparece**: el botón **"💡 Pista"** aparece después del **2.º intento fallido**
  (2 intentos que no son el jugador secreto). Antes no se muestra.
- **Límite**: máximo **2 pistas por partida**. Pedir una pista **no gasta intentos**.
- **Qué revela**: se sortea al azar una pista entre las que el jugador **aún no descubrió**:
  - **Grupo principal**: país, club y posición del jugador secreto.
  - Un atributo ya no está disponible si el jugador **ya lo acertó** (celda verde) en algún intento,
    o si **ya se dio como pista** antes.
  - Solo si no queda nada del grupo principal, se sortea del **grupo secundario**: inicial del
    apellido, pie hábil o rango de edad de 5 años que contiene la edad real (p. ej. "Entre 30 y 34
    años"; rangos 15–19, 20–24, 25–29…). Con el mismo criterio: el pie y la edad tampoco se dan si ya
    salieron en verde, y ninguna pista se repite.
  - **Inicial del apellido**: la de la última palabra del nombre; si va precedida de una partícula
    (de, del, di, da, la, van…), se toma la partícula ("Matías Di Benedetto" → "D").
- **Estados del botón**:
  - Disponible: "💡 Pista" con las que quedan.
  - Sin pistas: si ya se usaron las 2 (o no queda ninguna por revelar), queda deshabilitado con el
    texto **"Sin pistas"**.
  - Partida terminada: queda deshabilitado.
- **Cómo se muestra**: cada pista es una **fila especial** sobre el tablero, con borde dorado e
  ícono 💡, claramente distinta de una fila de intento: "Pista 1 · País: [bandera] Argentina".
  El país lleva su bandera y el club su escudo genérico. Los lectores de pantalla anuncian la pista nueva con un texto completo
  (p. ej. "Pista 1: el país es Argentina").
- **Tarjeta como imagen**
- [ ] CA-80: "Compartir imagen" genera un PNG de 1080 × 1920 con fondo noche de estadio, FUTBOLAZO ("AZO" en rojo) en la fuente del juego, la franja rojo-blanco-rojo, el puntaje grande, N/6 (o X/6), la grilla de colores sin textos y "futbolazo.app".
- [ ] CA-81: Con pistas usadas se ve una bombilla dibujada y el número; sin pistas no aparece. "FÁCIL" aparece solo en partidas de Fácil.
- [ ] CA-82: Ganando dice "Lo adiviné al primer intento" o "Lo adiviné en N intentos"; perdiendo, "No pude adivinar al jugador". El nombre del jugador aparece fuera de retos y nunca en un reto de amigos.
- [ ] CA-83: Todo el contenido queda dentro de los márgenes seguros (260 px arriba, 380 px abajo, 120 px a los lados); los nombres largos se achican para caber.
- [ ] CA-84: Con `navigator.canShare({ files })` se abre el menú nativo con el PNG; si no, se descarga `futbolazo-resultado.png`. Se anuncia "Imagen lista" o "No se pudo generar la imagen".
- [ ] CA-85: Sin Canvas o si falla la generación, el juego sigue funcionando; la CSP no se amplía y no hay errores en consola.
- [ ] CA-86: Fuera de retos, debajo del nombre se ve el escudo del club (idéntico al de la página: forma, colores, diseño y sigla, de 140 px) con el nombre del club al lado; si el club no tiene escudo, solo el nombre del club.
- [ ] CA-87: En un reto de amigos la imagen no muestra el nombre del jugador, ni el escudo, ni el club.
- [ ] CA-88: Con escudo, nombre largo y 6 filas, todo sigue dentro de los márgenes seguros y ningún bloque pisa a otro.

**Persistencia**: las pistas pedidas se guardan con la partida en curso y sobreviven a recargas.
  Una partida nueva empieza sin pistas.

### 2.6 Fin de partida

- **Gana**: "¡Golazo!" + "Lo adivinaste en N/6", con confeti (salvo con movimiento reducido).
- **Pierde**: tono divertido, no triste: una frase de cancha (p. ej. "¡Uy, al palo!", "Te faltó el
  último pase") + "Se acabaron los intentos… pero la revancha es ya." La frase es fija por partida.
- En ambos casos se revela el jugador: nombre, club, país, posición y dorsal, se muestra el
  **puntaje con su desglose** (ver 2.7) y la grilla de emojis del resultado.
- Aparecen dos botones: **Compartir** y **"Jugar otra vez"**. "Jugar otra vez" empieza al instante
  una partida nueva con otro jugador al azar (según 2.1) y vacía el tablero y las pistas.

### 2.7 Puntaje

Cada partida terminada da un puntaje. Las constantes viven en un solo lugar (`lib/score.ts`) para
poder ajustarlas.

- **Si gana**: base según el intento en que acierta, más un bonus por pistas del botón sin usar.

  | Intento | 1 | 2 | 3 | 4 | 5 | 6 |
  |---|---|---|---|---|---|---|
  | Base | 1000 | 850 | 700 | 550 | 400 | 250 |

  Bonus: **+100 por cada pista sin usar** (0 pistas usadas → +200, 1 → +100, 2 → +0).
  Máximo: **1200** (acierto al primer intento sin pistas). Mínimo al ganar: 250.
- **Si pierde**: puntos parciales por categoría (club, país, posición, edad, dorsal, pie). En cada
  categoría cuenta el **mejor resultado** que tuvo en cualquiera de sus intentos: verde = 40,
  amarillo = 20, gris = 0. Se suman. Máximo **240**, siempre menos que el peor puntaje ganador (250).
  Sin bonus por pistas. Seis intentos todo en gris = 0 puntos.
- Las pistas del botón **no cuentan** como acierto de categoría: solo cuentan las celdas de los intentos.
- **Tarjeta final**: muestra el total con una animación de conteo (sin animación con movimiento
  reducido) y el desglose:
  - Al ganar: "Acierto en el intento N" con su base, "Pistas sin usar" con el bonus y el total.
  - Al perder: los puntos de cada categoría (con su color), "Pistas: +0 (solo al ganar)" y el total.
- **El puntaje no cambia por nivel**: mismas reglas y mismas constantes en Fácil y Normal.
- **Récords**: se guardan en `localStorage` el **mejor puntaje** y el **total acumulado** de todas las
  partidas terminadas, **por separado para cada nivel**, y la tarjeta final muestra los del nivel de
  esa partida ("Mejor" y "Acumulado" en Fácil o en Normal).
  - Una partida suma **una sola vez**, al terminar (con el último intento). Recargar una partida ya
    terminada no vuelve a sumar.
  - Si `localStorage` no está disponible, el puntaje de la partida se muestra igual y los récords
    arrancan en 0.

### 2.8 Resultado para compartir

Texto con este formato:

```
Futbolazo 🇵🇪 <N>/6 · <puntos> pts    (o X/6 si perdió; con " 💡<pistas>" tras el N/6 si usó pistas;
                                       con " · Fácil" al final si la partida fue en Fácil)

🟩🟨⬜⬜🟩🟩
🟩🟩🟩🟩🟩🟩

<frase con el jugador>

<URL del juego>
```

Ejemplos: `Futbolazo 🇵🇪 4/6 💡1 · 650 pts` (Normal) y `Futbolazo 🇵🇪 4/6 💡1 · 650 pts · Fácil`.

- **Sin número de puzzle.**
- **Pistas**: solo si se usaron, tras `N/6` va 💡 y el número. Sin pistas no aparece.
- **Puntaje**: ` · <puntos> pts` al final del encabezado, con el total de la partida (en cifras, sin
  separador de miles: el máximo es 1200).
- **Nivel**: solo cuando la partida fue en Fácil, el encabezado termina con ` · Fácil`. En Normal no
  se menciona el nivel.
- Una fila por intento, en orden cronológico, con un emoji por pista en el orden
  Club, País, Posición, Edad, Dorsal, Pie. 🟩 correcto, 🟨 cerca, ⬜ no. Sin flechas.
- **Frase** debajo de la grilla, con el nombre del jugador secreto de la partida:
  - Gana en 1 intento: "Lo adiviné al primer intento: [Nombre]".
  - Gana en 2 a 6: "Me tomó N intentos adivinar que el jugador era [Nombre]".
  - Pierde: "No pude adivinar que el jugador era [Nombre]".
  - No incluye los nombres de los jugadores intentados.
  - Como cada partida tiene su propio jugador al azar, nombrarlo no arruina la partida de quien lo lee.
- **URL del juego** en la última línea, sola, para que WhatsApp la convierta en enlace.
- Texto plano pensado para WhatsApp: líneas separadas por saltos de línea, sin `*`, `_` ni `~`
  (que WhatsApp toma como formato).
- Se usa el menú nativo de compartir (`navigator.share`) cuando existe; si no existe o falla,
  se copia al portapapeles y se muestra "¡Copiado al portapapeles!". Si el usuario cancela el menú, no pasa nada.

### 2.8.1 Tarjeta de resultado como imagen

- En la tarjeta final, junto a "Compartir" (texto), un botón **"Compartir imagen"**.
- Genera una imagen **PNG de 1080 × 1920** (formato Stories), dibujada en el navegador con Canvas 2D,
  sin dependencias ni imágenes externas, en el estilo "noche de estadio":
  - Fondo oscuro con degradado verde césped, luz de estadio arriba y franjas de césped.
  - **FUTBOLAZO** con "AZO" en rojo, en la fuente de títulos del juego (Barlow Condensed), y la franja
    rojo-blanco-rojo debajo. Antes de dibujar se esperan las fuentes (`document.fonts`).
  - El **puntaje en grande** ("650 PTS") y una línea con **"4/6"** (o "X/6"), la **pista** si se
    usaron (una bombilla dibujada como forma simple y el número, sin emoji, para que se vea igual en
    todos lados) y **"FÁCIL"** si la partida fue en Fácil.
  - La frase y el jugador:
    - Gana en 1 intento: "Lo adiviné al primer intento"; en 2 a 6: "Lo adiviné en N intentos".
    - Pierde: "No pude adivinar al jugador".
    - Debajo, el **nombre del jugador secreto**, salvo en un **reto de amigos**: ahí no se nombra
      (misma regla que el texto) y en su lugar dice "Reto de amigos".
    - Debajo del nombre, el **escudo genérico del club** (el mismo de la página, §2.12: forma,
      colores, diseño y sigla), de unos 140 px de alto y centrado, con el **nombre del club** en texto
      al lado. Si el club no tiene escudo, solo el nombre del club. En un **reto de amigos** no se
      muestra ni el escudo ni el club (serían una pista).
  - La **grilla de cuadraditos** de los intentos (verde, amarillo, gris), sin textos de las pistas. Ocupa
    el espacio que queda entre el jugador y el pie, con cuadraditos de hasta 56 px pensados para 6 filas.
  - Abajo, **"futbolazo.app"**.
- **Márgenes seguros** para que no lo tapen los textos y botones de Instagram Stories y TikTok:
  260 px arriba, 380 px abajo y 120 px a los lados. Todo el contenido queda dentro; fuera solo hay fondo.
- **Compartir**: si el navegador puede compartir archivos (`navigator.canShare({ files })`), se abre el
  menú nativo con el PNG. Si no (o si el navegador no deja abrirlo), se **descarga** como
  `futbolazo-resultado.png`. Si el usuario cancela el menú, no pasa nada.
- **Mensajes de estado** accesibles (`role="status"`): "Imagen lista" al compartir o descargar,
  "No se pudo generar la imagen" si falla. Mientras se genera, el botón dice "Generando…" y no se
  puede pulsar dos veces.
- La imagen se prepara cuando aparece la tarjeta final, para que al pulsar el botón el menú se abra
  enseguida (algunos navegadores no dejan compartir si pasa mucho tiempo desde el toque).
- No hay animación (respeta el movimiento reducido). Si Canvas no está disponible o falla, solo se
  muestra el mensaje de error: el juego sigue igual.

### 2.9 Sin login y persistencia

- **No hay cuentas ni login.** Todo ocurre en el navegador.
- En `localStorage` se guardan: la partida en curso (con sus pistas), los últimos 10 jugadores
  sorteados, si ya se vio la ayuda, el nivel elegido, el mejor puntaje y el total acumulado de
  cada nivel, las partidas de reto (aparte de la partida normal) y si el sonido está activado o silenciado.
- Si `localStorage` no está disponible (p. ej. modo privado), se juega igual, sin guardar:
  al recargar empieza una partida nueva y la exclusión de repetidos no se recuerda.
- Datos guardados corruptos o con jugadores que ya no existen se ignoran sin romper el juego
  (si la partida guardada no es válida, empieza una nueva).

### 2.10 Reto de amigos

Jugar el **mismo jugador secreto que un amigo** y comparar en el chat, sin servidor: todo va en el link.

- **Botón "Retar a mis amigos"**:
  - En la **pantalla de inicio** (partida sin intentos): reta con el secreto de la partida actual.
    Quien reta todavía no lo jugó, así que la invitación no lleva resultado.
  - En la **tarjeta final**: reta con el secreto de la partida que acaba de terminar, con su resultado.
- **Link**: `/?reto=CODIGO`. El código identifica al jugador secreto **y** el nivel:
  - **Ofuscado**: no lleva el nombre ni el id en claro; son 7 letras y números en minúscula
    (p. ej. `/?reto=k3x9q2m`). El mismo jugador y nivel dan siempre el mismo código.
  - **Tolerante**: ignora mayúsculas, espacios y signos que se peguen al copiarlo (p. ej. un punto al
    final). Si el código no es válido o el jugador ya no existe en la lista, se **ignora**: se juega
    una partida normal, se quita `?reto=` de la URL y se muestra un aviso breve: "Ese link de reto no
    es válido. Juegas una partida normal."
- **Invitación** (menú nativo para compartir; si no existe o falla, se copia al portapapeles con el
  aviso "¡Link del reto copiado!"):

  ```
  Te reto a adivinar al jugador misterioso de Futbolazo ⚽ ¿Lo adivinas en menos intentos que yo?
  Yo lo saqué en 4/6 · 650 pts          (solo si quien reta ya terminó esa partida)

  <link del reto>
  ```

  Si quien reta perdió esa partida: "Yo no lo saqué: X/6 · 120 pts". Nunca revela el nombre.
- **Quien abre el link** juega ese jugador en ese nivel:
  - El selector de nivel **no se muestra**; en su lugar se ven un chip **"🏆 Reto de amigos"** y el
    chip del nivel del reto.
  - La partida de reto se guarda **aparte** de la partida normal (una por código). La partida normal
    que tuviera a medias no se toca.
  - Recargar sigue en la misma partida de reto. Si **ya terminó** ese reto, al abrir el link se ve su
    resultado y no puede jugarlo de nuevo.
  - Los puntos del reto **suman** al mejor y al acumulado **de su nivel**, solo la primera vez (al
    terminarlo); como no se puede volver a jugar, no hay segunda vez.
  - El reto no cuenta en la lista de los últimos 10 sorteados.
- **Compartir el resultado de un reto**: igual que el normal (§2.8), más una línea
  **"🏆 Reto de amigos"** bajo el encabezado, y al final el **link del reto** en vez del link del
  juego, para que otros del grupo se sumen y comparen.
  - **No nombra al jugador**: como el mensaje va al mismo chat donde otros van a jugar ese reto, la
    frase cambia a "Lo adiviné al primer intento", "Me tomó N intentos adivinar al jugador misterioso"
    o "No pude adivinar al jugador misterioso".
- **"Jugar otra vez" tras un reto** vuelve al juego normal y quita `?reto=` de la URL: si había una
  partida normal a medias, la retoma; si no, empieza una nueva con el nivel elegido.
- Desde la tarjeta final de un reto también se puede "Retar a mis amigos" con el mismo link.
- Limitación conocida: la edad se calcula a la fecha en que cada uno abre el reto; si el jugador
  cumple años entre medio, la pista de edad puede diferir en un año entre amigos.
- Limitación conocida: quien reta puede abrir su propio link y jugar el reto aparte (ya conoce al
  jugador). Sin cuentas no hay forma fiable de impedirlo; es un juego entre amigos.
- Limitación conocida: el código no es secreto. Oculta el nombre a simple vista, pero alguien con
  conocimientos técnicos podría averiguar el jugador probando códigos.

### 2.11 Sonidos y vibración

Efectos cortos generados en el navegador (Web Audio API), **sin archivos de audio ni dependencias**.

- **Sonidos por evento**:

  | Evento | Sonido |
  |---|---|
  | Voltear cada celda | tick suave, escalonado con la animación de volteo |
  | Celda verde | ding agudo, cuando la celda termina de mostrarse |
  | Celda amarilla | tono medio, cuando la celda termina de mostrarse |
  | Intento fallido | tono bajo corto, al terminar de voltearse la fila |
  | Pedir pista | campanita |
  | Ganar | melodía ascendente de ~1 s, al terminar de voltearse la fila |
  | Perder | dos tonos descendentes, al terminar de voltearse la última fila (en lugar del tono de fallo) |

  - Celdas grises: sin sonido propio (solo el tick del volteo).
  - Sin animación de volteo (movimiento reducido), los sonidos de celda se resumen en **uno solo**
    (el mejor de la fila: verde si hay alguna, si no amarillo si hay alguna) seguido del de fallo,
    ganar o perder, para no sonar todos a la vez.
  - El sonido del puntaje contando queda **fuera** por ahora: coincide con la melodía de ganar y la
    ensucia. Se puede agregar después.
- **Vibración** (`navigator.vibrate`), una por intento, al terminar de voltearse la fila:
  - Intento fallido sin ninguna categoría en verde: patrón **corto**.
  - Intento fallido con al menos una categoría en verde: patrón **doble**.
  - Ganar: patrón **largo**.
  - Donde no existe (p. ej. iPhone) no hace nada y no da error.
- **Botón en la cabecera** (a la izquierda del título) para silenciar o activar sonido **y**
  vibración: ícono de altavoz (activado) o altavoz tachado (silenciado), con `aria-label`
  "Silenciar sonido y vibración" / "Activar sonido y vibración". Al activarlo suena un ding corto de
  confirmación. Se recuerda en `localStorage`.
- **Por defecto**: sonido activado a **volumen bajo**.
- **Movimiento reducido** (`prefers-reduced-motion`): con el ajuste por defecto, **sin vibración** y
  **sin sonidos de animación** (tick de volteo); los demás sonidos sí suenan. Si el usuario
  **activa el sonido explícitamente** con el botón (silenciar y volver a activar), suena y vibra todo.
- **Política de autoplay**: el audio se crea o reanuda solo dentro de un gesto del usuario (elegir un
  jugador, pedir pista, tocar el botón de sonido). **Nunca suena al cargar la página**, ni al recargar
  una partida ya jugada, ni al abrir un reto ya terminado.
- Silenciado: ningún sonido ni vibración.

### 2.12 Escudos genéricos de los clubes

Insignias **propias y genéricas**, no los escudos oficiales.

- Cada club tiene la **misma forma de escudo** (arriba recto con esquinas suaves, abajo en punta),
  sus **dos colores principales** y una **sigla de 1 a 3 letras o números**. El color secundario va
  en uno de tres diseños genéricos: franja arriba, borde interior o punta inferior.
- **No calcan ni imitan los escudos oficiales**: nada de animales, balones, estrellas, letras
  estilizadas ni otros símbolos propios de cada club.
- Mismo estilo que las banderas: formas simples, colores planos y un borde oscuro fino que lo separa
  de las celdas verde, amarilla y gris.
- **Decorativo**: el nombre del club siempre va en texto y el escudo no se lee en voz alta
  (`aria-hidden`).
- **Dónde**: en la celda de Club de cada intento, en la fila de pista de club y en el ejemplo de
  "¿Cómo se juega?". **No en el buscador**: mostraría el club de cada candidato antes de elegirlo
  (cambia la dificultad) y, como el nombre del club debe ir siempre en texto, habría que agregarlo
  también a cada sugerencia.
- Sin animación propia: se voltea con su celda (sin volteo con movimiento reducido).
- Colores y siglas propuestos (a revisar por el dueño del producto; los de confianza baja son una
  suposición razonable, no un dato verificado):

  | Club | Sigla | Color principal | Color secundario | Diseño | Confianza |
  |---|---|---|---|---|---|
  | ADT | ADT | celeste `#4fb3e8` | azul marino `#14245a` | borde | baja |
  | Alianza Atlético | AA | blanco `#f5f5f0` | azul `#1f5fbf` | franja arriba | media |
  | Alianza Lima | AL | azul marino `#14245a` | blanco `#f5f5f0` | borde | alta |
  | Atlético Grau | AG | blanco `#f5f5f0` | negro `#16181a` | punta | baja |
  | Cienciano | CIE | rojo `#c8102e` | blanco `#f5f5f0` | franja arriba | alta |
  | Comerciantes Unidos | CU | verde `#187a42` | blanco `#f5f5f0` | borde | baja |
  | Cusco FC | CFC | dorado `#d4a017` | negro `#16181a` | franja arriba | baja |
  | Deportivo Garcilaso | DG | blanco `#f5f5f0` | celeste `#4fb3e8` | borde | media |
  | Deportivo Moquegua | DM | naranja `#e8711a` | blanco `#f5f5f0` | punta | baja |
  | FC Cajamarca | FCC | morado `#5b2a86` | blanco `#f5f5f0` | franja arriba | baja |
  | Juan Pablo II College | JP2 | amarillo `#f2c230` | azul marino `#14245a` | punta | baja |
  | Los Chankas | CH | negro `#16181a` | verde `#2fa35a` | franja arriba | baja |
  | Melgar | FBC | rojo `#c8102e` | negro `#16181a` | punta | alta |
  | Sport Boys | SB | rosado `#f49ac1` | negro `#16181a` | borde | alta |
  | Sport Huancayo | SH | blanco `#f5f5f0` | rojo `#c8102e` | franja arriba | media |
  | Sporting Cristal | SC | celeste `#4fb3e8` | blanco `#f5f5f0` | franja arriba | alta |
  | UTC | UTC | azul `#1f5fbf` | blanco `#f5f5f0` | punta | baja |
  | Universitario | U | crema `#f1e2c4` | granate `#8b1e2d` | borde | alta |

  - Cuando dos clubes comparten colores reales (Cienciano y Sport Huancayo, rojo y blanco), se
    invierte el orden o cambia el diseño para que no se confundan.

### 2.13 Seguridad básica para publicar

Futbolazo no tiene backend, cuentas ni datos personales, pero se publica en internet. Antes de
hacerlo se cubre lo básico:

- **Sin anuncios, analítica de terceros ni cookies.** La página solo carga recursos del propio sitio.
- **Cabeceras de seguridad** en todas las respuestas: Content-Security-Policy estricta (solo el
  propio sitio, sin `'unsafe-eval'` en producción, sin incrustarse en otros sitios), `nosniff`,
  Referrer-Policy `strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, Permissions-Policy que
  cierra cámara, micrófono y geolocalización, y Strict-Transport-Security. No se anuncia la
  tecnología del servidor (`X-Powered-By`).
- **Entradas tratadas como texto.** El parámetro `?reto=`, todo lo que se lee de `localStorage`, el
  buscador y el texto de compartir nunca se interpretan como HTML ni como código: no se usa
  `dangerouslySetInnerHTML`, `eval` ni HTML construido con texto del usuario.
- **Datos manipulados no rompen la página.** JSON inválido, tipos incorrectos, fechas imposibles,
  cadenas enormes o etiquetas `<script>` en el parámetro o en `localStorage` se ignoran: se juega
  una partida normal (o se avisa que el reto no es válido).
- **El buscador acepta como máximo 40 caracteres** (el nombre más largo de la lista cabe de sobra).
- **Sin secretos en el repo**: ni claves ni `.env` versionados; `.gitignore` los cubre.
- **Dependencias al día**: `npm audit` sin vulnerabilidades y Dependabot revisa npm cada semana.

### 2.14 Ícono del juego

- **Ícono propio**, dibujado por nosotros en SVG, sin imágenes ni logos de nadie: un **balón blanco**
  de formas gruesas (pentágono central, costuras y parches del borde) sobre fondo oscuro "noche de
  estadio", cruzado por la **banda roja diagonal** de la camiseta peruana.
- Se lee bien a **16 px y 32 px** (pestaña del navegador): pocas formas, gruesas y con contraste.
- Archivos, todos del mismo diseño:
  - `app/icon.svg`: favicon principal.
  - `app/favicon.ico` (16, 32 y 48 px): reemplaza al de Next.js para los navegadores y servicios
    que piden `/favicon.ico`.
  - `app/apple-icon.png` (180 × 180, sin esquinas redondeadas: iOS pone las suyas).
  - Íconos de **192 × 192** y **512 × 512** y uno **maskable** de 512 (con margen para la zona segura)
    para instalar en Android.
- **Manifiesto** (`/manifest.webmanifest`): nombre "Futbolazo", colores del tema (fondo `#050d09`) y
  `display: standalone`. No convierte el juego en una PWA con modo sin conexión (eso sigue fuera de la fase 1).
- `theme-color` de la página: el color del fondo, `#050d09`.

### 2.15 Jugadores en Supabase (preparación)

Primer paso hacia Supabase: dejar la tabla y los datos listos **sin conectar el juego**. El juego
sigue leyendo `data/players.ts` y no se pide ni se guarda ninguna clave (ni URL del proyecto, ni
`anon key`, ni `service_role`).

- **Dos archivos SQL en `supabase/`** que el dueño del producto pega a mano en el SQL Editor de Supabase:
  - `schema.sql` (escrito a mano): crea la tabla `public.players`, sus restricciones y la seguridad.
    Se puede volver a correr sin error.
  - `seed.sql` (generado, no editar a mano): carga **todas** las filas del CSV, elegibles y no
    elegibles. Se genera con `npm run db:seed-sql [ruta.csv]` (por defecto `data/raw/liga1-2026.csv`).
- **Tabla `players`**: una fila por jugador con las mismas columnas que el CSV: `temporada`,
  `jugador_id` (único), `nombre`, `club_id`, `club_nombre`, `nacionalidad`, `posicion`,
  `fecha_nacimiento`, `dorsal`, `pie`, `elegible`, y las de fuente y verificación (`fuente`,
  `verificado_en`, `verif_fecha`, `verif_dorsal`, `verif_pie`, `notas_revision`).
- **La base rechaza valores inválidos**, con las mismas reglas que el importador: país de la lista
  cerrada, posición `POR`/`DEF`/`MED`/`DEL`, pie `D`/`I`/`Ambos`, dorsal entero de 1 a 99, fechas
  reales, textos obligatorios no vacíos y sin dos jugadores con el mismo dorsal en el mismo club y temporada.
- **Seguridad (RLS activada)** con una sola política: el rol público (`anon`) solo puede **leer** las
  filas con `elegible = true`. `anon` no puede insertar, modificar ni borrar.
- **`seed.sql` se puede volver a correr**: en una transacción borra las filas de la temporada del CSV
  y las vuelve a insertar; si algo falla no queda nada a medias.
- **El generador valida igual que el importador** (todo o nada, mismos mensajes `Fila N (Nombre): …`)
  y además que `verificado_en`, si viene, sea una fecha real. Con errores no escribe `seed.sql`.
- **Textos bien escapados**: apóstrofes (`Jhamir D'Arrigo`), comillas, tildes y eñes llegan a la
  base tal cual.

## 3. Fuera de la fase 1

- **Modo diario**: un mismo jugador para todos por fecha de Lima, con número de puzzle
  (#1 = 2026-11-26), sin repetir dentro del ciclo ni dos días seguidos. La lógica ya existe y
  tiene tests en `lib/daily.ts`, pero no se usa en la interfaz. Se retomará como modo aparte.
- Login, cuentas, perfiles o sincronizar entre dispositivos.
- Estadísticas e historial más allá del mejor puntaje y el acumulado (rachas, distribución de
  intentos, % de victorias).
- Rankings, ligas o tablas de puntajes con servidor (el reto de amigos es solo por link y se compara en el chat).
- Abandonar o reiniciar una partida a medias.
- Otras ligas, selecciones o jugadores históricos.
- Otros tipos de pistas extra (foto, silueta, estadísticas) o "comprar" pistas.
- Panel de administración web; los datos se cargan por CSV (ver `data-model.md`).
- Notificaciones push, PWA con modo sin conexión o app nativa (sí hay manifiesto e íconos, ver §2.14).
- Monetización (anuncios, suscripciones).
- Otros idiomas aparte del español.
- Analítica de uso más allá de lo que dé Vercel por defecto.

## 4. Criterios de aceptación

**Jugador de la partida**
- [ ] CA-01: Cada partida nueva tiene un jugador elegido al azar de la lista.
- [ ] CA-02: Con 11 jugadores o más, el jugador de una partida nueva nunca está entre los últimos 10 sorteados.
- [ ] CA-03: Con N ≤ 10 jugadores, el jugador nuevo nunca está entre los últimos N − 1 sorteados.
- [ ] CA-04: La lista de últimos sorteados guarda como máximo 10 ids, sin duplicados, y sobrevive a recargar la página.

**Partida en curso**
- [ ] CA-05: Al recargar a mitad de partida, se ve el mismo jugador secreto y los mismos intentos.
- [ ] CA-06: Al recargar una partida terminada, se ve el resultado final con "Compartir" y "Jugar otra vez".
- [ ] CA-07: "Jugar otra vez" empieza una partida con 0 intentos y un jugador distinto al anterior.
- [ ] CA-08: Recargar no empieza una partida nueva ni consume un jugador de la lista de recientes.

**Botón de pista**
- [ ] CA-26: El botón "💡 Pista" no aparece con 0 o 1 intentos fallidos y aparece desde el 2.º intento fallido.
- [ ] CA-27: Pedir una pista no cambia el número de intentos.
- [ ] CA-28: Nunca se da como pista un atributo que ya salió en verde en algún intento, ni se repite una pista.
- [ ] CA-29: Mientras quede país, club o posición por descubrir, la pista sale de ese grupo; si no, de inicial, pie o rango de edad.
- [ ] CA-30: Tras 2 pistas el botón queda deshabilitado con "Sin pistas"; al terminar la partida queda deshabilitado.
- [ ] CA-31: La pista se ve como una fila distinta (borde dorado, 💡), el país con bandera, y se anuncia a lectores de pantalla.
- [ ] CA-32: Al recargar se ven las mismas pistas; "Jugar otra vez" empieza sin pistas.
- [ ] CA-33: Compartir agrega " 💡N" al título solo si se usaron pistas.

**Puntaje**
- [ ] CA-34: Al ganar, el puntaje es la base del intento (1000, 850, 700, 550, 400, 250) más 100 por cada pista sin usar; máximo 1200.
- [ ] CA-35: Al perder, el puntaje suma por categoría el mejor resultado de los intentos (verde 40, amarillo 20, gris 0); máximo 240; todo gris da 0; las pistas del botón no suman.
- [ ] CA-36: Cualquier derrota (máx. 240) puntúa menos que cualquier victoria (mín. 250).
- [ ] CA-37: La tarjeta final muestra el desglose y el total con conteo animado; con movimiento reducido el total aparece sin animar.
- [ ] CA-38: El mejor puntaje y el total acumulado se guardan, se muestran en la tarjeta final y no cambian al recargar una partida ya terminada.

**Nivel de dificultad**
- [ ] CA-39: En Fácil, el jugador secreto siempre es de Universitario, Alianza Lima, Sporting Cristal, Cienciano o Melgar; en Normal puede salir cualquier jugador.
- [ ] CA-40: En ambos niveles el buscador ofrece todos los jugadores y cualquiera se puede intentar.
- [ ] CA-41: Si la lista de clubes de Fácil no deja jugadores, el sorteo usa todos (como Normal).
- [ ] CA-42: El nivel por defecto es Normal; el elegido se recuerda al recargar y la partida guardada conserva su nivel.
- [ ] CA-43: El selector se ve antes del primer intento y en la tarjeta final, se usa con teclado, y no se puede cambiar el nivel de una partida con intentos (el cambio en la tarjeta final se aplica a la siguiente).
- [ ] CA-44: El texto de compartir termina con " · Fácil" solo en partidas de Fácil.
- [ ] CA-45: El puntaje es igual en ambos niveles, y el mejor puntaje y el acumulado se guardan y muestran por separado para cada nivel.

**Reto de amigos**
- [ ] CA-46: "Retar a mis amigos" está en la pantalla de inicio y en la tarjeta final, y genera `/?reto=CODIGO` con un código de 7 caracteres que no contiene el nombre ni el id del jugador.
- [ ] CA-47: El mismo jugador y nivel dan el mismo código; cada combinación jugador + nivel de la lista da un código distinto.
- [ ] CA-48: Un código con mayúsculas, espacios o signos pegados se acepta; uno inválido o de un jugador que ya no existe se ignora con aviso y se juega normal sin `?reto=` en la URL.
- [ ] CA-49: La invitación usa el menú nativo o copia al portapapeles, tiene el texto acordado y el link, y solo incluye "Yo lo saqué en N/6 · P pts" (o "Yo no lo saqué: X/6 · P pts") si quien reta terminó esa partida; nunca el nombre.
- [ ] CA-50: Quien abre el link juega ese jugador en ese nivel, sin selector de nivel y con el chip "🏆 Reto de amigos".
- [ ] CA-51: La partida de reto se guarda aparte: no cambia la partida normal y al recargar sigue el reto.
- [ ] CA-52: Un reto ya terminado muestra su resultado y no se puede volver a jugar.
- [ ] CA-53: Los puntos de un reto suman al mejor y acumulado de su nivel una sola vez.
- [ ] CA-54: Compartir un reto agrega "🏆 Reto de amigos", termina con el link del reto y no nombra al jugador.
- [ ] CA-55: "Jugar otra vez" tras un reto vuelve al juego normal y quita `?reto=` de la URL.

**Sonidos y vibración**
- [ ] CA-56: Cada evento (volteo, verde, amarillo, fallo, pista, ganar, perder) tiene su sonido, generado con Web Audio API, sin archivos de audio ni dependencias nuevas.
- [ ] CA-57: Los sonidos de celda van escalonados con el volteo; sin volteo se resumen en uno solo.
- [ ] CA-58: Vibra corto al fallar, doble al fallar con alguna categoría en verde y largo al ganar; sin `navigator.vibrate` no pasa nada ni hay errores.
- [ ] CA-59: El botón de la cabecera silencia y activa sonido y vibración, tiene `aria-label` y se usa con teclado.
- [ ] CA-60: El ajuste se recuerda al recargar; por defecto el sonido está activado a volumen bajo.
- [ ] CA-61: Con movimiento reducido y el ajuste por defecto no hay vibración ni tick de volteo; si el usuario activa el sonido explícitamente, sí.
- [ ] CA-62: El audio solo se crea o reanuda tras un gesto del usuario; al cargar la página no suena nada ni hay errores en consola.

**Escudos genéricos**
- [ ] CA-63: Cada club de los datos tiene un escudo genérico con dos colores y una sigla de 1 a 3 caracteres, sin símbolos de los escudos oficiales.
- [ ] CA-64: No hay dos clubes con los mismos colores, ni siglas repetidas; la sigla contrasta con su campo (≥ 4,5:1).
- [ ] CA-65: La celda de Club y la fila de pista de club muestran el escudo y el nombre en texto; un club sin escudo muestra solo el texto.
- [ ] CA-66: El escudo es decorativo (`aria-hidden`); los lectores de pantalla leen solo el nombre del club.
- [ ] CA-67: Se ve bien a 360 px sobre celdas verde, amarilla y gris, sin cortar el nombre ni causar scroll horizontal.

**Intentos y pistas**
- [ ] CA-09: Solo se pueden elegir jugadores de la lista; la búsqueda funciona sin tildes ni mayúsculas ("rondon" encuentra a "Yeferson Rondón").
- [ ] CA-10: Un jugador ya intentado no vuelve a aparecer en las sugerencias de esa partida.
- [ ] CA-11: Club, País y Pie solo pueden salir verde o gris.
- [ ] CA-12: Posición sale amarilla solo si está a un paso en POR → DEF → MED → DEL.
- [ ] CA-13: Edad sale amarilla con diferencia ≤ 2 y Dorsal con diferencia ≤ 3; fuera de eso, gris. Ambas muestran la flecha hacia el valor del jugador secreto.
- [ ] CA-14: La edad se cuenta en años cumplidos a la fecha de Lima en que empezó la partida.
- [ ] CA-15: Tras 6 intentos fallidos o al acertar, el buscador desaparece y se revela el jugador.

**Compartir**
- [ ] CA-16: El texto empieza con `Futbolazo 🇵🇪 <intentos>/6` (o `X/6`), sin número de puzzle, sigue con ` · <puntos> pts`, tiene una fila de 6 emojis por intento y termina con la URL.
- [ ] CA-17: El texto solo nombra al jugador secreto, en la frase final ("Lo adiviné al primer intento: …", "Me tomó N intentos adivinar que el jugador era …" o "No pude adivinar que el jugador era …"), y nunca a los jugadores intentados.
- [ ] CA-18: En un navegador sin `navigator.share` el texto se copia al portapapeles con aviso.

**Persistencia**
- [ ] CA-19: Con `localStorage` bloqueado o con datos corruptos, el juego carga y se puede jugar.
- [ ] CA-20: Una partida guardada con un jugador que ya no existe se descarta y empieza una nueva.

**Seguridad**
- [ ] CA-68: Todas las respuestas llevan Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy y Strict-Transport-Security, y no llevan `X-Powered-By`.
- [ ] CA-69: Con la CSP activa el juego funciona completo (buscar, intentar, pista, sonidos, banderas, escudos, compartir, reto) y la consola no muestra violaciones de CSP.
- [ ] CA-70: La CSP no permite `'unsafe-eval'` en producción, ni scripts, estilos, fuentes o conexiones de otros dominios, ni incrustar la página en otro sitio.
- [ ] CA-71: `?reto=` con etiquetas `<script>`, cadenas enormes o caracteres raros abre una partida normal con el aviso de reto no válido, sin ejecutar nada.
- [ ] CA-72: Valores manipulados en `localStorage` (JSON inválido, tipos incorrectos, fechas imposibles, cadenas enormes) no rompen la página: se ignoran y se juega normal.
- [ ] CA-73: No hay claves ni `.env` en el repo ni en su historial; no hay rutas API ni server actions.
- [ ] CA-74: `npm audit` reporta 0 vulnerabilidades y `.github/dependabot.yml` revisa npm cada semana.

**Ícono y textos**
- [ ] CA-75: La pestaña muestra el ícono propio (balón y banda roja) y se reconoce a 16 px y 32 px; no aparece el favicon por defecto de Next.js.
- [ ] CA-76: `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png` (180 px) y los íconos de 192 y 512 px salen del mismo diseño, sin imágenes externas ni logos de nadie.
- [ ] CA-77: El manifiesto tiene nombre "Futbolazo", `display: standalone`, `theme_color` y `background_color` del fondo, y los íconos de 192 y 512 px (uno maskable).
- [ ] CA-78: La página tiene `theme-color` con el color del fondo; el ícono y el manifiesto cargan sin errores de CSP.
- [ ] CA-79: El selector de nivel dice "El jugador secreto es de Universitario, Alianza Lima, Sporting Cristal, Cienciano o Melgar." (Fácil) y "El jugador secreto puede ser de cualquier club." (Normal); la leyenda dice "el jugador secreto tiene más / menos".

**Jugadores en Supabase (preparación)**
- [ ] CA-80: `supabase/schema.sql` crea `public.players` con las columnas del CSV, `jugador_id` único, y se puede correr dos veces sin error.
- [ ] CA-81: La tabla rechaza país fuera de la lista, posición o pie inválidos, dorsal fuera de 1–99, fechas imposibles, textos obligatorios vacíos y dorsal repetido en el mismo club y temporada.
- [ ] CA-82: RLS está activada con una sola política: `anon` lee solo filas con `elegible = true` y no puede insertar, modificar ni borrar.
- [ ] CA-83: `npm run db:seed-sql` genera `supabase/seed.sql` con una fila por cada fila del CSV (elegibles y no elegibles); con errores en el CSV no escribe nada.
- [ ] CA-84: Nombres con apóstrofes, comillas, tildes o eñes se cargan sin romper el SQL y quedan iguales en la base.
- [ ] CA-85: `seed.sql` se puede correr de nuevo y deja la misma cantidad de filas, sin duplicar.
- [ ] CA-86: El juego no se conecta a Supabase y el repo no tiene claves de Supabase.

**Calidad y publicación**
- [ ] CA-21: `npm test`, `npm run lint` y `npm run build` pasan sin errores.
- [ ] CA-22: Se juega cómodo en un celular de 360 px de ancho, sin scroll horizontal.
- [ ] CA-23: Los datos son jugadores reales de la Liga 1 de la temporada vigente.
- [ ] CA-24: El juego está publicado en Vercel con una URL pública.
- [ ] CA-25: `npm audit` no reporta vulnerabilidades críticas ni altas sin justificar.

> Las casillas de los criterios se marcan al validarlos para el cierre de la fase.
> El avance de implementación está en `tasks.md`.
