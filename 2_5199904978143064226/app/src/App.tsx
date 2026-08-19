import { useState } from 'react'
import { Droplets, Image, SwatchBook } from 'lucide-react'
import { Mixer } from '@/sections/Mixer'
import { ImageLab } from '@/sections/ImageLab'
import { Palette } from '@/sections/Palette'
import { useSavedColors } from '@/hooks/useSavedColors'

type Tab = 'mixer' | 'image' | 'palette'

function Logo() {
  return (
    <div className="relative h-14 w-14 shrink-0">
      <span className="absolute right-0 top-0 h-8 w-8 rounded-full bg-[#457BFF]/70 mix-blend-multiply" />
      <span className="absolute bottom-0 right-3 h-8 w-8 rounded-full bg-[#FFD93D]/70 mix-blend-multiply" />
      <span className="absolute left-0 top-2.5 h-8 w-8 rounded-full bg-[#E63946]/70 mix-blend-multiply" />
    </div>
  )
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'mixer', label: 'مزج الألوان', icon: <Droplets className="h-4 w-4" /> },
  { id: 'image', label: 'من صورة', icon: <Image className="h-4 w-4" /> },
  { id: 'palette', label: 'المكتشفة', icon: <SwatchBook className="h-4 w-4" /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('mixer')
  const { colors, save, remove, isSaved } = useSavedColors()

  return (
    <div className="app-wash min-h-screen">
      {/* Header */}
      <header className="border-b border-[#EEF0F6] bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Logo />
          <div>
            <h1 className="text-2xl font-black text-[#1F2430]">مازج الألوان</h1>
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#8A8FA3]">
              اكتشف . امزج . ابتكر
              <span className="mr-1 flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E63946]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFD93D]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#457BFF]" />
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="mx-auto max-w-5xl px-4 pt-5">
        <div className="card-soft flex gap-1 p-1.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-extrabold transition ${
                tab === t.id
                  ? 'bg-[#9B59B6] text-white shadow-lg shadow-[#9B59B6]/25'
                  : 'text-[#8A8FA3] hover:bg-[#F6F7FB] hover:text-[#1F2430]'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'palette' && colors.length > 0 && (
                <span className={`font-num rounded-full px-1.5 text-[10px] ${tab === t.id ? 'bg-white/25' : 'bg-[#F0F1F6]'}`}>
                  {colors.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'mixer' && <Mixer onSave={save} isSaved={isSaved} />}
        {tab === 'image' && <ImageLab onSave={save} isSaved={isSaved} />}
        {tab === 'palette' && <Palette colors={colors} onRemove={remove} />}
      </main>

      {/* Footer: UI elements strip like the brand board */}
      <footer className="mx-auto max-w-5xl px-4 pb-8">
        <div className="card-soft flex flex-wrap items-center justify-center gap-3 px-5 py-4">
          {['#E63946', '#F26F41', '#FFD93D', '#B8E62E', '#2ECC71', '#41D8D8', '#457BFF', '#5B8DEF', '#9B59B6', '#E6E9EE'].map(c => (
            <span key={c} className="droplet inline-block h-5 w-4" style={{ backgroundColor: c }} />
          ))}
          <span className="mx-2 h-4 w-px bg-[#E8EAF2]" />
          <p className="text-xs font-bold text-[#8A8FA3]">
            مزج الألوان الأساسية (الأحمر – الأزرق – الأصفر) لتوليد جميع الألوان واكتشاف تدرجات جديدة بأسلوب مائي طبيعي
          </p>
        </div>
      </footer>
    </div>
  )
}
