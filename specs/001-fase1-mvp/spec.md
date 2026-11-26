# Spec 001 — Fase 1: MVP de Futbolazo

**Estado:** en curso · **Fecha:** 2026-11-26 · **Revisión:** 2 (partidas ilimitadas al azar en lugar de puzzle diario)

## 1. Qué es Futbolazo

Futbolazo 🇵🇪 es un juego web al estilo Wordle. En cada partida hay un jugador secreto
de la **Liga 1 peruana** y el usuario tiene **6 intentos** para adivinarlo. Después de cada
intento recibe pistas sobre seis atributos que lo acercan a la respuesta. Al terminar puede
compartir su resultado como una grilla de emojis que no revela al jugador, y **jugar otra vez
cuantas veces quiera**, cada vez con un jugador distinto elegido al azar.

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

- La partida en curso (jugador secreto, intentos hechos y fecha en que empezó) se guarda en
  `localStorage` después de cada intento.
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
- Los intentos se muestran del más reciente al más antiguo; los huecos que quedan se ven como filas vacías.
- Una leyenda bajo el tablero explica colores y flechas.

### 2.5 Fin de partida

- **Gana**: "¡Golazo!" + "Lo adivinaste en N/6", con confeti (salvo con movimiento reducido).
- **Pierde**: tono divertido, no triste: una frase de cancha (p. ej. "¡Uy, al palo!", "Te faltó el
  último pase") + "Se acabaron los intentos… pero la revancha es ya." La frase es fija por partida.
- En ambos casos se revela el jugador: nombre, club, país, posición y dorsal, y se muestra la
  grilla de emojis del resultado.
- Aparecen dos botones: **Compartir** y **"Jugar otra vez"**. "Jugar otra vez" empieza al instante
  una partida nueva con otro jugador al azar (según 2.1) y vacía el tablero.

### 2.6 Resultado para compartir

Texto con este formato:

```
Futbolazo 🇵🇪 <N>/6      (o X/6 si perdió)

🟩🟨⬜⬜🟩🟩
🟩🟩🟩🟩🟩🟩

<URL del juego>
```

- **Sin número de puzzle.**
- Una fila por intento, en orden cronológico, con un emoji por pista en el orden
  Club, País, Posición, Edad, Dorsal, Pie. 🟩 correcto, 🟨 cerca, ⬜ no.
- No incluye nombres ni flechas: no revela al jugador.
- Se usa el menú nativo de compartir (`navigator.share`) cuando existe; si no existe o falla,
  se copia al portapapeles y se muestra "¡Copiado al portapapeles!". Si el usuario cancela el menú, no pasa nada.

### 2.7 Sin login y persistencia

- **No hay cuentas ni login.** Todo ocurre en el navegador.
- En `localStorage` se guardan dos cosas: la partida en curso y los últimos 10 jugadores sorteados.
- Si `localStorage` no está disponible (p. ej. modo privado), se juega igual, sin guardar:
  al recargar empieza una partida nueva y la exclusión de repetidos no se recuerda.
- Datos guardados corruptos o con jugadores que ya no existen se ignoran sin romper el juego
  (si la partida guardada no es válida, empieza una nueva).

## 3. Fuera de la fase 1

- **Modo diario**: un mismo jugador para todos por fecha de Lima, con número de puzzle
  (#1 = 2026-11-26), sin repetir dentro del ciclo ni dos días seguidos. La lógica ya existe y
  tiene tests en `lib/daily.ts`, pero no se usa en la interfaz. Se retomará como modo aparte.
- Login, cuentas, perfiles o sincronizar entre dispositivos.
- Estadísticas e historial (rachas, distribución de intentos, % de victorias).
- Rankings, ligas entre amigos o cualquier competencia.
- Abandonar o reiniciar una partida a medias.
- Otras ligas, selecciones o jugadores históricos.
- Pistas extra (foto, silueta, estadísticas, "comprar" pistas).
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

**Intentos y pistas**
- [ ] CA-09: Solo se pueden elegir jugadores de la lista; la búsqueda funciona sin tildes ni mayúsculas ("rondon" encuentra a "Yeferson Rondón").
- [ ] CA-10: Un jugador ya intentado no vuelve a aparecer en las sugerencias de esa partida.
- [ ] CA-11: Club, País y Pie solo pueden salir verde o gris.
- [ ] CA-12: Posición sale amarilla solo si está a un paso en POR → DEF → MED → DEL.
- [ ] CA-13: Edad sale amarilla con diferencia ≤ 2 y Dorsal con diferencia ≤ 3; fuera de eso, gris. Ambas muestran la flecha hacia el valor del jugador secreto.
- [ ] CA-14: La edad se cuenta en años cumplidos a la fecha de Lima en que empezó la partida.
- [ ] CA-15: Tras 6 intentos fallidos o al acertar, el buscador desaparece y se revela el jugador.

**Compartir**
- [ ] CA-16: El texto empieza con `Futbolazo 🇵🇪 <intentos>/6` (o `X/6`), sin número de puzzle, tiene una fila de 6 emojis por intento y termina con la URL.
- [ ] CA-17: El texto no contiene el nombre de ningún jugador.
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
