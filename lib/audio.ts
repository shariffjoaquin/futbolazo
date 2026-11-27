import { type FeedbackPlan, type SoundName, type SoundSetting, SOUNDS } from "./sounds";
import { loadSoundSetting, saveSoundSetting } from "./storage";

/** Volumen maestro bajo para todos los sonidos. */
export const MASTER_VOLUME = 0.25;

/** Lo que usamos de `AudioContext`; en los tests se reemplaza por uno simulado. */
export type AudioContextLike = Pick<
  AudioContext,
  "currentTime" | "state" | "resume" | "destination" | "createOscillator" | "createGain"
>;

export interface EngineDeps {
  /** Crea el contexto; `null` si el navegador no tiene Web Audio. */
  createContext: () => AudioContextLike | null;
  /** `navigator.vibrate` o nada. */
  vibrate: ((pattern: number[]) => unknown) | undefined;
  setTimer: (fn: () => void, ms: number) => unknown;
}

export interface SoundEngine {
  /** Crea o reanuda el audio. Llamarla solo dentro de un gesto del usuario (clic, tecla). */
  unlock(): void;
  play(sound: SoundName, at?: number): void;
  vibrate(pattern: readonly number[], at?: number): void;
  run(plan: FeedbackPlan): void;
}

/** Motor de sonido. No crea el `AudioContext` hasta `unlock()`: nunca suena al cargar. */
export function createSoundEngine(deps: EngineDeps): SoundEngine {
  let ctx: AudioContextLike | null = null;
  let master: GainNode | null = null;

  const engine: SoundEngine = {
    unlock() {
      try {
        if (!ctx) {
          ctx = deps.createContext();
          if (!ctx) return;
          master = ctx.createGain();
          master.gain.value = MASTER_VOLUME;
          master.connect(ctx.destination);
        }
        if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      } catch {
        // Sin audio: el juego sigue igual.
        ctx = null;
      }
    },

    play(sound, at = 0) {
      if (!ctx || !master) return;
      try {
        const t0 = ctx.currentTime + at;
        for (const note of SOUNDS[sound]) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = t0 + note.start;
          const stop = start + note.duration;
          osc.type = note.wave;
          osc.frequency.value = note.freq;
          // Ataque corto y caída exponencial: sin chasquidos.
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, stop);
          osc.connect(gain);
          gain.connect(master);
          osc.start(start);
          osc.stop(stop + 0.02);
        }
      } catch {
        // Un sonido que falla no debe romper el juego.
      }
    },

    vibrate(pattern, at = 0) {
      const vibrate = deps.vibrate;
      if (!vibrate) return;
      const fire = () => {
        try {
          vibrate([...pattern]);
        } catch {
          // Algunos navegadores bloquean la vibración: se ignora.
        }
      };
      if (at > 0) deps.setTimer(fire, at * 1000);
      else fire();
    },

    run(plan) {
      for (const { sound, at } of plan.sounds) engine.play(sound, at);
      if (plan.vibration) engine.vibrate(plan.vibration.pattern, plan.vibration.at);
    },
  };
  return engine;
}

let browserEngine: SoundEngine | null = null;

/** Motor del navegador, compartido por el juego y el botón de la cabecera. */
export function getSoundEngine(): SoundEngine {
  browserEngine ??= createSoundEngine({
    createContext: () => {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      return Ctor ? new Ctor() : null;
    },
    vibrate: typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
      ? (p) => navigator.vibrate(p)
      : undefined,
    setTimer: (fn, ms) => setTimeout(fn, ms),
  });
  return browserEngine;
}

// El ajuste vive en memoria para que silenciar funcione aunque localStorage esté bloqueado.
let setting: SoundSetting | null = null;
const listeners = new Set<() => void>();

export function getSoundSetting(): SoundSetting {
  setting ??= loadSoundSetting();
  return setting;
}

export function setSoundSetting(next: SoundSetting): void {
  setting = next;
  saveSoundSetting(next);
  listeners.forEach((l) => l());
}

export function subscribeSoundSetting(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
