import type { MetadataRoute } from "next";
import { ICON_COLORS, MANIFEST_ICONS } from "@/lib/brandIcon";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Futbolazo",
    short_name: "Futbolazo",
    description: "Juego para adivinar jugadores de la Liga 1 peruana",
    lang: "es",
    start_url: "/",
    display: "standalone",
    background_color: ICON_COLORS.night,
    theme_color: ICON_COLORS.night,
    icons: MANIFEST_ICONS.map((icon) => ({ ...icon })),
  };
}
