import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'shieldai:sidebar-collapsed'

/**
 * Shared, persisted collapsed state for the app sidebar so the user's
 * preference is consistent across every page (AppShell pages + Chat).
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false)

  // Hydrate from localStorage after mount (avoids SSR markup mismatch).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored !== null) setCollapsed(stored === '1')
    } catch {
      /* localStorage unavailable — keep default */
    }
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore persistence failures */
      }
      return next
    })
  }, [])

  return { collapsed, toggle }
}
