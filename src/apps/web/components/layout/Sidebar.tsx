import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, BookOpen, MessageCircle, Brain, BookMarked, X } from 'lucide-react'
import { cn } from '../../utils/cn'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/bible', label: 'Bible', icon: BookOpen },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/insights-history', label: 'Insights', icon: Brain },
  { path: '/journal', label: 'Journal', icon: BookMarked },
]

function isActivePath(pathname: string, path: string) {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

interface SidebarProps {
  /** Controls the mobile slide-in drawer. The desktop rail is always visible. */
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { pathname } = useRouter()

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="Primary"
        className="hidden md:flex fixed inset-y-0 left-0 z-40 w-16 flex-col items-center gap-1 border-r border-shield-panel bg-shield-canvas/95 py-3 backdrop-blur-sm"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.path)
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              className={cn(
                'flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors',
                active
                  ? 'bg-shield-brand/15 text-shield-brand shadow-shield-inset'
                  : 'text-shield-muted hover:bg-shield-panel hover:text-shield-fg'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Mobile slide-in drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <nav
            aria-label="Primary"
            className="absolute inset-y-0 left-0 flex w-64 flex-col gap-1 border-r border-shield-panel bg-shield-canvas p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-semibold text-shield-fg">Menu</span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-shield-muted transition-colors hover:bg-shield-panel hover:text-shield-fg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.path)
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-shield-brand/15 text-shield-brand shadow-shield-inset'
                      : 'text-shield-muted hover:bg-shield-panel hover:text-shield-fg'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}

export default Sidebar
