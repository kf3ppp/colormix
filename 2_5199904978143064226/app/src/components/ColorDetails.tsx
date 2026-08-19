import { useState } from 'react'
import { Check, Copy, Droplet, Heart, Pencil } from 'lucide-react'
import { ColorBlob } from '@/components/ColorBlob'
import {
  colorName, hexToRgb, rgbToCmyk, rgbToHsl,
  type Drops, PIGMENTS, dropPercentages,
} from '@/lib/color'

interface Props {
  hex: string
  drops?: Drops
  onSave?: () => void
  saved?: boolean
}

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-xl border border-[#E8EAF2] bg-white px-3 py-1.5 text-xs font-bold text-[#4A4F63] transition hover:border-[#9B59B6] hover:text-[#9B59B6]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#2ECC71]" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="font-num">{label}</span>
    </button>
  )
}

export function ColorDetails({ hex, drops, onSave, saved }: Props) {
  const rgb = hexToRgb(hex)
  const cmyk = rgbToCmyk(rgb)
  const hsl = rgbToHsl(rgb)
  const name = colorName(rgb)
  const pcts = drops ? dropPercentages(drops) : null

  return (
    <div className="card-soft pop-in p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-[#1F2430]">
          <Droplet className="h-4 w-4 text-[#457BFF]" />
          تفاصيل اللون
        </h3>
        <button className="rounded-lg p-1.5 text-[#B4B9CA] transition hover:bg-[#F6F7FB] hover:text-[#1F2430]">
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-start gap-4">
        <ColorBlob color={hex} className="h-24 w-24 shrink-0 shadow-inner" variant={2} />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-lg font-extrabold text-[#1F2430]">لون {name}</p>
          <p className="font-num text-sm font-bold text-[#4A4F63]" dir="ltr">{hex}</p>
          <p className="font-num text-xs text-[#8A8FA3]" dir="ltr">RGB {rgb.r}, {rgb.g}, {rgb.b}</p>
          <p className="font-num text-xs text-[#8A8FA3]" dir="ltr">CMYK {cmyk.c}, {cmyk.m}, {cmyk.y}, {cmyk.k}</p>
          <p className="font-num text-xs text-[#8A8FA3]" dir="ltr">HSL {hsl.h}°, {hsl.s}%, {hsl.l}%</p>
        </div>
      </div>

      {drops && pcts && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-[#8A8FA3]">وصفة المزج</p>
          <div className="space-y-1.5">
            {PIGMENTS.filter(p => (drops[p.id] ?? 0) > 0).map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: p.hex }} />
                <span className="w-14 text-xs font-bold text-[#4A4F63]">{p.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F0F1F6]">
                  <div className="h-full rounded-full" style={{ width: `${pcts[p.id]}%`, backgroundColor: p.hex }} />
                </div>
                <span className="font-num w-10 text-left text-xs font-bold text-[#8A8FA3]" dir="ltr">
                  {drops[p.id]}× · {pcts[p.id]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 mb-2 text-xs font-bold text-[#8A8FA3]">انسخ القيم</p>
      <div className="flex flex-wrap items-center gap-2" dir="ltr">
        <CopyChip label="HEX" value={hex} />
        <CopyChip label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
        <CopyChip label="CMYK" value={`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`} />
        <CopyChip label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
        {onSave && (
          <button
            onClick={onSave}
            disabled={saved}
            className={`mr-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              saved
                ? 'bg-[#F0F1F6] text-[#B4B9CA]'
                : 'bg-[#9B59B6] text-white hover:bg-[#8A48A5]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${saved ? '' : 'fill-current'}`} />
            {saved ? 'محفوظ' : 'حفظ اللون'}
          </button>
        )}
      </div>
    </div>
  )
}
