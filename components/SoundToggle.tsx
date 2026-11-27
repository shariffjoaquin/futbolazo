"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { getSoundEngine, getSoundSetting, setSoundSetting, subscribeSoundSetting } from "@/lib/audio";

/** Silencia o activa sonido y vibración. Activarlo a mano cuenta como "on" (ver movimiento reducido). */
export default function SoundToggle() {
  const setting = useSyncExternalStore(subscribeSoundSetting, getSoundSetting, getSoundSetting);
  const muted = setting === "off";
  const label = muted ? "Activar sonido y vibración" : "Silenciar sonido y vibración";

  function toggle() {
    if (!muted) {
      setSoundSetting("off");
      return;
    }
    setSoundSetting("on");
    // El clic es un gesto del usuario: se puede crear el audio y confirmar con un ding.
    const engine = getSoundEngine();
    engine.unlock();
    engine.play("verde");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="size-11 rounded-full text-foreground"
    >
      {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
    </Button>
  );
}
