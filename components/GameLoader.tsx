"use client";

import dynamic from "next/dynamic";

// Solo en el cliente: el sorteo, la fecha de Lima y localStorage no existen en el servidor.
const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => <p className="py-10 text-center text-muted-foreground">Cargando…</p>,
});

// También en el cliente: decide si abrirse sola según localStorage.
const HowToPlay = dynamic(() => import("./HowToPlay"), {
  ssr: false,
  loading: () => <span className="size-11" aria-hidden />,
});

export default function GameLoader() {
  return <Game />;
}

export function HowToPlayLoader() {
  return <HowToPlay />;
}
