import { useCallback, useEffect, useRef, useState } from 'react'
import { Crosshair, Droplet, ImagePlus, RefreshCw } from 'lucide-react'
import { ColorBlob } from '@/components/ColorBlob'
import { ColorDetails } from '@/components/ColorDetails'
import { PIGMENTS, colorName, deduceRecipe, rgbToHex, type RGB, type Recipe } from '@/lib/color'
import type { SavedColor } from '@/hooks/useSavedColors'

interface Props {
  onSave: (c: Omit<SavedColor, 'id' | 'createdAt'>) => void
  isSaved: (hex: string) => boolean
}

export function ImageLab({ onSave, isSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [picked, setPicked] = useState<RGB | null>(null)
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const drawImage = useCallback((url: string) => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const maxW = 640
      const scale = Math.min(1, maxW / img.width)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setPicked(null)
      setRecipe(null)
      setMarker(null)
    }
    img.src = url
  }, [])

  const handleFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImageUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    drawImage(url)
  }, [drawImage])

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl) }, [imageUrl])

  const pickColor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    // average a 9×9 region around the click for stability
    const size = 9
    const data = ctx.getImageData(
      Math.max(0, x - 4), Math.max(0, y - 4),
      Math.min(size, canvas.width - Math.max(0, x - 4)),
      Math.min(size, canvas.height - Math.max(0, y - 4)),
    ).data
    let r = 0, g = 0, b = 0, n = 0
    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++ }
    const rgb: RGB = { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
    setPicked(rgb)
    setMarker({ x: (x / canvas.width) * 100, y: (y / canvas.height) * 100 })
    setRecipe(deduceRecipe(rgb))
  }

  const pickedHex = picked ? rgbToHex(picked) : null

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* ---- Upload & pick ---- */}
      <div className="card-soft p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-[#1F2430]">
            <ImagePlus className="h-5 w-5 text-[#9B59B6]" />
            استخراج لون من صورة
          </h3>
          {imageUrl && (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8EAF2] px-3 py-1.5 text-xs font-bold text-[#4A4F63] transition hover:border-[#9B59B6] hover:text-[#9B59B6]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              صورة أخرى
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />

        {!imageUrl ? (
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
            className={`flex h-72 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed transition ${
              dragOver ? 'border-[#9B59B6] bg-[#9B59B6]/5' : 'border-[#D9DCE6] bg-[#FAFBFD] hover:border-[#9B59B6]'
            }`}
          >
            <span className="blob blob-3 watercolor flex h-16 w-16 items-center justify-center bg-[#9B59B6]/15">
              <ImagePlus className="h-7 w-7 text-[#9B59B6]" />
            </span>
            <p className="text-sm font-extrabold text-[#1F2430]">ارفع صورة أو اسحبها هنا</p>
            <p className="text-xs text-[#8A8FA3]">ثم انقر على أي نقطة في الصورة لالتقاط لونها</p>
          </button>
        ) : (
          <div className="pop-in">
            <div className="relative overflow-hidden rounded-3xl border border-[#EEF0F6] bg-[#FAFBFD]">
              <canvas
                ref={canvasRef}
                onClick={pickColor}
                className="block w-full cursor-crosshair"
              />
              {marker && (
                <span
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                >
                  <span
                    className="block h-8 w-8 rounded-full border-[3px] border-white shadow-lg ring-2 ring-[#1F2430]/40"
                    style={{ backgroundColor: pickedHex ?? 'transparent' }}
                  />
                  <Crosshair className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
                </span>
              )}
            </div>
            <p className="mt-3 text-center text-xs font-bold text-[#8A8FA3]">
              انقر على الصورة لالتقاط اللون وسيستنتج المازج مكوّناته تلقائيًا
            </p>
          </div>
        )}

        {/* Picked swatch */}
        {picked && (
          <div className="pop-in mt-4 flex items-center gap-4 rounded-2xl bg-[#FAFBFD] p-4">
            <ColorBlob color={pickedHex!} className="h-16 w-16" variant={3} />
            <div className="flex-1">
              <p className="text-sm font-extrabold text-[#1F2430]">اللون الملتقط</p>
              <p className="font-num text-xs font-bold text-[#8A8FA3]" dir="ltr">
                {pickedHex} · RGB {picked.r}, {picked.g}, {picked.b}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ---- Deduction result ---- */}
      <div className="space-y-5">
        {picked && recipe ? (
          <>
            <div className="card-soft pop-in p-5">
              <h3 className="mb-1 flex items-center gap-2 text-base font-extrabold text-[#1F2430]">
                <Droplet className="h-4 w-4 text-[#E63946]" />
                الوصفة المستنتجة
              </h3>
              <p className="mb-4 text-xs text-[#8A8FA3]">هذه هي القطرات التي ينشأ منها هذا اللون</p>

              <div className="mb-4 flex items-center justify-center gap-4">
                <div className="text-center">
                  <ColorBlob color={pickedHex!} className="h-16 w-16" variant={1} />
                  <p className="mt-1 text-[11px] font-bold text-[#8A8FA3]">الهدف</p>
                </div>
                <span className="text-xl font-extrabold text-[#B4B9CA]">≈</span>
                <div className="text-center">
                  <ColorBlob color={rgbToHex(recipe.mixed)} className="h-16 w-16" variant={2} />
                  <p className="mt-1 text-[11px] font-bold text-[#8A8FA3]">الوصفة</p>
                </div>
              </div>

              <div className="space-y-2">
                {PIGMENTS.filter(p => (recipe.drops[p.id] ?? 0) > 0).map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl bg-[#FAFBFD] px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm font-bold text-[#1F2430]">
                      <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: p.hex }} />
                      {p.name}
                    </span>
                    <span className="flex items-center gap-1">
                      {Array.from({ length: recipe.drops[p.id] }).map((_, i) => (
                        <Droplet key={i} className="h-4 w-4" style={{ color: p.hex, fill: p.hex }} />
                      ))}
                      <span className="font-num mr-1 text-xs font-bold text-[#8A8FA3]" dir="ltr">
                        ×{recipe.drops[p.id]}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-center text-[11px] text-[#B4B9CA]">
                دقة التطابق {Math.max(0, Math.round(100 - recipe.distance))}%
              </p>
            </div>

            <ColorDetails
              hex={pickedHex!}
              drops={recipe.drops}
              onSave={() => onSave({ hex: pickedHex!, name: `لون ${colorName(picked)}`, drops: recipe.drops })}
              saved={isSaved(pickedHex!)}
            />
          </>
        ) : (
          <div className="card-soft flex h-full min-h-72 flex-col items-center justify-center gap-3 p-5 text-center">
            <span className="blob watercolor flex h-20 w-20 items-center justify-center bg-[#457BFF]/10">
              <Crosshair className="h-8 w-8 text-[#457BFF]" />
            </span>
            <p className="text-sm font-extrabold text-[#1F2430]">بانتظار التقاط لون</p>
            <p className="max-w-64 text-xs leading-6 text-[#8A8FA3]">
              ارفع صورة ثم انقر على اللون الذي يعجبك، وسيكشف لك المازج الألوان الأساسية وعدد القطرات التي تكوّنه.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
