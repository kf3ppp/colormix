import { useCallback, useEffect, useState } from 'react'
import type { Drops } from '@/lib/color'

export interface SavedColor {
  id: string
  hex: string
  name: string
  drops: Drops
  createdAt: number
}

const KEY = 'mazaj-discovered-colors'

function load(): SavedColor[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SavedColor[]) : []
  } catch {
    return []
  }
}

export function useSavedColors() {
  const [colors, setColors] = useState<SavedColor[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(colors))
    } catch {
      /* storage unavailable */
    }
  }, [colors])

  const save = useCallback((c: Omit<SavedColor, 'id' | 'createdAt'>) => {
    setColors(prev => {
      if (prev.some(p => p.hex === c.hex)) return prev
      return [{ ...c, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() }, ...prev]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setColors(prev => prev.filter(c => c.id !== id))
  }, [])

  const isSaved = useCallback((hex: string) => colors.some(c => c.hex === hex), [colors])

  return { colors, save, remove, isSaved }
}
