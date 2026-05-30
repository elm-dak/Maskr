// One-off icon generator for Maskr. Renders the logo (cream bg, a black square
// rotated -6deg, red square inside) to PNGs at the sizes mobile browsers need.
// Pure Node: raw RGBA pixels -> zlib deflate -> PNG chunks. No deps.
// Run: node gen-icons.cjs
const zlib = require("zlib");
const fs = require("fs");

const CREAM = [0xf4, 0xef, 0xe6];
const BLACK = [0x0a, 0x0a, 0x0a];
const RED   = [0xff, 0x4d, 0x2e];

// Rotate point (x,y) by +6deg about (50,50) — inverse of the SVG's rotate(-6).
const ANG = (6 * Math.PI) / 180;
const COS = Math.cos(ANG), SIN = Math.sin(ANG);
function colorAt(vx, vy) {
  // inverse-rotate into the un-rotated shape space
  const dx = vx - 50, dy = vy - 50;
  const rx = dx * COS - dy * SIN + 50;
  const ry = dx * SIN + dy * COS + 50;
  if (rx >= 34 && rx <= 66 && ry >= 34 && ry <= 66) return RED;
  if (rx >= 20 && rx <= 80 && ry >= 20 && ry <= 80) return BLACK;
  return CREAM;
}

function render(size) {
  const SS = 4; // supersample for anti-aliasing
  const buf = Buffer.alloc(size * (size * 4 + 1)); // +1 filter byte per row
  let p = 0;
  for (let y = 0; y < size; y++) {
    buf[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const vx = ((x + (sx + 0.5) / SS) / size) * 100;
          const vy = ((y + (sy + 0.5) / SS) / size) * 100;
          const c = colorAt(vx, vy);
          r += c[0]; g += c[1]; b += c[2];
        }
      const n = SS * SS;
      buf[p++] = Math.round(r / n);
      buf[p++] = Math.round(g / n);
      buf[p++] = Math.round(b / n);
      buf[p++] = 255;
    }
  }
  return buf;
}

const CRC = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(body), 0);
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const idat = zlib.deflateSync(render(size), { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const s of [32, 180, 192, 512]) {
  const name = s === 180 ? "apple-touch-icon.png" : `icon-${s}.png`;
  fs.writeFileSync(name, png(s));
  console.log("wrote", name);
}
