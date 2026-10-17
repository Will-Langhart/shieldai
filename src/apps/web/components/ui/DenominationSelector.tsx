import React, { useState, useEffect, useRef } from 'react'
import { Church, ChevronDown, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export type Denomination = 'Protestant' | 'Catholic' | 'Oriental Orthodox' | 'Eastern Orthodox'

const DENOMINATIONS: { value: Denomination; description: string }[] = [
  { value: 'Protestant',        description: 'Reformed, Baptist, Lutheran, evangelical traditions' },
  { value: 'Catholic',          description: 'Roman Catholic tradition & Magisterium' },
  { value: 'Oriental Orthodox', description: 'Coptic, Ethiopian, Armenian, Syriac churches' },
  { value: 'Eastern Orthodox',  description: 'Greek, Russian, Antiochian Orthodox churches' },
]

async function getToken(): Promise<string | null> {
  try {
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

interface DenominationSelectorProps {
  /** 'sidebar' = compact pill for sidebars; 'panel' = full-width card for settings panels;
   *  'pill' = inline chip for the chat composer (menu opens upward) */
  variant?: 'sidebar' | 'panel' | 'pill'
  onDenominationChange?: (denomination: Denomination | null) => void
}

export function DenominationSelector({
  variant = 'sidebar',
  onDenominationChange,
}: DenominationSelectorProps) {
  const [denomination, setDenomination] = useState<Denomination | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [noSession, setNoSession] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Load saved denomination on mount
  useEffect(() => {
    let cancelled = false
    getToken().then(token => {
      if (cancelled) return
      if (!token) { setNoSession(true); return }
      fetch('/api/user/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!cancelled && data?.preferences?.denomination) {
            setDenomination(data.preferences.denomination as Denomination)
          }
        })
        .catch(() => {})
    })
    return () => { cancelled = true }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const save = async (value: Denomination | null) => {
    setSaving(true)
    setStatus('idle')
    try {
      const token = await getToken()
      if (!token) {
        setNoSession(true)
        setStatus('error')
        return
      }

      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ denomination: value }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[DenominationSelector] save failed:', res.status, body)
        setStatus('error')
        return
      }

      setDenomination(value)
      onDenominationChange?.(value)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      console.error('[DenominationSelector] save error:', err)
      setStatus('error')
    } finally {
      setSaving(false)
      setOpen(false)
    }
  }

  if (variant === 'panel') {
    return (
      <div className="p-4 bg-shield-canvas rounded-lg border border-shield-edge space-y-3">
        <div className="flex items-center space-x-2">
          <Church className="w-4 h-4 text-shield-muted" />
          <span className="text-sm font-medium text-shield-fg">Christian Denomination</span>
          {status === 'saved' && (
            <span className="ml-auto text-xs text-shield-brand font-medium">Saved ✓</span>
          )}
          {status === 'error' && (
            <span className="ml-auto text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {noSession ? 'Sign in to save' : 'Save failed'}
            </span>
          )}
        </div>
        <p className="text-xs text-shield-muted">
          Shield AI tailors theological responses to your tradition.
        </p>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => save(null)}
            disabled={saving}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
              denomination === null
                ? 'border-shield-brand bg-shield-brand/10 text-shield-fg'
                : 'border-shield-edge text-shield-muted hover:border-shield-edge-strong hover:text-shield-fg'
            }`}
          >
            <span>No preference</span>
            {denomination === null && <Check className="w-3.5 h-3.5 text-shield-brand" />}
          </button>
          {DENOMINATIONS.map(d => (
            <button
              key={d.value}
              onClick={() => save(d.value)}
              disabled={saving}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                denomination === d.value
                  ? 'border-shield-brand bg-shield-brand/10 text-shield-fg'
                  : 'border-shield-edge text-shield-muted hover:border-shield-edge-strong hover:text-shield-fg'
              }`}
            >
              <div className="text-left">
                <div className="font-medium">{d.value}</div>
                <div className="text-xs opacity-60">{d.description}</div>
              </div>
              {saving && denomination !== d.value
                ? null
                : denomination === d.value && <Check className="w-3.5 h-3.5 text-shield-brand flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const isPill = variant === 'pill'

  // sidebar / pill variants — compact dropdown
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        title="Denomination"
        className={
          isPill
            ? `flex max-w-[11rem] items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-shield-elevated ${
                denomination ? 'text-shield-fg' : 'text-shield-muted hover:text-shield-fg'
              }`
            : `flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                denomination
                  ? 'bg-shield-brand/10 border border-shield-brand/30 text-shield-fg hover:bg-shield-brand/15'
                  : 'bg-shield-elevated border border-shield-edge text-shield-muted hover:text-shield-fg hover:border-shield-edge-strong'
              }`
        }
      >
        <Church className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left truncate">
          {status === 'saved'
            ? `${denomination ?? 'None'} ✓`
            : denomination ?? (isPill ? 'Tradition' : 'Set denomination')}
        </span>
        {saving ? (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
        ) : status === 'error' ? (
          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
        ) : (
          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className={`absolute bottom-full left-0 z-50 w-64 overflow-hidden rounded-xl border border-shield-edge shadow-xl ${isPill ? 'mb-2 bg-shield-surface' : 'mb-1 bg-shield-panel'}`}>
          <div className="px-3 py-2 border-b border-shield-edge">
            <p className="text-xs text-shield-muted font-medium">Denomination</p>
            {noSession ? (
              <p className="text-xs text-red-500 mt-0.5">Sign in to save preferences</p>
            ) : (
              <p className="text-xs text-shield-muted opacity-60 mt-0.5">AI responses adapt to your tradition</p>
            )}
          </div>
          <div className="py-1">
            <button
              onClick={() => save(null)}
              disabled={saving}
              className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-shield-elevated disabled:opacity-50 ${
                denomination === null ? 'text-shield-fg' : 'text-shield-muted'
              }`}
            >
              <span>No preference</span>
              {denomination === null && <Check className="w-3 h-3 text-shield-brand" />}
            </button>
            {DENOMINATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => save(d.value)}
                disabled={saving}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-shield-elevated disabled:opacity-50 ${
                  denomination === d.value ? 'text-shield-fg' : 'text-shield-muted'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium">{d.value}</div>
                  <div className="opacity-50 text-xs">{d.description}</div>
                </div>
                {denomination === d.value && <Check className="w-3 h-3 text-shield-brand flex-shrink-0 ml-2" />}
              </button>
            ))}
          </div>
          {status === 'error' && !noSession && (
            <div className="px-3 py-2 border-t border-shield-edge">
              <p className="text-xs text-red-500">Failed to save. Please try again.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
