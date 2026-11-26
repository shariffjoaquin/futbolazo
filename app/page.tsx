import GameLoader, { HowToPlayLoader } from "@/components/GameLoader";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pt-5 pb-10">
      <header className="flex flex-col items-center gap-1">
        <div className="grid w-full grid-cols-[2.75rem_1fr_2.75rem] items-center">
          <span aria-hidden />
          <h1 className="text-center font-display text-5xl leading-none font-extrabold tracking-tight uppercase italic sm:text-6xl">
            Futbol<span className="text-brand-red">azo</span>
          </h1>
          <HowToPlayLoader />
        </div>
        {/* Franja rojo-blanco-rojo: guiño a Perú, forma propia (sin escudos ni logos). */}
        <div aria-hidden className="flex h-1.5 w-28 overflow-hidden rounded-full">
          <span className="flex-1 bg-brand-red" />
          <span className="flex-1 bg-brand-white" />
          <span className="flex-1 bg-brand-red" />
        </div>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Adivina el jugador de la Liga 1 en 6 intentos
        </p>
      </header>
      <GameLoader />
      <footer className="mt-auto pt-4 text-center text-xs text-muted-foreground">
        Datos de jugadores: Wikipedia (
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/deed.es"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          CC BY-SA 4.0
        </a>
        ) y Wikidata
      </footer>
    </main>
  );
}
