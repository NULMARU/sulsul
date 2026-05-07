import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '..', 'public', 'icons');

const sourceSvg = readFileSync(resolve(iconsDir, 'source.svg'));
const maskableSvg = readFileSync(resolve(iconsDir, 'source-maskable.svg'));

const targets = [
  { src: sourceSvg, size: 192, file: 'icon-192.png' },
  { src: sourceSvg, size: 512, file: 'icon-512.png' },
  { src: maskableSvg, size: 512, file: 'icon-maskable-512.png' },
];

for (const t of targets) {
  await sharp(t.src, { density: 384 })
    .resize(t.size, t.size)
    .png({ compressionLevel: 9 })
    .toFile(resolve(iconsDir, t.file));
  console.log(`✓ ${t.file} (${t.size}×${t.size})`);
}
