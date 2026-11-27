/**
 * Genera todos los íconos desde `lib/brandIcon.ts`: `npm run icons`.
 * Los PNG se dibujan con `ImageResponse` de `next/og` (viene con Next, sin dependencias nuevas).
 */
import { ImageResponse } from "next/og.js";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { brandIconSvg, ICO_SIZES, type IconOptions } from "../lib/brandIcon";

const root = process.cwd();

async function png(size: number, options: IconOptions): Promise<Buffer> {
  const src = `data:image/svg+xml;base64,${Buffer.from(brandIconSvg(options)).toString("base64")}`;
  // eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo entiende <img>
  const image = new ImageResponse(<img src={src} width={size} height={size} alt="" />, { width: size, height: size });
  return Buffer.from(await image.arrayBuffer());
}

/** Archivo ICO con PNG adentro (lo aceptan todos los navegadores actuales). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: ícono
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size % 256, 0); // 256 se escribe como 0
    entry.writeUInt8(size % 256, 1);
    entry.writeUInt16LE(1, 4); // planos
    entry.writeUInt16LE(32, 6); // bits por píxel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

function write(file: string, data: string | Buffer) {
  const full = path.join(root, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, data);
  console.log(`✓ ${file}`);
}

const rounded: IconOptions = { rounded: true };
const square: IconOptions = { rounded: false };

async function main() {
  write("app/icon.svg", brandIconSvg(rounded));
  const icoImages = await Promise.all(ICO_SIZES.map(async (size) => ({ size, data: await png(size, rounded) })));
  write("app/favicon.ico", ico(icoImages));
  write("app/apple-icon.png", await png(180, square));
  write("public/icons/icon-192.png", await png(192, rounded));
  write("public/icons/icon-512.png", await png(512, rounded));
  write("public/icons/icon-maskable-512.png", await png(512, { ...square, padding: 0.1 }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
