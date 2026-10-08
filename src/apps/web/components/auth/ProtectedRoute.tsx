import React, { useState } from 'react'
import { Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import LoadingSpinner from '../common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  /**
   * Render children for signed-out visitors too (they become guests on first
   * use). Without it, guest sessions are treated as signed out.
   */
  allowGuest?: boolean
}

export function ProtectedRoute({ children, allowGuest = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [view, setView] = useState<'login' | 'signup'>('login')

  if (loading) {
    return (
      <div className="min-h-screen bg-shield-void flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (allowGuest) return <>{children}</>

  if (!user || user.is_anonymous) {
    return (
      <div className="min-h-screen bg-shield-void flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-shield-edge bg-shield-panel shadow-2xl">
          <div className="flex items-center gap-2 px-6 pt-6 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-shield-brand to-shield-brand-dim shadow-shield-glow-sm">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-shield-fg">Shield AI</span>
          </div>

          <div className="mx-6 mb-6 flex rounded-lg border border-shield-edge bg-shield-canvas p-1">
            <button
              onClick={() => setView('login')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                view === 'login'
                  ? 'bg-shield-brand text-white shadow-shield-glow-sm'
                  : 'text-shield-muted hover:text-shield-fg'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setView('signup')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                view === 'signup'
                  ? 'bg-shield-brand text-white shadow-shield-glow-sm'
                  : 'text-shield-muted hover:text-shield-fg'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="px-6 pb-6">
            {view === 'login' ? (
              <LoginForm onSuccess={() => {}} onSwitchToSignUp={() => setView('signup')} />
            ) : (
              <SignUpForm onSwitchToLogin={() => setView('login')} />
            )}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
