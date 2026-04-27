import React, { useState, useRef, useEffect } from 'react'
import { LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { AuthModal } from './AuthModal'
import { UserProfile } from './UserProfile'

export function UserButton() {
  const { user, session, signOut, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')
  const [showProfile, setShowProfile] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  if (loading) {
    return <div className="h-9 w-20 animate-pulse rounded-lg bg-shield-elevated" />
  }

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAuthView('login'); setShowAuthModal(true) }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-shield-muted transition-colors hover:bg-shield-panel hover:text-shield-fg"
          >
            Sign in
          </button>
          <button
            onClick={() => { setAuthView('signup'); setShowAuthModal(true) }}
            className="rounded-lg bg-gradient-to-r from-shield-brand to-shield-brand-dim px-4 py-2 text-sm font-semibold text-white shadow-shield-glow-sm transition-all hover:brightness-110"
          >
            Get started
          </button>
        </div>

        {showAuthModal && (
          <AuthModal
            initialView={authView}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </>
    )
  }

  // Logged-in state — avatar + dropdown
  const initials = (user.user_metadata?.full_name as string)?.charAt(0)?.toUpperCase()
    || user.email?.charAt(0)?.toUpperCase()
    || 'U'
  const displayName = (user.user_metadata?.full_name as string) || user.email || 'User'
  const shortEmail = user.email && user.email.length > 24
    ? user.email.slice(0, 21) + '…'
    : user.email

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-shield-panel"
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-shield-brand to-shield-brand-dim text-sm font-bold text-white shadow-shield-glow-sm">
            {initials}
          </div>
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-shield-fg sm:block">
            {shortEmail}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-shield-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-shield-edge bg-shield-panel shadow-2xl z-50 overflow-hidden">
            {/* User info */}
            <div className="border-b border-shield-edge px-4 py-3">
              <p className="text-sm font-semibold text-shield-fg truncate">{displayName}</p>
              <p className="text-xs text-shield-muted truncate">{user.email}</p>
              {!user.email_confirmed_at && (
                <p className="mt-1 text-xs text-amber-400">Email not verified</p>
              )}
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => { setDropdownOpen(false); setShowProfile(true) }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-shield-muted transition-colors hover:bg-shield-elevated hover:text-shield-fg"
              >
                <Settings className="h-4 w-4" />
                Profile & Settings
              </button>
              <button
                onClick={async () => { setDropdownOpen(false); await signOut() }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </>
  )
}
