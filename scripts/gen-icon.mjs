// Generates the plugin icon at .claude-plugin/icon.png (1024x1024, RGBA PNG).
//
// Design: a rounded square with a diagonal indigo->violet gradient and a bold
// white check mark. Pure Node (zlib + a small PNG encoder), no dependencies.
//
//   node scripts/gen-icon.mjs

import { deflateSync } from "node:zlib"
import { writeFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const W = 1024
const H = 1024

// Palette
const top = [139, 92, 246] // violet-500
const bottom = [67, 56, 202] // indigo-700

// Check mark geometry (normalized coordinates)
const p1 = [0.28 * W, 0.53 * H]
const p2 = [0.45 * W, 0.70 * H]
const p3 = [0.74 * W, 0.36 * H]
const thickness = 0.085 * W

// Rounded-corner radius
const R = 0.22 * W

function sdSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)))
  const dx = px - (ax + t * abx)
  const dy = py - (ay + t * aby)
  return Math.sqrt(dx * dx + dy * dy)
}

function pixel(x, y) {
  // Diagonal gradient background
  const t = (x + y) / (2 * (W - 1))
  let r = Math.round(top[0] + (bottom[0] - top[0]) * t)
  let g = Math.round(top[1] + (bottom[1] - top[1]) * t)
  let b = Math.round(top[2] + (bottom[2] - top[2]) * t)

  // Rounded-rectangle signed distance (for transparent corners + AA)
  const qx = Math.abs(x - W / 2) - (W / 2 - R)
  const qy = Math.abs(y - H / 2) - (H / 2 - R)
  const dx = Math.max(qx, 0)
  const dy = Math.max(qy, 0)
  const rectDist = Math.sqrt(dx * dx + dy * dy) - R
  const rectCov = Math.max(0, Math.min(1, 0.5 - rectDist))
  if (rectCov <= 0) return [0, 0, 0, 0]

  // White check mark
  const checkDist =
    Math.min(
      sdSegment(x, y, p1[0], p1[1], p2[0], p2[1]),
      sdSegment(x, y, p2[0], p2[1], p3[0], p3[1]),
    ) -
    thickness / 2
  const checkCov = Math.max(0, Math.min(1, 0.5 - checkDist))

  r = Math.round(r + (255 - r) * checkCov)
  g = Math.round(g + (255 - g) * checkCov)
  b = Math.round(b + (255 - b) * checkCov)

  return [r, g, b, Math.round(rectCov * 255)]
}

// --- PNG encoding ---

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii")
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

const raw = Buffer.alloc((W * 4 + 1) * H)
for (let y = 0; y < H; y++) {
  const rowStart = y * (W * 4 + 1)
  raw[rowStart] = 0 // filter: none
  for (let x = 0; x < W; x++) {
    const [r, g, b, a] = pixel(x, y)
    const o = rowStart + 1 + x * 4
    raw[o] = r
    raw[o + 1] = g
    raw[o + 2] = b
    raw[o + 3] = a
  }
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
])

const out = resolve(root, ".claude-plugin/icon.png")
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, png)
console.log(`wrote ${out} (${png.length} bytes)`)
