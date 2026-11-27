import { useId } from "react";
import {
  CREST_HEIGHT,
  CREST_OUTLINE,
  CREST_PATH,
  CREST_PATTERN,
  CREST_SIGLA_SIZE,
  CREST_WIDTH,
  crestInk,
  crestLetterSpacing,
  crestSiglaY,
  getCrest,
  type CrestData,
} from "@/lib/crests";
import { cn } from "@/lib/utils";

/** Color secundario según el diseño, recortado a la forma del escudo. */
function Pattern({ crest }: { crest: CrestData }) {
  switch (crest.pattern) {
    case "jefe":
      return <rect x="0" y="0" width={CREST_WIDTH} height={CREST_PATTERN.jefeHeight} fill={crest.secondary} />;
    case "punta":
      return <rect x="0" y={CREST_PATTERN.puntaY} width={CREST_WIDTH} height={CREST_HEIGHT} fill={crest.secondary} />;
    case "borde":
      return <path d={CREST_PATH} fill="none" stroke={crest.secondary} strokeWidth={CREST_PATTERN.bordeStroke} />;
  }
}

/**
 * Escudo genérico del club en SVG propio: forma de escudo, dos colores y sigla. No imita el escudo
 * oficial. Decorativo: el nombre del club va siempre en texto al lado. `null` si el club no tiene.
 * La imagen de resultado lo dibuja igual en canvas (`lib/shareImage.ts`), con las mismas medidas.
 */
export function Crest({ club, className }: { club: string; className?: string }) {
  const clipId = `crest-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const crest = getCrest(club);
  if (!crest) return null;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${CREST_WIDTH} ${CREST_HEIGHT}`}
      className={cn("block h-auto w-6 shrink-0", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={CREST_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={CREST_WIDTH} height={CREST_HEIGHT} fill={crest.primary} />
        <Pattern crest={crest} />
      </g>
      <text
        x={CREST_WIDTH / 2}
        y={crestSiglaY(crest.pattern)}
        textAnchor="middle"
        dominantBaseline="central"
        fill={crestInk(crest.primary)}
        fontSize={CREST_SIGLA_SIZE[crest.sigla.length]}
        fontWeight="800"
        fontFamily="var(--font-display), sans-serif"
        letterSpacing={crestLetterSpacing(crest.sigla)}
      >
        {crest.sigla}
      </text>
      {/* Borde oscuro fino: separa el escudo del fondo verde, amarillo o gris de la celda. */}
      <path d={CREST_PATH} fill="none" stroke={CREST_OUTLINE.color} strokeWidth={CREST_OUTLINE.width} />
    </svg>
  );
}
