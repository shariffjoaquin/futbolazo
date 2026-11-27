"use client";

import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import { COLUMNS, FLIP_STAGGER, GRID_COLS, HintCell, PIE_LABEL } from "@/components/HintCell";
import type { Player } from "@/data/players";
import { ageOn, type CompareResult } from "@/lib/compare";

export function GuessRow({
  index,
  player,
  result,
  dateKey,
  animate,
}: {
  index: number;
  player: Player;
  result: CompareResult;
  dateKey: string;
  /** Solo la fila recién enviada se anima; las que vienen de una recarga aparecen quietas. */
  animate: boolean;
}) {
  const cells = [
    { value: player.club, r: result.club },
    { value: player.nacionalidad, r: result.nacionalidad },
    { value: player.posicion, r: result.posicion },
    { value: String(ageOn(player.fechaNacimiento, dateKey)), r: result.edad },
    { value: String(player.dorsal), r: result.dorsal },
    { value: PIE_LABEL[player.pie], r: result.pie },
  ];

  return (
    <motion.li
      layout
      initial={animate ? { opacity: 0, y: -14, scale: 0.94 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
      className="rounded-2xl bg-card/80 p-2 ring-1 ring-white/5 backdrop-blur-sm"
    >
      <p className="mb-1.5 flex items-center gap-1.5 px-1 text-sm font-semibold">
        <span className="font-display text-base text-muted-foreground">{index + 1}</span>
        <span className={result.isCorrect ? "text-hint-correct" : ""}>{player.nombre}</span>
        {result.isCorrect && <CircleCheck className="size-4 text-hint-correct" aria-label="Acertaste" />}
      </p>
      <div className={`${GRID_COLS} perspective-[600px]`}>
        {cells.map((c, i) => (
          <HintCell
            key={COLUMNS[i]}
            label={COLUMNS[i]}
            value={c.value}
            result={c.r}
            animate={animate}
            delay={animate ? i * FLIP_STAGGER : 0}
            country={COLUMNS[i] === "País" ? player.nacionalidad : undefined}
          />
        ))}
      </div>
    </motion.li>
  );
}
