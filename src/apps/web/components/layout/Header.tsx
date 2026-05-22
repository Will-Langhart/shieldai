import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { cn } from '../../utils/cn'
import { UserButton } from '../auth/UserButton'

const Header = () => {
  const router = useRouter()
  const location = { pathname: router.pathname }

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/bible', label: 'Bible', icon: '📖' },
    { path: '/chat', label: 'Chat', icon: '💬' },
  ]

  return (
     <header className="bg-shield-canvas border-b border-shield-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Shield AI"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <span className="text-xl font-bold text-shield-fg">Shield AI</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-shield-brand/20 text-shield-brand shadow-shield-inset'
                    : 'text-shield-muted hover:bg-shield-panel hover:text-shield-fg'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header