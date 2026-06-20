import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { UserButton } from './auth/UserButton'

interface HeaderProps {
  /** When provided, renders a hamburger button (mobile only) that opens the nav drawer. */
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  return (
    <header className="sticky top-0 z-30 bg-shield-canvas/95 backdrop-blur-sm shadow-sm border-b border-shield-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center gap-2">
            {onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                aria-label="Open menu"
                className="md:hidden rounded-md p-1.5 text-shield-muted transition-colors hover:bg-shield-panel hover:text-shield-fg"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
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

          <div className="flex items-center">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}



