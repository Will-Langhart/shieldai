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
    <header className="sticky top-0 z-30 bg-shield-canvas/95 backdrop-blur-sm shadow-sm border-b border-shield-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="Shield AI"
                width={28}
                height={28}
                className="rounded-md"
                priority
              />
              <span className="text-base font-semibold text-shield-fg">Shield AI</span>
            </Link>
          </div>

          {showNav && (
            <nav aria-label="Primary" className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActivePath(pathname, item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-shield-brand/15 text-shield-brand shadow-shield-inset'
                        : 'text-shield-muted hover:bg-shield-panel hover:text-shield-fg'
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
                className="md:hidden rounded-md p-1.5 text-shield-muted transition-colors hover:bg-shield-panel hover:text-shield-fg"
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
            className="md:hidden border-t border-shield-panel py-2 space-y-0.5"
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
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-shield-brand/15 text-shield-brand shadow-shield-inset'
                      : 'text-shield-muted hover:bg-shield-panel hover:text-shield-fg'
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
