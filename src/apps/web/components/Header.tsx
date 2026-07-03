import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Menu, X } from 'lucide-react'
import { UserButton } from './auth/UserButton'
import { navItems, isActivePath } from './layout/navItems'
import { cn } from '../utils/cn'

interface HeaderProps {
  /** Render the primary navigation links in the header. */
  showNav?: boolean
}

export function Header({ showNav = false }: HeaderProps = {}) {
  const { pathname } = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <header className="shield-top-nav">
      <div className="shield-page-shell">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2.5">
              <Image
                src="/logo.png"
                alt="Shield AI"
                width={34}
                height={34}
                className="rounded-lg shadow-shield-glow-sm"
                priority
              />
              <span className="text-2xl font-semibold text-shield-fg tracking-tight">Shield AI</span>
            </Link>
          </div>

          {showNav && (
            <nav aria-label="Primary" className="hidden md:flex items-center space-x-1.5 rounded-2xl border border-white/[0.06] bg-shield-panel/45 px-2 py-1.5 backdrop-blur-md">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActivePath(pathname, item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center space-x-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-shield-brand/20 text-shield-brand shadow-shield-inset'
                        : 'text-shield-muted hover:bg-shield-elevated/85 hover:text-shield-fg'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          )}

          <div className="flex items-center gap-1">
            {showNav && (
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                aria-controls="header-mobile-nav"
                className="md:hidden rounded-xl border border-transparent p-2 text-shield-muted transition-colors hover:border-shield-edge hover:bg-shield-panel hover:text-shield-fg"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
            <UserButton />
          </div>
        </div>

        {/* Mobile dropdown */}
        {showNav && mobileOpen && (
          <nav
            id="header-mobile-nav"
            aria-label="Primary"
            className="md:hidden border-t border-white/[0.07] py-2.5 space-y-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.path)
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-shield-brand/15 text-shield-brand shadow-shield-inset'
                      : 'text-shield-muted hover:bg-shield-elevated hover:text-shield-fg'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
