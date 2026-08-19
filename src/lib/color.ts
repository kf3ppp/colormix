// ---------- Color engine for مازج الألوان ----------
// Subtractive-style pigment mixing using a per-channel weighted geometric mean,
// which behaves like watercolor/gouache: red+blue→purple, blue+yellow→green, etc.

export interface RGB { r: number; g: number; b: number }

export interface Pigment {
  id: string
  name: string
  hex: string
  rgb: RGB
}

export const PIGMENTS: Pigment[] = [
  { id: 'red',    name: 'الأحمر',  hex: '#E63946', rgb: { r: 230, g: 57,  b: 70  } },
  { id: 'blue',   name: 'الأزرق',  hex: '#457BFF', rgb: { r: 69,  g: 123, b: 255 } },
  { id: 'yellow', name: 'الأصفر',  hex: '#FFD93D', rgb: { r: 255, g: 217, b: 61  } },
  { id: 'green',  name: 'الأخضر',  hex: '#2ECC71', rgb: { r: 46,  g: 204, b: 113 } },
  { id: 'purple', name: 'البنفسجي', hex: '#9B59B6', rgb: { r: 155, g: 89, b: 182 } },
  { id: 'white',  name: 'الأبيض',  hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
  { id: 'black',  name: 'الأسود',  hex: '#23272F', rgb: { r: 35,  g: 39,  b: 47  } },
]

/** Pigments offered by default in the mixer tray (like real paint: primaries + white/black) */
export const DEFAULT_TRAY = ['red', 'blue', 'yellow']

export type Drops = Record<string, number>

export const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)))

export function rgbToHex({ r, g, b }: RGB): string {
  const h = (v: number) => clamp255(v).toString(16).padStart(2, '0').toUpperCase()
  return `#${h(r)}${h(g)}${h(b)}`
}

export function hexToRgb(hex: string): RGB {
  const m = hex.replace('#', '')
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  }
}

/** Mix pigments with given drop counts. Counts of 0 are ignored. */
export function mixColors(drops: Drops): RGB {
  const entries = PIGMENTS.filter(p => (drops[p.id] ?? 0) > 0)
  if (entries.length === 0) return { r: 255, g: 255, b: 255 }
  const total = entries.reduce((s, p) => s + (drops[p.id] ?? 0), 0)
  let lr = 0, lg = 0, lb = 0
  for (const p of entries) {
    const w = (drops[p.id] ?? 0) / total
    lr += w * Math.log(Math.max(p.rgb.r, 1))
    lg += w * Math.log(Math.max(p.rgb.g, 1))
    lb += w * Math.log(Math.max(p.rgb.b, 1))
  }
  return { r: clamp255(Math.exp(lr)), g: clamp255(Math.exp(lg)), b: clamp255(Math.exp(lb)) }
}

// ---------- Color-space conversions ----------

export function rgbToCmyk({ r, g, b }: RGB): { c: number; m: number; y: number; k: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  }
}

export function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  let h = 0, s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break
      case gn: h = (bn - rn) / d + 2; break
      default: h = (rn - gn) / d + 4
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let rn = 0, gn = 0, bn = 0
  if (h < 60) { rn = c; gn = x }
  else if (h < 120) { rn = x; gn = c }
  else if (h < 180) { gn = c; bn = x }
  else if (h < 240) { gn = x; bn = c }
  else if (h < 300) { rn = x; bn = c }
  else { rn = c; bn = x }
  return { r: clamp255((rn + m) * 255), g: clamp255((gn + m) * 255), b: clamp255((bn + m) * 255) }
}

/** Rotate the hue of a color by `deg` degrees (used by the result-tuning wheel). */
export function rotateHue(rgb: RGB, deg: number): RGB {
  if (deg === 0) return rgb
  const { h, s, l } = rgbToHsl(rgb)
  return hslToRgb((h + deg + 360) % 360, s, l)
}

/** Lighten (positive) or darken (negative) a color by percentage points. */
export function shiftLightness(rgb: RGB, points: number): RGB {
  if (points === 0) return rgb
  const { h, s, l } = rgbToHsl(rgb)
  return hslToRgb(h, s, Math.max(0, Math.min(100, l + points)))
}

function rgbToLab({ r, g, b }: RGB): [number, number, number] {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const R = lin(r), G = lin(g), B = lin(b)
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  x = f(x); y = f(y); z = f(z)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

function labDistance(a: RGB, b: RGB): number {
  const [l1, a1, b1] = rgbToLab(a)
  const [l2, a2, b2] = rgbToLab(b)
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
}

// ---------- Reverse deduction ----------
// Given a target color, search drop counts for each pigment (total 1..8)
// that reproduce it most closely (CIE76 in Lab space).

export interface Recipe {
  drops: Drops
  mixed: RGB
  distance: number
}

export function deduceRecipe(target: RGB): Recipe {
  let best: Recipe | null = null
  const MAX_TOTAL = 8
  const ids = PIGMENTS.map(p => p.id)
  const n = ids.length
  const counts = new Array(n).fill(0)

  const evaluate = () => {
    // skip neutral-only recipes (white/black alone) — not useful
    const chromatic = counts.slice(0, 5).reduce((s, c) => s + c, 0)
    if (chromatic === 0) return
    const drops: Drops = {}
    ids.forEach((id, i) => { if (counts[i] > 0) drops[id] = counts[i] })
    const mixed = mixColors(drops)
    const distance = labDistance(mixed, target)
    if (!best || distance < best.distance) best = { drops, mixed, distance }
  }

  const search = (idx: number, remaining: number) => {
    if (idx === n - 1) {
      counts[idx] = remaining
      evaluate()
      return
    }
    for (let c = 0; c <= remaining; c++) {
      counts[idx] = c
      search(idx + 1, remaining - c)
    }
  }

  for (let total = 1; total <= MAX_TOTAL; total++) search(0, total)
  return best!
}

// ---------- Arabic color naming ----------

const HUE_NAMES: [number, string][] = [
  [15, 'أحمر'], [40, 'برتقالي'], [65, 'أصفر'], [90, 'أخضر ليموني'],
  [150, 'أخضر'], [185, 'فيروزي'], [215, 'سماوي'], [255, 'أزرق'],
  [290, 'بنفسجي'], [330, 'أرجواني'], [360, 'أحمر وردي'],
]

export function colorName(rgb: RGB): string {
  const { h, s, l } = rgbToHsl(rgb)
  if (l >= 93) return 'أبيض نقي'
  if (l <= 8) return 'أسود عميق'
  if (s <= 12) {
    if (l >= 75) return 'رمادي فاتح'
    if (l >= 35) return 'رمادي هادئ'
    return 'رمادي داكن'
  }
  let name = 'أحمر'
  for (const [limit, n] of HUE_NAMES) {
    if (h <= limit) { name = n; break }
  }
  let tone = ''
  if (l >= 78) tone = 'فاتح جدًا'
  else if (l >= 62) tone = 'فاتح'
  else if (l <= 22) tone = 'داكن جدًا'
  else if (l <= 38) tone = 'داكن'
  else if (s <= 45) tone = 'هادئ'
  else if (s >= 85) tone = 'زاهٍ'
  return tone ? `${name} ${tone}` : name
}

export function totalDrops(drops: Drops): number {
  return Object.values(drops).reduce((s, v) => s + v, 0)
}

export function dropPercentages(drops: Drops): Record<string, number> {
  const total = totalDrops(drops)
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(drops)) out[k] = Math.round((v / total) * 100)
  return out
}
