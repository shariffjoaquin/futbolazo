import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../app/manifest";
import { brandIconSvg, ICO_SIZES, ICON_COLORS, MANIFEST_ICONS } from "./brandIcon";

const root = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file));

/** Ancho y alto de un PNG (cabecera IHDR). */
function pngSize(data: Buffer): [number, number] {
  expect(data.subarray(1, 4).toString("ascii")).toBe("PNG");
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

describe("brandIconSvg", () => {
  it("app/icon.svg está al día con lib/brandIcon.ts (si falla: npm run icons)", () => {
    expect(read("app/icon.svg").toString("utf8")).toBe(brandIconSvg({ rounded: true }));
  });

  it("es SVG propio: sin imágenes, enlaces externos ni texto", () => {
    for (const svg of [brandIconSvg({ rounded: true }), brandIconSvg({ rounded: false, padding: 0.1 })]) {
      expect(svg).not.toMatch(/<image|<use|<text|<script|href=/);
      expect(svg.match(/https?:\/\/[^"]+/g)).toEqual(["http://www.w3.org/2000/svg"]);
    }
  });

  it("usa los colores del tema", () => {
    const css = read("app/globals.css").toString("utf8");
    expect(css).toContain(`--stadium-night: ${ICON_COLORS.night};`);
    expect(css).toContain(`--brand-red: ${ICON_COLORS.red};`);
    const svg = brandIconSvg({ rounded: true });
    for (const color of [ICON_COLORS.night, ICON_COLORS.red, ICON_COLORS.white]) expect(svg).toContain(color);
  });

  it("redondea las esquinas solo cuando se pide", () => {
    expect(brandIconSvg({ rounded: true })).toContain('rx="14"');
    expect(brandIconSvg({ rounded: false })).toContain('rx="0"');
  });

  it("el maskable achica el balón para que quede en la zona segura", () => {
    expect(brandIconSvg({ rounded: false, padding: 0.1 })).toContain("scale(0.8)");
    expect(brandIconSvg({ rounded: false })).not.toContain("scale(");
  });
});

describe("archivos generados", () => {
  it("apple-icon es de 180 × 180", () => {
    expect(pngSize(read("app/apple-icon.png"))).toEqual([180, 180]);
  });

  it("favicon.ico trae PNG de 16, 32 y 48 px", () => {
    const ico = read("app/favicon.ico");
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(ICO_SIZES.length);
    ICO_SIZES.forEach((size, i) => {
      const entry = 6 + 16 * i;
      const length = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      expect(ico.readUInt8(entry)).toBe(size);
      expect(pngSize(ico.subarray(offset, offset + length))).toEqual([size, size]);
    });
  });

  it("cada ícono del manifiesto existe y tiene el tamaño que declara", () => {
    for (const icon of MANIFEST_ICONS) {
      const [w, h] = pngSize(read(path.join("public", icon.src)));
      expect(`${w}x${h}`).toBe(icon.sizes);
    }
  });
});

describe("manifest", () => {
  const m = manifest();

  it("nombre, standalone y colores del fondo", () => {
    expect(m).toMatchObject({
      name: "Futbolazo",
      short_name: "Futbolazo",
      start_url: "/",
      display: "standalone",
      background_color: ICON_COLORS.night,
      theme_color: ICON_COLORS.night,
    });
  });

  it("íconos de 192 y 512 px, uno maskable", () => {
    expect(m.icons?.map((i) => i.sizes)).toEqual(["192x192", "512x512", "512x512"]);
    expect(m.icons?.filter((i) => i.purpose === "maskable")).toHaveLength(1);
  });
});
