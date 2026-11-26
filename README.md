# Futbolazo 🇵🇪

Juego estilo Wordle: adivina un jugador de la Liga 1 en 6 intentos. Partidas ilimitadas, cada una con un jugador al azar.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests de Vitest
npm run build
npm run import:players   # CSV → data/players.ts (por defecto data/raw/liga1-2026.csv)
```

- `data/raw/liga1-2026.csv` — jugadores reales de la Liga 1 (fuente)
- `data/players.ts` — generado por el importador; no editar a mano
- `lib/importPlayers.ts` + `scripts/import-players.ts` — importador con validación todo o nada
- `lib/random.ts` — sorteo al azar sin repetir los últimos 10
- `lib/game.ts` — empezar partida nueva o retomar la guardada
- `lib/compare.ts` — comparación intento vs objetivo
- `lib/share.ts` — texto para compartir
- `lib/storage.ts` — partida en curso y recientes en localStorage
- `lib/daily.ts` — fecha de Lima; modo diario (futuro, sin uso en la UI)
- `specs/001-fase1-mvp/` — especificación de la fase 1
- `components/Game.tsx` — UI del juego
