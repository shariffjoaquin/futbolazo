import type { CompareResult } from "./compare";
import { ATTRIBUTES } from "./share";

/** Sonidos del juego. Todos se generan con Web Audio API (ver `lib/audio.ts`). */
export type SoundName = "volteo" | "verde" | "amarillo" | "fallo" | "pista" | "ganar" | "perder";

export interface Note {
  /** Hz. */
  freq: number;
  /** Segundos desde que empieza el sonido. */
  start: number;
  duration: number;
  wave: OscillatorType;
  /** 0–1, antes del volumen maestro. */
  gain: number;
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

export const SOUNDS: Record<SoundName, Note[]> = {
  // Tick suave y muy corto por cada celda que se voltea.
  volteo: [{ freq: 1900, start: 0, duration: 0.03, wave: "triangle", gain: 0.12 }],
  // Ding agudo con un armónico para que brille.
  verde: [
    { freq: 1318.5, start: 0, duration: 0.22, wave: "sine", gain: 0.5 },
    { freq: 2637, start: 0, duration: 0.12, wave: "sine", gain: 0.12 },
  ],
  amarillo: [{ freq: G5, start: 0, duration: 0.16, wave: "sine", gain: 0.4 }],
  fallo: [{ freq: 165, start: 0, duration: 0.2, wave: "triangle", gain: 0.6 }],
  // Campanita: dos parciales que se apagan despacio.
  pista: [
    { freq: 1568, start: 0, duration: 0.5, wave: "sine", gain: 0.4 },
    { freq: 2349.3, start: 0, duration: 0.35, wave: "sine", gain: 0.18 },
    { freq: 2093, start: 0.09, duration: 0.45, wave: "sine", gain: 0.3 },
  ],
  // Arpegio ascendente que dura 1 segundo.
  ganar: [
    { freq: C5, start: 0, duration: 0.22, wave: "triangle", gain: 0.5 },
    { freq: E5, start: 0.18, duration: 0.22, wave: "triangle", gain: 0.5 },
    { freq: G5, start: 0.36, duration: 0.22, wave: "triangle", gain: 0.5 },
    { freq: C6, start: 0.54, duration: 0.46, wave: "triangle", gain: 0.55 },
  ],
  perder: [
    { freq: 392, start: 0, duration: 0.3, wave: "triangle", gain: 0.5 },
    { freq: 293.66, start: 0.3, duration: 0.45, wave: "triangle", gain: 0.5 },
  ],
};

/** Duración total de un sonido en segundos. */
export function soundLength(name: SoundName): number {
  return Math.max(...SOUNDS[name].map((n) => n.start + n.duration));
}

/** Sonidos que acompañan una animación: se callan con movimiento reducido (salvo sonido activado a mano). */
export const ANIMATION_SOUNDS: ReadonlySet<SoundName> = new Set<SoundName>(["volteo"]);

/** Patrones de `navigator.vibrate` en milisegundos (vibra, pausa, vibra…). */
export const VIBRATION = {
  fallo: [60],
  acierto: [40, 70, 40],
  ganar: [120, 80, 120, 80, 320],
} as const satisfies Record<string, readonly number[]>;

/** `"on"` = activado a mano, `"off"` = silenciado, `"default"` = nunca tocó el botón. */
export type SoundSetting = "on" | "off" | "default";

export interface FeedbackPolicy {
  sound: boolean;
  animationSounds: boolean;
  vibration: boolean;
}

/** Qué se permite según el ajuste y el movimiento reducido. */
export function feedbackPolicy(setting: SoundSetting, reducedMotion: boolean): FeedbackPolicy {
  if (setting === "off") return { sound: false, animationSounds: false, vibration: false };
  if (setting === "on") return { sound: true, animationSounds: true, vibration: true };
  return { sound: true, animationSounds: !reducedMotion, vibration: !reducedMotion };
}

export interface FeedbackPlan {
  sounds: { sound: SoundName; at: number }[];
  vibration: { pattern: readonly number[]; at: number } | null;
}

export type GuessOutcome = "fallo" | "ganar" | "perder";

/** Tiempos del volteo de una fila (los mismos de la animación). */
export interface FlipTiming {
  stagger: number;
  duration: number;
}

/** Pausa entre el sonido resumido de la fila y el del resultado, cuando no hay volteo. */
const SUMMARY_GAP = 0.18;

/**
 * Sonidos y vibración de un intento. Con volteo: tick al empezar cada celda, verde/amarillo cuando
 * termina de mostrarse, y el resultado al terminar la fila. Sin volteo: un solo sonido de celda (el
 * mejor de la fila) y luego el resultado. Una vibración por intento.
 */
export function planGuess(
  result: CompareResult,
  outcome: GuessOutcome,
  policy: FeedbackPolicy,
  animated: boolean,
  timing: FlipTiming,
): FeedbackPlan {
  const statuses = ATTRIBUTES.map((a) => result[a].status);
  const sounds: FeedbackPlan["sounds"] = [];
  let end: number;

  if (animated) {
    statuses.forEach((status, i) => {
      const start = i * timing.stagger;
      sounds.push({ sound: "volteo", at: start });
      if (status !== "wrong") sounds.push({ sound: status === "correct" ? "verde" : "amarillo", at: start + timing.duration * 0.6 });
    });
    end = timing.stagger * (statuses.length - 1) + timing.duration;
  } else {
    const best = statuses.includes("correct") ? "verde" : statuses.includes("close") ? "amarillo" : null;
    if (best && outcome !== "ganar") sounds.push({ sound: best, at: 0 });
    end = best && outcome !== "ganar" ? SUMMARY_GAP : 0;
  }
  sounds.push({ sound: outcome, at: end });

  const pattern =
    outcome === "ganar" ? VIBRATION.ganar : statuses.includes("correct") ? VIBRATION.acierto : VIBRATION.fallo;
  return filterPlan({ sounds, vibration: { pattern, at: end } }, policy);
}

/** Campanita al pedir una pista; sin vibración. */
export function planHint(policy: FeedbackPolicy): FeedbackPlan {
  return filterPlan({ sounds: [{ sound: "pista", at: 0 }], vibration: null }, policy);
}

/** Quita lo que la política no permite. */
export function filterPlan(plan: FeedbackPlan, policy: FeedbackPolicy): FeedbackPlan {
  return {
    sounds: policy.sound
      ? plan.sounds.filter((s) => policy.animationSounds || !ANIMATION_SOUNDS.has(s.sound))
      : [],
    vibration: policy.vibration ? plan.vibration : null,
  };
}
