import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  Home,
  BookOpen,
  MessageCircle,
  Brain,
  BookMarked,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
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
  /** Desktop rail: collapsed = icon-only, expanded = icon + label. */
  collapsed?: boolean
  onToggleCollapse?: () => void
  /** Controls the mobile slide-in drawer. */
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const { pathname } = useRouter()

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'hidden md:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-shield-panel bg-shield-deep transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Brand + collapse toggle */}
        <div
          className={cn(
            'flex h-12 items-center px-2',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 pl-1">
              <Image
                src="/logo.png"
                alt="Shield AI"
                width={24}
                height={24}
                className="rounded-md"
                priority
              />
              <span className="text-sm font-semibold text-shield-fg">Shield AI</span>
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-md p-1.5 text-shield-muted transition-colors hover:bg-shield-panel hover:text-shield-fg"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActivePath(pathname, item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'mx-auto h-10 w-10 justify-center' : 'gap-3 px-3 py-2',
                  active
                    ? 'bg-shield-panel text-shield-fg shadow-shield-inset'
                    : 'text-shield-muted hover:bg-shield-panel/60 hover:text-shield-fg'
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile slide-in drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <nav
            aria-label="Primary"
            className="absolute inset-y-0 left-0 flex w-64 flex-col gap-1 border-r border-shield-panel bg-shield-deep p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" onClick={onClose} className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Shield AI"
                  width={24}
                  height={24}
                  className="rounded-md"
                />
                <span className="text-base font-semibold text-shield-fg">Shield AI</span>
              </Link>
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
                      ? 'bg-shield-panel text-shield-fg shadow-shield-inset'
                      : 'text-shield-muted hover:bg-shield-panel/60 hover:text-shield-fg'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
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
