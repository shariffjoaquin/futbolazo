"use client";

import { RotateCcw, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { POSITION_LABEL } from "@/components/HintCell";
import { Button } from "@/components/ui/button";
import type { Player } from "@/data/players";
import type { CompareResult } from "@/lib/compare";
import { ATTRIBUTES, EMOJI, MAX_GUESSES } from "@/lib/share";

const LOSS_LINES = [
  "¡Uy, al palo!",
  "Te faltó el último pase",
  "El arquero te lo tapó todo",
  "Fue offside… por poquito",
  "Se fue a la tribuna",
  "Hoy no era tu clásico",
];

/** Frase fija para cada partida (no cambia al recargar). */
function pick(lines: string[], seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lines[h % lines.length];
}

export function ResultPanel({
  won,
  target,
  results,
  gameKey,
  delay,
  onShare,
  onPlayAgain,
}: {
  won: boolean;
  target: Player;
  results: CompareResult[];
  /** Identifica la partida para elegir la frase. */
  gameKey: string;
  /** Espera a que termine de voltearse la última fila. */
  delay: number;
  onShare: () => void;
  onPlayAgain: () => void;
}) {
  const headline = won ? "¡Golazo!" : pick(LOSS_LINES, gameKey);
  const sub = won
    ? `Lo adivinaste en ${results.length}/${MAX_GUESSES}`
    : "Se acabaron los intentos… pero la revancha es ya.";

  return (
    <motion.section
      aria-live="polite"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", bounce: 0.35, duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl bg-card p-5 text-center ring-1 ring-white/10"
    >
      {/* Franja diagonal roja: forma propia, sin escudos. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -top-10 -right-16 h-40 w-24 rotate-[35deg] ${won ? "bg-brand-red/80" : "bg-white/10"}`}
      />
      <div className="relative flex flex-col items-center gap-4">
        <div>
          <p className="font-display text-5xl leading-none font-extrabold uppercase italic">{headline}</p>
          <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
        </div>

        <div className="w-full rounded-2xl bg-black/30 px-4 py-3">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">El jugador era</p>
          <p className="font-display text-3xl font-bold">{target.nombre}</p>
          <p className="text-sm text-foreground/85">
            {target.club} · {target.nacionalidad} · {POSITION_LABEL[target.posicion]} · #{target.dorsal}
          </p>
        </div>

        <figure className="flex flex-col items-center gap-1.5">
          <figcaption className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Tu jugada · {won ? results.length : "X"}/{MAX_GUESSES}
          </figcaption>
          <div
            role="img"
            aria-label={`Resultado: ${won ? `acertaste en ${results.length} intentos` : "no acertaste"}`}
            className="flex flex-col gap-1 rounded-xl bg-black/30 px-3 py-2 text-xl leading-none tracking-[0.15em]"
          >
            {results.map((r, i) => (
              <span key={i}>{ATTRIBUTES.map((a) => EMOJI[r[a].status]).join("")}</span>
            ))}
          </div>
        </figure>

        <div className="grid w-full gap-2.5 sm:grid-cols-2">
          <Button
            onClick={onShare}
            className="h-14 rounded-2xl font-display text-xl font-bold tracking-wide uppercase hover:bg-brand-red-strong"
          >
            <Share2 className="size-5" />
            Compartir
          </Button>
          <Button
            onClick={onPlayAgain}
            variant="outline"
            className="h-14 rounded-2xl border-2 border-white bg-white font-display text-xl font-bold tracking-wide text-background uppercase hover:bg-white/85 hover:text-background dark:border-white dark:bg-white dark:hover:bg-white/85"
          >
            <RotateCcw className="size-5" />
            Jugar otra vez
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
