# Spec 001 — Fase 1: MVP de Futbolazo

**Estado:** en curso · **Fecha:** 2026-11-26 · **Revisión:** 4 (puntaje y texto de compartir con el jugador; la 3 agregó el botón de pista; la 2 cambió el puzzle diario por partidas ilimitadas al azar)

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

### 2.2 Partida en curso

- La partida en curso (jugador secreto, intentos hechos, pistas pedidas y fecha en que empezó) se
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
  El país lleva su bandera. Los lectores de pantalla anuncian la pista nueva con un texto completo
  (p. ej. "Pista 1: el país es Argentina").
- **Persistencia**: las pistas pedidas se guardan con la partida en curso y sobreviven a recargas.
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
- **Récords**: se guardan en `localStorage` el **mejor puntaje** y el **total acumulado** de todas las
  partidas terminadas, y se muestran en la tarjeta final ("Mejor" y "Acumulado").
  - Una partida suma **una sola vez**, al terminar (con el último intento). Recargar una partida ya
    terminada no vuelve a sumar.
  - Si `localStorage` no está disponible, el puntaje de la partida se muestra igual y los récords
    arrancan en 0.

### 2.8 Resultado para compartir

Texto con este formato:

```
Futbolazo 🇵🇪 <N>/6 · <puntos> pts    (o X/6 si perdió; con " 💡<pistas>" tras el N/6 si usó pistas)

🟩🟨⬜⬜🟩🟩
🟩🟩🟩🟩🟩🟩

<frase con el jugador>

<URL del juego>
```

Ejemplo: `Futbolazo 🇵🇪 4/6 💡1 · 650 pts`.

- **Sin número de puzzle.**
- **Pistas**: solo si se usaron, tras `N/6` va 💡 y el número. Sin pistas no aparece.
- **Puntaje**: ` · <puntos> pts` al final del encabezado, con el total de la partida (en cifras, sin
  separador de miles: el máximo es 1200).
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

### 2.9 Sin login y persistencia

- **No hay cuentas ni login.** Todo ocurre en el navegador.
- En `localStorage` se guardan: la partida en curso (con sus pistas), los últimos 10 jugadores
  sorteados, si ya se vio la ayuda, y el mejor puntaje y el total acumulado.
- Si `localStorage` no está disponible (p. ej. modo privado), se juega igual, sin guardar:
  al recargar empieza una partida nueva y la exclusión de repetidos no se recuerda.
- Datos guardados corruptos o con jugadores que ya no existen se ignoran sin romper el juego
  (si la partida guardada no es válida, empieza una nueva).

## 3. Fuera de la fase 1

- **Modo diario**: un mismo jugador para todos por fecha de Lima, con número de puzzle
  (#1 = 2026-11-26), sin repetir dentro del ciclo ni dos días seguidos. La lógica ya existe y
  tiene tests en `lib/daily.ts`, pero no se usa en la interfaz. Se retomará como modo aparte.
- Login, cuentas, perfiles o sincronizar entre dispositivos.
- Estadísticas e historial más allá del mejor puntaje y el acumulado (rachas, distribución de
  intentos, % de victorias).
- Rankings, ligas entre amigos o cualquier competencia.
- Abandonar o reiniciar una partida a medias.
- Otras ligas, selecciones o jugadores históricos.
- Otros tipos de pistas extra (foto, silueta, estadísticas) o "comprar" pistas.
- Panel de administración web; los datos se cargan por CSV (ver `data-model.md`).
- Notificaciones push, PWA instalable o app nativa.
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

**Calidad y publicación**
- [ ] CA-21: `npm test`, `npm run lint` y `npm run build` pasan sin errores.
- [ ] CA-22: Se juega cómodo en un celular de 360 px de ancho, sin scroll horizontal.
- [ ] CA-23: Los datos son jugadores reales de la Liga 1 de la temporada vigente.
- [ ] CA-24: El juego está publicado en Vercel con una URL pública.
- [ ] CA-25: `npm audit` no reporta vulnerabilidades críticas ni altas sin justificar.

> Las casillas de los criterios se marcan al validarlos para el cierre de la fase.
> El avance de implementación está en `tasks.md`.
