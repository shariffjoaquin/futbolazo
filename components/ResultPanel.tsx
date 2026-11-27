"use client";

import { RotateCcw, Share2 } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { STATUS_CLASS } from "@/components/HintCell";
import { Button } from "@/components/ui/button";
import type { Player } from "@/data/players";
import type { CompareResult } from "@/lib/compare";
import { NIVEL_LABEL, type Nivel } from "@/lib/difficulty";
import { CATEGORY_LABEL, POSITION_LABEL } from "@/lib/labels";
import { formatPoints, type ScoreBreakdown, type ScoreStats } from "@/lib/score";
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
  score,
  stats,
  gameNivel,
  nextNivel,
  onNivelChange,
  gameKey,
  delay,
  onShare,
  onPlayAgain,
}: {
  won: boolean;
  target: Player;
  results: CompareResult[];
  score: ScoreBreakdown;
  /** Récords guardados del nivel de la partida, ya con esta partida sumada. */
  stats: ScoreStats;
  gameNivel: Nivel;
  /** Nivel elegido para la próxima partida. */
  nextNivel: Nivel;
  onNivelChange: (nivel: Nivel) => void;
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
      <CornerSash won={won} />
      <div className="relative flex flex-col items-center gap-4">
        {/* Margen lateral para que el titular no pase por debajo de la franja. */}
        <div className="px-10 sm:px-12">
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

        <ScoreCard score={score} stats={stats} nivel={gameNivel} delay={delay} />

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

        <DifficultyPicker legend="Nivel de la próxima partida" value={nextNivel} onChange={onNivelChange} className="w-full" />

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

const pointsText = (n: number) => `${formatPoints(n)} ${n === 1 ? "punto" : "puntos"}`;

/** Desglose del puntaje con el total contando hacia arriba, y los récords debajo. */
function ScoreCard({
  score,
  stats,
  nivel,
  delay,
}: {
  score: ScoreBreakdown;
  stats: ScoreStats;
  nivel: Nivel;
  delay: number;
}) {
  return (
    <div className="w-full rounded-2xl bg-black/30 px-4 py-3 text-left">
      <p className="text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">Puntaje</p>
      <dl className="mt-2 flex flex-col gap-1.5 text-sm">
        {score.won ? (
          <>
            <ScoreLine label={`Acierto en el intento ${score.attempt}`} value={formatPoints(score.base)} />
            <ScoreLine
              label={`${score.unusedHints} ${score.unusedHints === 1 ? "pista" : "pistas"} sin usar`}
              value={`+${formatPoints(score.hintBonus)}`}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {score.categories.map((c) => (
                <div
                  key={c.attr}
                  className={`flex items-baseline justify-between gap-1 rounded-lg px-2 py-1 ${STATUS_CLASS[c.status]}`}
                >
                  <dt className="truncate text-[11px] font-semibold uppercase">{CATEGORY_LABEL[c.attr]}</dt>
                  <dd className="font-display text-base leading-none font-bold">{c.points}</dd>
                </div>
              ))}
            </div>
            <ScoreLine label="Pistas (bonus solo al ganar)" value="+0" />
          </>
        )}
        <div className="mt-1 flex items-baseline justify-between border-t border-white/10 pt-2">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display text-4xl leading-none font-extrabold text-hint-gold">
            <span className="sr-only">{pointsText(score.total)}</span>
            <CountUp value={score.total} delay={delay} />
            <span aria-hidden className="ml-1 text-lg">
              pts
            </span>
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        En {NIVEL_LABEL[nivel]}: Mejor <strong className="text-foreground">{formatPoints(stats.mejor)}</strong> · Acumulado{" "}
        <strong className="text-foreground">{formatPoints(stats.total)}</strong>
      </p>
    </div>
  );
}

function ScoreLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground/85">{label}</dt>
      <dd className="font-display text-lg leading-none font-bold">{value}</dd>
    </div>
  );
}

/** Cuenta de 0 al total cuando aparece la tarjeta; con movimiento reducido muestra el total directo. */
function CountUp({ value, delay }: { value: number; delay: number }) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(reduceMotion ? value : 0);
  const text = useTransform(count, (v) => formatPoints(Math.round(v)));

  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { delay: delay + 0.4, duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [count, value, delay, reduceMotion]);

  return <motion.span aria-hidden>{text}</motion.span>;
}

/** Polígono de una franja diagonal entre las rectas x − y = c1 y x − y = c2, recortada a la caja de 120 × 120. */
const stripe = (c1: number, c2: number) => `${c1},0 ${c2},0 120,${120 - c2} 120,${120 - c1}`;

/**
 * Franja diagonal rojo-blanco-rojo que cruza la esquina, como la banda de una camiseta.
 * Dibujo propio en SVG (sin escudos ni logos). Un brillo de reflector la recorre de vez en
 * cuando; con movimiento reducido queda quieta. Solo ocupa la esquina, fuera del texto.
 */
function CornerSash({ won }: { won: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      className={`pointer-events-none absolute top-0 right-0 size-28 sm:size-32 ${won ? "" : "opacity-70"}`}
    >
      <defs>
        <clipPath id="sash-clip">
          <polygon points={stripe(42, 84)} />
        </clipPath>
        <linearGradient id="sash-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--brand-white)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--brand-white)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--brand-white)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Sombra suave bajo la franja */}
      <polygon points={stripe(38, 42)} fill="black" fillOpacity="0.25" />
      <polygon points={stripe(42, 56)} fill="var(--brand-red)" />
      <polygon points={stripe(56, 70)} fill="var(--brand-white)" />
      <polygon points={stripe(70, 84)} fill="var(--brand-red)" />
      {/* Brillo: banda vertical en un marco girado 45°, así se desliza a lo largo de la franja */}
      <g clipPath="url(#sash-clip)">
        <g transform="rotate(45 60 60)">
          <rect x="0" y="-60" width="24" height="240" fill="url(#sash-sheen)" className="motion-safe:animate-sash-sheen" />
        </g>
      </g>
    </svg>
  );
}
