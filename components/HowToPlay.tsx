"use client";

import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { COLUMNS, GRID_COLS, HintCell } from "@/components/HintCell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AttrResult } from "@/lib/compare";
import { loadHelpSeen, saveHelpSeen } from "@/lib/storage";

// Jugador inventado solo para ilustrar las pistas.
const EXAMPLE: { value: string; r: AttrResult }[] = [
  { value: "Melgar", r: { status: "correct" } },
  { value: "Perú", r: { status: "wrong" } },
  { value: "MED", r: { status: "close" } },
  { value: "24", r: { status: "close", arrow: "up" } },
  { value: "9", r: { status: "wrong", arrow: "down" } },
  { value: "Zurdo", r: { status: "correct" } },
];

export default function HowToPlay() {
  // Se abre sola la primera vez que se visita el juego.
  const [open, setOpen] = useState(() => !loadHelpSeen());

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) saveHelpSeen();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-11 rounded-full text-foreground" aria-label="¿Cómo se juega?">
          <CircleHelp className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto rounded-3xl p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-extrabold uppercase italic">¿Cómo se juega?</DialogTitle>
          <DialogDescription className="text-base text-foreground/90">
            Adivina al jugador secreto de la Liga 1 en <strong>6 intentos</strong>. Escribe un nombre y elígelo de la
            lista. Cada intento te da 6 pistas.
          </DialogDescription>
        </DialogHeader>

        <figure className="flex flex-col gap-1.5">
          <div className={`${GRID_COLS} text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase`}>
            {COLUMNS.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <div className={GRID_COLS}>
            {EXAMPLE.map((c, i) => (
              <HintCell
                key={COLUMNS[i]}
                label={COLUMNS[i]}
                value={c.value}
                result={c.r}
                country={COLUMNS[i] === "País" ? c.value : undefined}
              />
            ))}
          </div>
          <figcaption className="text-xs text-muted-foreground">Ejemplo con un jugador inventado.</figcaption>
        </figure>

        <ul className="flex flex-col gap-2.5 text-sm">
          <Hint swatch="bg-hint-correct">
            <strong>Verde:</strong> ese dato es igual al del jugador secreto. Aquí juega en Melgar y es zurdo.
          </Hint>
          <Hint swatch="bg-hint-close">
            <strong>Amarillo:</strong> cerca. Posición vecina (POR → DEF → MED → DEL), edad a 2 años o menos, dorsal a 3
            o menos.
          </Hint>
          <Hint swatch="bg-hint-wrong ring-1 ring-white/20">
            <strong>Gris:</strong> no coincide.
          </Hint>
          <Hint swatch="">
            <strong>↑ ↓</strong> en edad y dorsal: el jugador secreto tiene más o menos. Aquí es mayor que 24 y lleva un
            número menor que el 9.
          </Hint>
        </ul>

        <p className="text-sm text-muted-foreground">
          Partidas ilimitadas: al terminar, toca <strong className="text-foreground">Jugar otra vez</strong> y sale otro
          jugador.
        </p>

        <DialogClose asChild>
          <Button className="h-12 rounded-2xl font-display text-xl font-bold tracking-wide uppercase">¡A jugar!</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function Hint({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden className={`mt-0.5 size-4 shrink-0 rounded ${swatch}`} />
      <span>{children}</span>
    </li>
  );
}
