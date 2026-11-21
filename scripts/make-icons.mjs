// Draws the Daymark icon (a tilted marigold tile with a dark check) as PNGs.
// Run with: npm run icons  (output goes to public/icons)
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const TILE = [0xff, 0xc9, 0x3c];
const INK = [0x1d, 0x1a, 0x33];
const PAPER = [0xff, 0xf6, 0xe0];
const TILT = (-6 * Math.PI) / 180;
const CHECK = [[0.29, 0.52], [0.44, 0.67], [0.72, 0.36]];

function segDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.max(x0 + r, Math.min(x1 - r, x));
  const cy = Math.max(y0 + r, Math.min(y1 - r, y));
  return Math.hypot(x - cx, y - cy) <= r;
}

/**
 * @param size  pixels
 * @param inset tile margin as a fraction of size
 * @param bg    full-bleed background colour, or null for transparent
 */
function draw(size, inset, bg) {
  const png = new PNG({ width: size, height: size });
  const SS = 4; // supersampling
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          // Normalised coords, rotated about the centre to tilt the tile.
          const nx = (px + (sx + 0.5) / SS) / size - 0.5;
          const ny = (py + (sy + 0.5) / SS) / size - 0.5;
          const x = nx * Math.cos(-TILT) - ny * Math.sin(-TILT) + 0.5;
          const y = nx * Math.sin(-TILT) + ny * Math.cos(-TILT) + 0.5;
          // Scale shapes into the inset tile area.
          const u = (x - inset) / (1 - 2 * inset - 0.04);
          const v = (y - inset) / (1 - 2 * inset - 0.04);
          let c = bg, ca = bg ? 1 : 0;
          // Hard "sticker" shadow, offset down-right.
          if (inRoundRect(u - 0.06, v - 0.06, 0, 0, 1, 1, 0.24)) { c = INK; ca = 1; }
          if (inRoundRect(u, v, 0, 0, 1, 1, 0.24)) {
            // Thick ink outline around the tile.
            const B = 0.055;
            c = inRoundRect(u, v, B, B, 1 - B, 1 - B, 0.24 - B) ? TILE : INK; ca = 1;
            const d = Math.min(segDist(u, v, CHECK[0], CHECK[1]), segDist(u, v, CHECK[1], CHECK[2]));
            if (d < 0.065 && inRoundRect(u, v, 0.055, 0.055, 0.945, 0.945, 0.185)) c = INK;
          }
          if (ca) { r += c[0]; g += c[1]; b += c[2]; a += 1; }
        }
      }
      const i = (py * size + px) * 4;
      const n = SS * SS;
      png.data[i] = a ? r / a : 0;
      png.data[i + 1] = a ? g / a : 0;
      png.data[i + 2] = a ? b / a : 0;
      png.data[i + 3] = Math.round((a / n) * 255);
    }
  }
  return PNG.sync.write(png);
}

mkdirSync('public/icons', { recursive: true });
const out = {
  'public/icons/icon-192.png': draw(192, 0.06, null),
  'public/icons/icon-512.png': draw(512, 0.06, null),
  // Maskable: full-bleed background, tile inside the 80% safe zone.
  'public/icons/maskable-512.png': draw(512, 0.2, PAPER),
  'public/icons/apple-touch-icon.png': draw(180, 0.12, PAPER),
  'public/icons/favicon-48.png': draw(48, 0.04, null),
};
for (const [file, buf] of Object.entries(out)) {
  writeFileSync(file, buf);
  console.log('wrote', file, buf.length, 'bytes');
}
