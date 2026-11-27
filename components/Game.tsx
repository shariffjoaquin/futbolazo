"use client";

import confetti from "canvas-confetti";
import { Search } from "lucide-react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuessRow } from "@/components/GuessRow";
import { HintPanel } from "@/components/HintPanel";
import { COLUMNS, GRID_COLS, REVEAL_SECONDS } from "@/components/HintCell";
import { ResultPanel } from "@/components/ResultPanel";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getPlayerById, players, type Player } from "@/data/players";
import { compare } from "@/lib/compare";
import { resumeOrStartGame, startNewGame } from "@/lib/game";
import { availableHints, describeHint, hintButtonState, pickHint, type HintType } from "@/lib/hints";
import { computeScore } from "@/lib/score";
import { buildShareText, MAX_GUESSES } from "@/lib/share";
import { loadStats, recordScore, saveGame, type SavedGame } from "@/lib/storage";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const CONFETTI_COLORS = ["#d91023", "#ffffff", "#2fbf5b", "#f5c518"];

function fireConfetti() {
  const base = { colors: CONFETTI_COLORS, disableForReducedMotion: true, ticks: 220, zIndex: 60 };
  confetti({ ...base, particleCount: 90, spread: 70, startVelocity: 48, origin: { x: 0.15, y: 0.75 }, angle: 60 });
  confetti({ ...base, particleCount: 90, spread: 70, startVelocity: 48, origin: { x: 0.85, y: 0.75 }, angle: 120 });
}

export default function Game() {
  // Retoma la partida guardada o empieza una nueva; es idempotente, así el doble render de modo estricto no gasta jugadores.
  const [game, setGame] = useState<SavedGame>(() => resumeOrStartGame());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Último intento enviado en esta sesión: solo ese se anima (al recargar, todo aparece quieto).
  const [revealing, setRevealing] = useState<string | null>(null);
  // Última pista pedida en esta sesión: solo esa entra animada.
  const [newHint, setNewHint] = useState<HintType | null>(null);
  // Mejor puntaje y acumulado; solo cambian al terminar una partida (nunca al recargar).
  const [stats, setStats] = useState(loadStats);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduceMotion = useReducedMotion();

  // Las edades se calculan a la fecha en que empezó la partida.
  const { guesses, fecha: dateKey } = game;
  const target = getPlayerById(game.targetId)!;

  const rows = guesses.map((id) => {
    const player = getPlayerById(id)!;
    return { player, result: compare(player, target, dateKey) };
  });
  const results = rows.map((r) => r.result);
  const won = guesses.includes(target.id);
  const over = won || guesses.length >= MAX_GUESSES;
  const score = over ? computeScore(results, game.hints.length) : null;
  const hintState = hintButtonState({
    failedGuesses: guesses.filter((id) => id !== target.id).length,
    hintsUsed: game.hints.length,
    remaining: availableHints(results, game.hints).length,
    over,
  });
  const hintRows = game.hints.map((type) => ({
    type,
    text: describeHint(type, target, dateKey),
    country: type === "pais" ? target.nacionalidad : undefined,
  }));
  const justEnded = over && revealing !== null && guesses.at(-1) === revealing;
  const animateRows = !reduceMotion;
  const resultDelay = justEnded && animateRows ? REVEAL_SECONDS + 0.15 : 0;

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return players.filter((p) => !guesses.includes(p.id) && normalize(p.nombre).includes(q));
  }, [query, guesses]);

  useEffect(() => {
    if (!(won && justEnded)) return;
    const t = setTimeout(fireConfetti, resultDelay * 1000);
    return () => clearTimeout(t);
  }, [won, justEnded, resultDelay]);

  function showToast(message: string) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function submit(player: Player) {
    if (over || guesses.includes(player.id)) return;
    const next = { ...game, guesses: [...guesses, player.id] };
    setGame(next);
    saveGame(next);
    // El intento que termina la partida es el único que suma a los récords.
    if (player.id === target.id || next.guesses.length >= MAX_GUESSES) {
      const finalResults = [...results, compare(player, target, dateKey)];
      setStats(recordScore(computeScore(finalResults, game.hints.length).total));
    }
    setRevealing(player.id);
    setQuery("");
    setOpen(false);
  }

  function requestHint() {
    if (hintState !== "ready") return;
    const type = pickHint(results, game.hints);
    if (!type) return;
    const next = { ...game, hints: [...game.hints, type] };
    setGame(next);
    saveGame(next);
    setNewHint(type);
  }

  function playAgain() {
    setGame(startNewGame());
    setRevealing(null);
    setNewHint(null);
    setQuery("");
    setOpen(false);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setOpen(true);
    } else if (e.key === "Enter" && suggestions.length === 0 && query.trim()) {
      e.preventDefault();
      showToast("Elige un jugador de la lista");
    }
  }

  async function share() {
    if (!score) return;
    const text = buildShareText({
      results,
      won,
      points: score.total,
      targetName: target.nombre,
      url: window.location.origin + window.location.pathname,
      hintsUsed: game.hints.length,
    });
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
        // Si falla compartir, se intenta copiar.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("¡Copiado al portapapeles!");
    } catch {
      showToast("No se pudo copiar");
    }
  }

  const attempt = Math.min(guesses.length + (over ? 0 : 1), MAX_GUESSES);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <span>
            Intento <strong className="font-display text-lg text-foreground">{attempt}</strong> de {MAX_GUESSES}
          </span>
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: MAX_GUESSES }, (_, i) => (
              <span
                key={i}
                className={`size-2.5 rounded-full transition-colors ${
                  i < guesses.length
                    ? rows[i]?.result.isCorrect
                      ? "bg-hint-correct"
                      : "bg-brand-red"
                    : "bg-white/15"
                }`}
              />
            ))}
          </span>
        </div>

        {!over && (
          <Command
            shouldFilter={false}
            label="Buscar jugador"
            onKeyDown={onKeyDown}
            className="relative z-20 overflow-visible rounded-none! bg-transparent p-0"
          >
            <CommandInput
              value={query}
              onValueChange={(v) => {
                setQuery(v);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              placeholder="Escribe el nombre de un jugador…"
              autoComplete="off"
              className="h-full text-base placeholder:text-muted-foreground"
              groupClassName="h-14! rounded-2xl! border-2! border-white/15! bg-card/90! px-1 has-[[cmdk-input]:focus]:border-white/60!"
            />
            {open && query.trim() && (
              <CommandList
                // Evita que el input pierda el foco al tocar una sugerencia.
                onMouseDown={(e) => e.preventDefault()}
                className="absolute top-full right-1 left-1 mt-2 max-h-72 rounded-2xl bg-popover p-1 shadow-2xl ring-1 ring-white/10"
              >
                <CommandEmpty className="px-4 py-4 text-left text-sm text-muted-foreground">
                  Ningún jugador disponible con ese nombre
                </CommandEmpty>
                {suggestions.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => submit(p)}
                    className="min-h-12 rounded-xl px-3 text-base data-selected:bg-white/10"
                  >
                    <Search className="size-4 opacity-40" aria-hidden />
                    <span className="font-medium">{p.nombre}</span>
                  </CommandItem>
                ))}
              </CommandList>
            )}
          </Command>
        )}

        <AnimatePresence mode="wait">
          {score && (
            <ResultPanel
              key={game.targetId + game.fecha}
              won={won}
              target={target}
              results={results}
              score={score}
              stats={stats}
              gameKey={game.targetId + guesses.join()}
              delay={resultDelay}
              onShare={share}
              onPlayAgain={playAgain}
            />
          )}
        </AnimatePresence>

        <HintPanel state={hintState} hints={hintRows} onRequest={requestHint} animateType={newHint} />

        <section aria-label="Intentos" className="flex flex-col gap-2">
          <div
            aria-hidden
            className={`${GRID_COLS} px-2 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase`}
          >
            {COLUMNS.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <ol className="flex flex-col gap-2">
            {rows
              .map((row, i) => (
                <GuessRow
                  key={row.player.id}
                  index={i}
                  player={row.player}
                  result={row.result}
                  dateKey={dateKey}
                  animate={animateRows && row.player.id === revealing}
                />
              ))
              .reverse()}
          </ol>
          {!over &&
            Array.from({ length: MAX_GUESSES - rows.length }, (_, i) => (
              <div
                key={`empty-${i}`}
                aria-hidden
                className="flex h-[92px] items-center justify-center rounded-2xl border border-dashed border-white/12 font-display text-2xl font-bold text-white/10"
              >
                {rows.length + i + 1}
              </div>
            ))}
        </section>

        <Legend />

        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-background shadow-xl"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-hint-correct" />
        Correcto
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-hint-close" />
        Cerca
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-hint-wrong ring-1 ring-white/20" />
        No
      </span>
      <span>↑↓ el secreto tiene más / menos</span>
    </div>
  );
}
