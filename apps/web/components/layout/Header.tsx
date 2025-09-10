import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '../../utils/cn'

const Header: React.FC = () => {
  const router = useRouter()
  const location = { pathname: router.pathname }

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/bible', label: 'Bible', icon: '📖' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/churches', label: 'Churches', icon: '⛪' },
  ]

  return (
     <header className="bg-[#1A1D24] border-b border-[#2C303A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-[#E0E0E0]">Shield AI</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-[#9CA3AF] hover:text-[#E0E0E0] hover:bg-[#2C303A]'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-[#9CA3AF] hover:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header