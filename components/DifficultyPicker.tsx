"use client";

import { useId } from "react";
import { NIVEL_DESCRIPTION, NIVEL_LABEL, NIVELES, type Nivel } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

/**
 * Selector Fácil / Normal. Radios nativos: Tab entra al grupo, las flechas cambian de opción.
 * El nivel solo decide de qué clubes sale el jugador secreto; el buscador siempre tiene a todos.
 */
export function DifficultyPicker({
  value,
  onChange,
  legend = "Nivel",
  className,
}: {
  value: Nivel;
  onChange: (nivel: Nivel) => void;
  legend?: string;
  className?: string;
}) {
  const name = useId();
  const descId = `${name}-desc`;

  return (
    <fieldset className={cn("flex flex-col items-center gap-1.5", className)} aria-describedby={descId}>
      <legend className="mb-1.5 w-full text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {legend}
      </legend>
      <div className="grid w-full max-w-xs grid-cols-2 gap-1 rounded-full border-2 border-white/15 bg-black/30 p-1">
        {NIVELES.map((nivel) => (
          <label
            key={nivel}
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center rounded-full font-display text-lg font-bold tracking-wide uppercase transition-colors",
              "has-focus-visible:ring-2 has-focus-visible:ring-white has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background",
              value === nivel ? "bg-brand-red text-white" : "text-foreground/75 hover:bg-white/10 hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              value={nivel}
              checked={value === nivel}
              onChange={() => onChange(nivel)}
              className="sr-only"
            />
            {NIVEL_LABEL[nivel]}
          </label>
        ))}
      </div>
      <p id={descId} className="text-center text-xs text-muted-foreground">
        {NIVEL_DESCRIPTION[value]}
      </p>
    </fieldset>
  );
}
