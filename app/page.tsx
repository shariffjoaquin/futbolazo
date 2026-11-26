import GameLoader from "@/components/GameLoader";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-6">
      <header className="text-center">
        <h1 className="text-3xl font-black tracking-tight">Futbolazo 🇵🇪</h1>
        <p className="text-sm text-emerald-200/80">Adivina el jugador de la Liga 1 en 6 intentos</p>
      </header>
      <GameLoader />
    </main>
  );
}
