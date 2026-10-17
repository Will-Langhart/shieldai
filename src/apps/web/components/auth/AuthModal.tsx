import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'

interface AuthModalProps {
  initialView?: 'login' | 'signup'
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ initialView = 'login', onClose, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'signup'>(initialView)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Portal to <body>: the modal is opened from the header, whose backdrop-blur
  // would otherwise become the containing block for this fixed overlay.
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* min-h-full keeps the panel centered but lets tall content scroll */}
      <div className="flex min-h-full items-center justify-center p-4">
      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-shield-edge bg-shield-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-serif font-semibold text-shield-fg">Shield AI</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-shield-muted transition-colors hover:bg-shield-elevated hover:text-shield-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-6 mb-6 flex rounded-lg border border-shield-edge bg-shield-canvas p-1">
          <button
            onClick={() => setView('login')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              view === 'login'
                ? 'bg-shield-brand text-shield-on-brand shadow-shield-glow-sm'
                : 'text-shield-muted hover:text-shield-fg'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setView('signup')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              view === 'signup'
                ? 'bg-shield-brand text-shield-on-brand shadow-shield-glow-sm'
                : 'text-shield-muted hover:text-shield-fg'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <div className="px-6 pb-6">
          {view === 'login' ? (
            <LoginForm
              onSuccess={() => { onSuccess?.(); onClose() }}
              onSwitchToSignUp={() => setView('signup')}
            />
          ) : (
            <SignUpForm
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </div>
      </div>
      </div>
    </div>,
    document.body
  )
}
