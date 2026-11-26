"use client";

import { useMemo, useRef, useState } from "react";
import { getPlayerById, players, type Player } from "@/data/players";
import { ageOn, compare, type AttrResult, type CompareResult } from "@/lib/compare";
import { resumeOrStartGame, startNewGame } from "@/lib/game";
import { buildShareText, MAX_GUESSES } from "@/lib/share";
import { saveGame, type SavedGame } from "@/lib/storage";

const STATUS_CLASS: Record<AttrResult["status"], string> = {
  correct: "bg-emerald-500 text-emerald-950",
  close: "bg-amber-400 text-amber-950",
  wrong: "bg-zinc-700 text-zinc-100",
};

const POSITION_LABEL: Record<Player["posicion"], string> = {
  POR: "Portero",
  DEF: "Defensa",
  MED: "Medio",
  DEL: "Delantero",
};

const PIE_LABEL: Record<Player["pie"], string> = { D: "Derecho", I: "Izquierdo", Ambos: "Ambos" };

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export default function Game() {
  // Retoma la partida guardada o empieza una nueva; es idempotente, así el doble render de modo estricto no gasta jugadores.
  const [game, setGame] = useState<SavedGame>(() => resumeOrStartGame());
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Las edades se calculan a la fecha en que empezó la partida.
  const { guesses, fecha: dateKey } = game;
  const target = getPlayerById(game.targetId)!;

  const rows = guesses.map((id) => {
    const player = getPlayerById(id)!;
    return { player, result: compare(player, target, dateKey) };
  });
  const won = guesses.includes(target.id);
  const over = won || guesses.length >= MAX_GUESSES;

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return players.filter((p) => !guesses.includes(p.id) && normalize(p.nombre).includes(q));
  }, [query, guesses]);

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
    setQuery("");
    setOpen(false);
    setHighlight(0);
  }

  function playAgain() {
    setGame(startNewGame());
    setQuery("");
    setOpen(false);
    setHighlight(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = suggestions[highlight];
      if (pick) submit(pick);
      else if (query.trim()) showToast("Elige un jugador de la lista");
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  async function share() {
    const text = buildShareText(
      rows.map((r) => r.result),
      won,
      window.location.origin + window.location.pathname,
    );
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

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-center text-sm text-emerald-200/80">
        Intento {Math.min(guesses.length + (over ? 0 : 1), MAX_GUESSES)} de {MAX_GUESSES}
      </p>

      {!over && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            placeholder="Escribe el nombre de un jugador…"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls="player-suggestions"
            aria-label="Buscar jugador"
            className="w-full rounded-xl border border-emerald-700 bg-emerald-900/60 px-4 py-3 text-base text-white placeholder:text-emerald-300/60 focus:border-emerald-400 focus:outline-none"
          />
          {open && suggestions.length > 0 && (
            <ul
              id="player-suggestions"
              role="listbox"
              className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-emerald-700 bg-emerald-950 shadow-xl"
            >
              {suggestions.map((p, i) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submit(p);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`cursor-pointer px-4 py-3 ${i === highlight ? "bg-emerald-800" : ""}`}
                >
                  {p.nombre}
                </li>
              ))}
            </ul>
          )}
          {open && query.trim() && suggestions.length === 0 && (
            <p className="absolute mt-1 w-full rounded-xl bg-emerald-950 px-4 py-3 text-sm text-emerald-300/80">
              Ningún jugador disponible con ese nombre
            </p>
          )}
        </div>
      )}

      {over && (
        <div className={`rounded-xl p-4 text-center ${won ? "bg-emerald-600" : "bg-rose-700"}`}>
          <p className="text-lg font-bold">
            {won ? `¡Golazo! Lo adivinaste en ${guesses.length}/${MAX_GUESSES}` : "¡Se acabaron los intentos!"}
          </p>
          <p className="mt-1">
            El jugador era <strong>{target.nombre}</strong>
          </p>
          <p className="text-sm opacity-90">
            {target.club} · {target.nacionalidad} · {POSITION_LABEL[target.posicion]} · #{target.dorsal}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              onClick={share}
              className="rounded-full bg-white px-6 py-2 font-semibold text-emerald-950 active:scale-95"
            >
              Compartir
            </button>
            <button
              onClick={playAgain}
              className="rounded-full border-2 border-white px-6 py-2 font-semibold text-white active:scale-95"
            >
              Jugar otra vez
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {rows
          .map((row, i) => <GuessRow key={row.player.id} index={i} player={row.player} result={row.result} dateKey={dateKey} />)
          .reverse()}
        {Array.from({ length: over ? 0 : MAX_GUESSES - rows.length }, (_, i) => (
          <div key={`empty-${i}`} className="h-[88px] rounded-xl border border-dashed border-emerald-800" />
        ))}
      </div>

      <Legend />

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 mx-auto w-fit rounded-full bg-white px-5 py-2 text-sm font-medium text-emerald-950 shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function GuessRow({
  index,
  player,
  result,
  dateKey,
}: {
  index: number;
  player: Player;
  result: CompareResult;
  dateKey: string;
}) {
  const arrow = (r: AttrResult) => (r.arrow === "up" ? " ↑" : r.arrow === "down" ? " ↓" : "");
  const cells: { label: string; value: string; r: AttrResult }[] = [
    { label: "Club", value: player.club, r: result.club },
    { label: "País", value: player.nacionalidad, r: result.nacionalidad },
    { label: "Pos.", value: player.posicion, r: result.posicion },
    { label: "Edad", value: `${ageOn(player.fechaNacimiento, dateKey)}${arrow(result.edad)}`, r: result.edad },
    { label: "Dorsal", value: `${player.dorsal}${arrow(result.dorsal)}`, r: result.dorsal },
    { label: "Pie", value: PIE_LABEL[player.pie], r: result.pie },
  ];

  return (
    <div className="rounded-xl bg-emerald-900/50 p-2">
      <p className={`mb-1.5 px-1 text-sm font-semibold ${result.isCorrect ? "text-emerald-300" : ""}`}>
        {index + 1}. {player.nombre}
      </p>
      <div className="grid grid-cols-6 gap-1">
        {cells.map((c) => (
          <div
            key={c.label}
            className={`flex min-h-12 flex-col items-center justify-center rounded-md px-0.5 py-1 text-center ${STATUS_CLASS[c.r.status]}`}
          >
            <span className="text-[9px] uppercase tracking-wide opacity-70">{c.label}</span>
            <span className="max-w-full text-[11px] font-bold leading-tight hyphens-auto [overflow-wrap:anywhere] sm:text-sm">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-emerald-200/80">
      <span><span className="mr-1 inline-block size-3 rounded-sm bg-emerald-500 align-middle" />Correcto</span>
      <span><span className="mr-1 inline-block size-3 rounded-sm bg-amber-400 align-middle" />Cerca (pos. vecina, edad ±2, dorsal ±3)</span>
      <span><span className="mr-1 inline-block size-3 rounded-sm bg-zinc-700 align-middle" />No</span>
      <span>↑↓ el jugador del día tiene más / menos</span>
    </div>
  );
}
