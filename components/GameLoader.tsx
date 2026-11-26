"use client";

import dynamic from "next/dynamic";

// Solo en el cliente: la fecha de Lima y localStorage no existen en el servidor.
const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => <p className="py-10 text-center text-emerald-200/70">Cargando…</p>,
});

export default function GameLoader() {
  return <Game />;
}
