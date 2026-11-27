import { useId } from "react";
import { cn } from "@/lib/utils";
import { FLAG_HEIGHT, FLAG_WIDTH, getFlag, type FlagShape } from "@/lib/flags";

function Shape({ shape }: { shape: FlagShape }) {
  switch (shape.kind) {
    case "rect":
      return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} fill={shape.fill} />;
    case "circle":
      return (
        <circle
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
    case "polygon":
      return <polygon points={shape.points} fill={shape.fill} />;
    case "path":
      return <path d={shape.d} fill="none" stroke={shape.stroke} strokeWidth={shape.strokeWidth} strokeLinecap="round" />;
  }
}

/**
 * Bandera estilizada en SVG propio (decorativa: el nombre del país va siempre en texto al lado).
 * Devuelve `null` si el país no tiene bandera definida.
 */
export function Flag({ country, className }: { country: string; className?: string }) {
  const clipId = `flag-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const shapes = getFlag(country);
  if (!shapes) return null;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${FLAG_WIDTH} ${FLAG_HEIGHT}`}
      className={cn("block h-auto w-7 shrink-0", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={FLAG_WIDTH} height={FLAG_HEIGHT} rx="3" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {shapes.map((shape, i) => (
          <Shape key={i} shape={shape} />
        ))}
      </g>
      {/* Borde oscuro fino: separa la bandera del fondo verde, amarillo o gris de la celda. */}
      <rect
        x="0.5"
        y="0.5"
        width={FLAG_WIDTH - 1}
        height={FLAG_HEIGHT - 1}
        rx="2.6"
        fill="none"
        stroke="rgb(0 0 0 / 0.4)"
      />
    </svg>
  );
}
