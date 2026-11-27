"use client";

import { motion } from "motion/react";
import { Crest } from "@/components/Crest";
import { Flag } from "@/components/Flag";
import { Button } from "@/components/ui/button";
import type { HintButtonState, HintText, HintType } from "@/lib/hints";
import { MAX_HINTS } from "@/lib/hints";

/**
 * Botón "💡 Pista" y filas de pistas reveladas. Las filas van con borde dorado para que no se
 * confundan con las filas de intento, y la lista anuncia cada pista nueva a lectores de pantalla.
 */
export function HintPanel({
  state,
  hints,
  onRequest,
  animateType,
}: {
  state: HintButtonState;
  hints: { type: HintType; text: HintText; country?: string; club?: string }[];
  onRequest: () => void;
  /** Pista recién pedida: solo esa entra animada. */
  animateType: HintType | null;
}) {
  const left = MAX_HINTS - hints.length;
  const status =
    state === "ready"
      ? `Te ${left === 1 ? "queda 1 pista" : `quedan ${left} pistas`}. No gastan intentos.`
      : state === "none-left"
        ? "Ya usaste tus pistas."
        : "Partida terminada.";

  return (
    <section aria-label="Pistas extra" className="flex flex-col gap-2">
      {state !== "hidden" && (
        <div className="flex items-center justify-between gap-3 rounded-2xl px-1">
          <p className="text-xs text-muted-foreground">{status}</p>
          <Button
            onClick={onRequest}
            disabled={state !== "ready"}
            variant="outline"
            className="h-11 shrink-0 rounded-full border-2 border-hint-gold/80 bg-hint-gold/10 px-5 font-display text-lg font-bold tracking-wide text-hint-gold uppercase hover:bg-hint-gold/20 hover:text-hint-gold dark:border-hint-gold/80 dark:bg-hint-gold/10 dark:hover:bg-hint-gold/20 disabled:opacity-45"
          >
            {state === "none-left" ? "Sin pistas" : "💡 Pista"}
          </Button>
        </div>
      )}
      <ul aria-live="polite" className="flex flex-col gap-2">
        {hints.map(({ type, text, country, club }, i) => (
          <motion.li
            key={type}
            initial={animateType === type ? { opacity: 0, y: -10, scale: 0.95 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
            className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-hint-gold bg-hint-gold/10 px-3 py-2"
          >
            <span className="sr-only">
              Pista {i + 1}: {text.spoken}.
            </span>
            <span aria-hidden className="text-2xl leading-none">
              💡
            </span>
            <div aria-hidden className="flex min-w-0 flex-col">
              <span className="text-[11px] font-semibold tracking-wider text-hint-gold uppercase">
                Pista {i + 1} · {text.label}
              </span>
              <span className="flex items-center gap-2 font-display text-xl leading-tight font-bold">
                {country && <Flag country={country} className="w-7" />}
                {club && <Crest club={club} className="w-6" />}
                <span className="truncate">{text.value}</span>
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
