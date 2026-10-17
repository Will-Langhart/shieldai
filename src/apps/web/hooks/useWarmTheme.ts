import { useCallback, useEffect, useState } from 'react'

export type WarmThemePref = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'shieldai-chat-theme'
const ORDER: WarmThemePref[] = ['system', 'light', 'dark']

/**
 * Opts a page into the warm (Claude-like) palette defined by `.warm-theme` in
 * styles/globals.css. Pages put `warm-theme` + `themeAttr` on their root for
 * first paint; this hook also mirrors it onto <html> while mounted so portals
 * (modals) and overscroll areas match. The light/dark/system choice is shared
 * across pages via localStorage.
 */
export function useWarmTheme() {
  const [pref, setPref] = useState<WarmThemePref>('system')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') setPref(stored)
    } catch {}
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('warm-theme')
    if (pref === 'system') root.removeAttribute('data-warm-theme')
    else root.setAttribute('data-warm-theme', pref)
    return () => {
      root.classList.remove('warm-theme')
      root.removeAttribute('data-warm-theme')
    }
  }, [pref])

  const cycle = useCallback(() => {
    setPref(prev => {
      const next = ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length]
      try { localStorage.setItem(STORAGE_KEY, next) } catch {}
      return next
    })
  }, [])

  return {
    pref,
    cycle,
    /** Spread onto the page root alongside className="warm-theme". */
    themeAttr: { 'data-warm-theme': pref === 'system' ? undefined : pref },
  }
}
