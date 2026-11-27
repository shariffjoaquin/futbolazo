# Futbolazo 🇵🇪

Juego estilo Wordle: adivina un jugador de la Liga 1 en 6 intentos. Partidas ilimitadas, cada una con un jugador al azar.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests de Vitest
npm run build
npm run import:players   # CSV → data/players.ts (por defecto data/raw/liga1-2026.csv)
npm run icons            # regenera los íconos desde lib/brandIcon.ts
```

- `data/raw/liga1-2026.csv` — jugadores reales de la Liga 1 (fuente)
- `data/players.ts` — generado por el importador; no editar a mano
- `lib/importPlayers.ts` + `scripts/import-players.ts` — importador con validación todo o nada
- `lib/random.ts` — sorteo al azar sin repetir los últimos 10
- `lib/game.ts` — empezar partida nueva o retomar la guardada
- `lib/compare.ts` — comparación intento vs objetivo
- `lib/share.ts` — texto para compartir (puntaje y frase con el jugador)
- `lib/score.ts` — puntaje de la partida (constantes ajustables) y récords
- `lib/difficulty.ts` — niveles Fácil / Normal y clubes de Fácil (`EASY_CLUBS`)
- `lib/challenge.ts` — reto de amigos: código del link `/?reto=` e invitación
- `lib/crests.ts` — escudos genéricos de los clubes (colores y sigla); los dibuja `components/Crest.tsx`
- `lib/sounds.ts` — qué sonido y vibración corresponde a cada evento (lógica pura)
- `lib/audio.ts` — motor Web Audio y vibración; ajuste de sonido
- `components/DifficultyPicker.tsx` — selector de nivel
- `lib/brandIcon.ts` + `scripts/generate-icons.tsx` — ícono propio (SVG); `npm run icons` regenera favicon, apple-icon e íconos del manifiesto
- `lib/search.ts` — búsqueda de jugadores sin tildes, con largo máximo
- `lib/securityHeaders.ts` — CSP y cabeceras de seguridad que aplica `next.config.ts`
- `lib/storage.ts` — partida en curso y recientes en localStorage
- `lib/daily.ts` — fecha de Lima; modo diario (futuro, sin uso en la UI)
- `specs/001-fase1-mvp/` — especificación de la fase 1
- `components/Game.tsx` — UI del juego
