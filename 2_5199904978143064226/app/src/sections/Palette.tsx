import { useState } from 'react'
import { ChevronDown, Droplets, Trash2 } from 'lucide-react'
import { ColorBlob } from '@/components/ColorBlob'
import { ColorDetails } from '@/components/ColorDetails'
import type { SavedColor } from '@/hooks/useSavedColors'

interface Props {
  colors: SavedColor[]
  onRemove: (id: string) => void
}

export function Palette({ colors, onRemove }: Props) {
  const [selected, setSelected] = useState<SavedColor | null>(null)
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? colors : colors.slice(0, 12)

  if (colors.length === 0) {
    return (
      <div className="card-soft flex min-h-96 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="blob blob-2 watercolor flex h-20 w-20 items-center justify-center bg-[#2ECC71]/10">
          <Droplets className="h-8 w-8 text-[#2ECC71]" />
        </span>
        <p className="text-base font-extrabold text-[#1F2430]">لوحة الألوان المكتشفة فارغة</p>
        <p className="max-w-72 text-sm leading-7 text-[#8A8FA3]">
          امزج الألوان أو التقط لونًا من صورة واحفظه، وستظهر اكتشافاتك هنا.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card-soft p-5">
        <h3 className="mb-4 text-base font-extrabold text-[#1F2430]">لوحة الألوان المكتشفة</h3>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          {visible.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="group flex flex-col items-center gap-1.5"
            >
              <ColorBlob
                color={c.hex}
                variant={((i % 3) + 1) as 1 | 2 | 3}
                className={`h-16 w-16 transition group-hover:scale-110 ${
                  selected?.id === c.id ? 'ring-2 ring-[#9B59B6] ring-offset-2' : ''
                }`}
              />
              <span className="font-num text-[10px] font-bold text-[#8A8FA3]" dir="ltr">{c.hex}</span>
            </button>
          ))}
        </div>
        {colors.length > 12 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#E8EAF2] py-2.5 text-xs font-bold text-[#4A4F63] transition hover:border-[#9B59B6] hover:text-[#9B59B6]"
          >
            {showAll ? 'عرض أقل' : 'عرض المزيد'}
            <ChevronDown className={`h-4 w-4 transition ${showAll ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <div>
        {selected ? (
          <div className="space-y-3">
            <ColorDetails hex={selected.hex} drops={selected.drops} />
            <button
              onClick={() => { onRemove(selected.id); setSelected(null) }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E8EAF2] py-2.5 text-xs font-bold text-[#E63946] transition hover:border-[#E63946]"
            >
              <Trash2 className="h-4 w-4" />
              حذف من اللوحة
            </button>
          </div>
        ) : (
          <div className="card-soft flex min-h-72 flex-col items-center justify-center gap-2 p-5 text-center">
            <Droplets className="h-8 w-8 text-[#B4B9CA]" />
            <p className="text-sm font-bold text-[#8A8FA3]">اختر لونًا من اللوحة لعرض تفاصيله ووصفته</p>
          </div>
        )}
      </div>
    </div>
  )
}
