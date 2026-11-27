"use client";

import { motion } from "motion/react";
import { Crest } from "@/components/Crest";
import { Flag } from "@/components/Flag";
import { getCrest } from "@/lib/crests";
import { getFlag } from "@/lib/flags";
import { cn } from "@/lib/utils";
import type { AttrResult } from "@/lib/compare";

export const STATUS_CLASS: Record<AttrResult["status"], string> = {
  correct: "bg-hint-correct text-hint-correct-ink",
  close: "bg-hint-close text-hint-close-ink",
  wrong: "bg-hint-wrong text-hint-wrong-ink",
};

const STATUS_TEXT: Record<AttrResult["status"], string> = {
  correct: "correcto",
  close: "cerca",
  wrong: "no",
};

export const COLUMNS = ["Club", "País", "Pos.", "Edad", "Dorsal", "Pie"] as const;
/** Club lleva nombres más largos, así que su columna es más ancha. */
export const GRID_COLS = "grid grid-cols-[1.4fr_repeat(5,1fr)] gap-1";

/** Letra más chica cuanto más larga es la palabra más larga, para no partir nombres con guion. */
function sizeFor(value: string): string {
  const longest = Math.max(...value.split(" ").map((w) => w.length));
  if (longest <= 7) return "text-[13px] sm:text-base";
  if (longest <= 9) return "text-[11.5px] sm:text-[15px]";
  return "text-[10.5px] sm:text-sm";
}

export const FLIP_STAGGER = 0.12;
export const FLIP_DURATION = 0.42;
/** Segundos hasta que termina de voltearse la última celda de una fila. */
export const REVEAL_SECONDS = FLIP_STAGGER * (COLUMNS.length - 1) + FLIP_DURATION;

const ARROW_TEXT = { up: "el jugador secreto tiene más", down: "el jugador secreto tiene menos" };

export function HintCell({
  label,
  value,
  result,
  animate = false,
  delay = 0,
  country,
  club,
}: {
  label: string;
  value: string;
  result: AttrResult;
  animate?: boolean;
  delay?: number;
  /** Si se indica y tiene bandera, la celda muestra la bandera con el nombre pequeño debajo. */
  country?: string;
  /** Si se indica y tiene escudo, la celda muestra el escudo genérico con el nombre pequeño debajo. */
  club?: string;
}) {
  // Bandera o escudo: decorativos (aria-hidden); el nombre siempre va en texto.
  const badge =
    country && getFlag(country) ? (
      <Flag country={country} className="w-7 sm:w-9" />
    ) : club && getCrest(club) ? (
      <Crest club={club} className="w-6 sm:w-7" />
    ) : null;
  const arrow = result.arrow === "up" ? "↑" : result.arrow === "down" ? "↓" : "";
  const spoken = `${label}: ${value}, ${STATUS_TEXT[result.status]}${result.arrow ? `, ${ARROW_TEXT[result.arrow]}` : ""}`;
  return (
    <motion.div
      role="img"
      aria-label={spoken}
      initial={animate ? { rotateX: -90, opacity: 0 } : false}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ delay, duration: FLIP_DURATION, ease: [0.2, 0.8, 0.3, 1.15] }}
      className={cn(
        "flex min-h-14 items-center justify-center rounded-lg px-0.5 py-1 text-center font-display leading-[1.05] font-bold shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] backface-hidden",
        STATUS_CLASS[result.status],
      )}
    >
      {badge ? (
        <span className="flex max-w-full flex-col items-center gap-1">
          {badge}
          <span
            className={cn(
              "max-w-full leading-none [overflow-wrap:anywhere]",
              value.length > 7 ? "text-[10.5px]" : "text-[11.5px]",
              "sm:text-[13px]",
            )}
          >
            {value}
          </span>
        </span>
      ) : (
        <span className={cn("max-w-full [overflow-wrap:anywhere]", sizeFor(value))}>
          {value}
          {arrow && <span className="ml-0.5 text-sm sm:text-lg">{arrow}</span>}
        </span>
      )}
    </motion.div>
  );
}
