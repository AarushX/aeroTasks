// Generates a 1024x1024 source app icon (PNG) with no external dependencies.
// A rounded blue square with a white checkmark — the source for `tauri icon`.
import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SIZE = 1024;
const px = new Uint8Array(SIZE * SIZE * 4);

const BLUE = [71, 114, 250];
const WHITE = [255, 255, 255];

function setPx(x, y, [r, g, b], a) {
  const i = (y * SIZE + x) * 4;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
  px[i + 3] = a;
}

// Signed distance helpers for crisp, anti-aliased shapes.
function roundedRectInside(x, y, pad, radius) {
  const min = pad;
  const max = SIZE - pad;
  const cx = Math.min(Math.max(x, min + radius), max - radius);
  const cy = Math.min(Math.max(y, min + radius), max - radius);
  const dx = x - cx;
  const dy = y - cy;
  return Math.sqrt(dx * dx + dy * dy) - radius; // <0 inside
}

function distToSegment(px_, py_, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = ((px_ - ax) * dx + (py_ - ay) * dy) / len2;
  t = Math.min(1, Math.max(0, t));
  const projx = ax + t * dx;
  const projy = ay + t * dy;
  return Math.hypot(px_ - projx, py_ - projy);
}

const aa = 1.2; // anti-alias falloff in px

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // Rounded square background
    const d = roundedRectInside(x + 0.5, y + 0.5, 80, 200);
    const bgA = Math.max(0, Math.min(1, 0.5 - d / aa));
    if (bgA > 0) setPx(x, y, BLUE, Math.round(bgA * 255));

    // Checkmark (two segments), white, only where over the blue body
    if (bgA > 0.01) {
      const d1 = distToSegment(x + 0.5, y + 0.5, 330, 540, 460, 680);
      const d2 = distToSegment(x + 0.5, y + 0.5, 460, 680, 710, 360);
      const dc = Math.min(d1, d2) - 38; // half-thickness
      const ckA = Math.max(0, Math.min(1, 0.5 - dc / aa));
      if (ckA > 0) {
        const i = (y * SIZE + x) * 4;
        const a = ckA;
        px[i] = Math.round(WHITE[0] * a + px[i] * (1 - a));
        px[i + 1] = Math.round(WHITE[1] * a + px[i + 1] * (1 - a));
        px[i + 2] = Math.round(WHITE[2] * a + px[i + 2] * (1 - a));
        px[i + 3] = Math.max(px[i + 3], Math.round(a * 255));
      }
    }
  }
}

// --- Minimal PNG encoder (RGBA, 8-bit) ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
let o = 0;
for (let y = 0; y < SIZE; y++) {
  raw[o++] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    raw[o++] = px[i];
    raw[o++] = px[i + 1];
    raw[o++] = px[i + 2];
    raw[o++] = px[i + 3];
  }
}

const idat = zlib.deflateSync(raw, { level: 9 });
const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const out = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

const dest = "scripts/icon-src.png";
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, out);
console.log(`Wrote ${dest} (${out.length} bytes)`);
