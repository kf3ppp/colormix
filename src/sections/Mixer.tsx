import { useMemo, useState } from 'react'
import { Droplet, Minus, Plus, RotateCcw, Shuffle } from 'lucide-react'
import { ColorBlob } from '@/components/ColorBlob'
import { ColorDetails } from '@/components/ColorDetails'
import {
  PIGMENTS, mixColors, rgbToHex, rotateHue, shiftLightness,
  colorName, type Drops, DEFAULT_TRAY, totalDrops,
} from '@/lib/color'
import type { SavedColor } from '@/hooks/useSavedColors'

const MAX_DROPS = 8

interface Props {
  onSave: (c: Omit<SavedColor, 'id' | 'createdAt'>) => void
  isSaved: (hex: string) => boolean
}

function DropletCounter({ count, color, onChange }: { count: number; color: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, count - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E8EAF2] bg-white text-[#4A4F63] transition hover:border-[#9B59B6] hover:text-[#9B59B6] disabled:opacity-40"
        disabled={count === 0}
        aria-label="إنقاص"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_DROPS }).map((_, i) => (
          <Droplet
            key={i}
            className="h-4 w-4 transition-all"
            style={{
              color: i < count ? color : '#E3E5EE',
              fill: i < count ? color : 'transparent',
            }}
          />
        ))}
      </div>
      <button
        onClick={() => onChange(Math.min(MAX_DROPS, count + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E8EAF2] bg-white text-[#4A4F63] transition hover:border-[#9B59B6] hover:text-[#9B59B6] disabled:opacity-40"
        disabled={count === MAX_DROPS}
        aria-label="زيادة"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Mixer({ onSave, isSaved }: Props) {
  const [tray, setTray] = useState<string[]>(DEFAULT_TRAY)
  const [drops, setDrops] = useState<Drops>({ red: 2, blue: 3, yellow: 0 })
  const [hueShift, setHueShift] = useState(0)
  const [lightShift, setLightShift] = useState(0)

  const baseMixed = useMemo(() => mixColors(drops), [drops])
  const mixed = useMemo(
    () => shiftLightness(rotateHue(baseMixed, hueShift), lightShift),
    [baseMixed, hueShift, lightShift],
  )
  const hex = rgbToHex(mixed)
  const name = colorName(mixed)
  const active = totalDrops(drops) > 0

  const toggleTray = (id: string) => {
    setTray(prev => {
      if (prev.includes(id)) {
        setDrops(d => ({ ...d, [id]: 0 }))
        return prev.filter(p => p !== id)
      }
      return [...prev, id]
    })
  }

  const randomize = () => {
    const next: Drops = {}
    for (const id of tray) next[id] = Math.floor(Math.random() * (MAX_DROPS + 1))
    if (totalDrops(next) === 0) next[tray[0]] = 1 + Math.floor(Math.random() * 4)
    setDrops(next)
    setHueShift(0)
    setLightShift(0)
  }

  const reset = () => {
    const next: Drops = {}
    for (const id of tray) next[id] = 0
    setDrops(next)
    setHueShift(0)
    setLightShift(0)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* ---- Mixing card ---- */}
      <div className="card-soft p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#1F2430]">اختر الألوان</h3>
          <span className="text-xs font-bold text-[#8A8FA3]">نسبة المزج (قطرات)</span>
        </div>

        {/* Pigment picker */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {PIGMENTS.map(p => {
            const selected = tray.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggleTray(p.id)}
                title={p.name}
                className={`relative h-11 w-11 rounded-full transition-all ${
                  selected ? 'scale-110 ring-2 ring-[#1F2430] ring-offset-2' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: p.hex, border: p.id === 'white' ? '1px solid #E3E5EE' : 'none' }}
              >
                {selected && <span className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-[#2ECC71] ring-2 ring-white" />}
              </button>
            )
          })}
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-[#D9DCE6] text-[#B4B9CA]">
            <Plus className="h-5 w-5" />
          </span>
        </div>

        {/* Drop counters */}
        <div className="space-y-3">
          {PIGMENTS.filter(p => tray.includes(p.id)).map(p => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FAFBFD] px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-bold text-[#1F2430]">
                <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: p.hex }} />
                {p.name}
              </span>
              <DropletCounter
                count={drops[p.id] ?? 0}
                color={p.hex}
                onChange={v => setDrops(d => ({ ...d, [p.id]: v }))}
              />
            </div>
          ))}
        </div>

        {/* Result preview */}
        <div className="mt-5 border-t border-[#F0F1F6] pt-4">
          <p className="mb-3 text-center text-sm font-bold text-[#8A8FA3]">معاينة النتيجة</p>
          <div className="flex flex-col items-center gap-3">
            <ColorBlob
              color={active ? hex : '#E6E9EE'}
              className="blob-float h-28 w-52 shadow-lg"
              variant={1}
            />
            <p className="text-base font-extrabold text-[#1F2430]">{active ? `لون ${name}` : 'أضف قطرات للبدء'}</p>
            <p className="font-num text-sm font-bold text-[#8A8FA3]" dir="ltr">{active ? hex : '#E6E9EE'}</p>
          </div>

          {/* Result tuning */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs font-bold text-[#8A8FA3]">
                <span>تعديل درجة اللون</span>
                <span className="font-num" dir="ltr">{hueShift > 0 ? `+${hueShift}°` : `${hueShift}°`}</span>
              </div>
              <input
                type="range" min={-180} max={180} value={hueShift}
                onChange={e => setHueShift(Number(e.target.value))}
                className="w-full accent-[#9B59B6]"
                style={{
                  background: 'linear-gradient(to left, #E63946, #FFD93D, #2ECC71, #457BFF, #9B59B6, #E63946)',
                  height: 8, borderRadius: 8, appearance: 'none', outline: 'none',
                }}
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs font-bold text-[#8A8FA3]">
                <span>تفتيح / تعتيم</span>
                <span className="font-num" dir="ltr">{lightShift > 0 ? `+${lightShift}%` : `${lightShift}%`}</span>
              </div>
              <input
                type="range" min={-40} max={40} value={lightShift}
                onChange={e => setLightShift(Number(e.target.value))}
                className="w-full accent-[#23272F]"
                style={{
                  background: 'linear-gradient(to left, #ffffff, #23272F)',
                  height: 8, borderRadius: 8, appearance: 'none', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={randomize}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E8EAF2] bg-white py-3 text-sm font-extrabold text-[#1F2430] transition hover:border-[#9B59B6] hover:text-[#9B59B6]"
            >
              <Shuffle className="h-4 w-4" />
              عشوائي
            </button>
            <button
              onClick={() => active && onSave({ hex, name: `لون ${name}`, drops })}
              disabled={!active || isSaved(hex)}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#9B59B6] py-3 text-sm font-extrabold text-white shadow-lg shadow-[#9B59B6]/30 transition hover:bg-[#8A48A5] disabled:bg-[#D9DCE6] disabled:shadow-none"
            >
              <Droplet className="h-4 w-4 fill-current" />
              {isSaved(hex) ? 'محفوظ في المكتشفة' : 'احفظ اللون المكتشف'}
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#23272F] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#343A46]"
            >
              <RotateCcw className="h-4 w-4" />
              إعادة ضبط
            </button>
          </div>
        </div>
      </div>

      {/* ---- Details ---- */}
      <div className="space-y-5">
        <ColorDetails
          hex={active ? hex : '#E6E9EE'}
          drops={active ? drops : undefined}
          onSave={() => onSave({ hex, name: `لون ${name}`, drops })}
          saved={isSaved(hex)}
        />
        <div className="card-soft flex items-start gap-3 p-5">
          <Droplet className="mt-0.5 h-5 w-5 shrink-0 text-[#457BFF]" />
          <div>
            <p className="mb-1 text-sm font-extrabold text-[#1F2430]">نصيحة</p>
            <p className="text-sm leading-7 text-[#8A8FA3]">
              كل قطرة تضيف لمسة لونية جديدة. جرّب زيادة أو تقليل عدد القطرات للحصول على درجات مختلفة،
              وأضف الأبيض للتفتيح أو الأسود للتعتيم كما في الألوان المائية الحقيقية.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
