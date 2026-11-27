import { useId } from "react";
import { CREST_HEIGHT, CREST_PATH, CREST_WIDTH, crestInk, getCrest, type CrestData } from "@/lib/crests";
import { cn } from "@/lib/utils";

/** Color secundario según el diseño, recortado a la forma del escudo. */
function Pattern({ crest }: { crest: CrestData }) {
  switch (crest.pattern) {
    case "jefe":
      return <rect x="0" y="0" width={CREST_WIDTH} height="8" fill={crest.secondary} />;
    case "punta":
      return <rect x="0" y="19.5" width={CREST_WIDTH} height={CREST_HEIGHT} fill={crest.secondary} />;
    case "borde":
      // Trazo centrado en el contorno: con el recorte queda la mitad interior, un borde de 2,5.
      return <path d={CREST_PATH} fill="none" stroke={crest.secondary} strokeWidth="5" />;
  }
}

/** Altura de la sigla: más chica cuantas más letras tenga. */
const FONT_SIZE = [0, 13, 10, 7.6];

/**
 * Escudo genérico del club en SVG propio: forma de escudo, dos colores y sigla. No imita el escudo
 * oficial. Decorativo: el nombre del club va siempre en texto al lado. `null` si el club no tiene.
 */
export function Crest({ club, className }: { club: string; className?: string }) {
  const clipId = `crest-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const crest = getCrest(club);
  if (!crest) return null;
  // Con franja arriba, la sigla baja un poco para quedar sobre el campo.
  const textY = crest.pattern === "jefe" ? 16.8 : crest.pattern === "punta" ? 13 : 14.6;
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
        y={textY}
        textAnchor="middle"
        dominantBaseline="central"
        fill={crestInk(crest.primary)}
        fontSize={FONT_SIZE[crest.sigla.length]}
        fontWeight="800"
        fontFamily="var(--font-display), sans-serif"
        letterSpacing={crest.sigla.length === 3 ? "-0.2" : "0"}
      >
        {crest.sigla}
      </text>
      {/* Borde oscuro fino: separa el escudo del fondo verde, amarillo o gris de la celda. */}
      <path d={CREST_PATH} fill="none" stroke="rgb(0 0 0 / 0.45)" strokeWidth="1" />
    </svg>
  );
}
