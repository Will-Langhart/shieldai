import Link from 'next/link'
import { useRouter } from 'next/router'
import { Shield, BookOpen, MessageCircle, Brain, BookMarked } from 'lucide-react'
import { UserButton } from './auth/UserButton'
// Using simple className concatenation instead of clsx

export function Header() {
  const router = useRouter()
  const location = { pathname: router.pathname }

  const navItems = [
    { path: '/', label: 'Home', icon: Shield },
    { path: '/bible', label: 'Bible', icon: BookOpen },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
    { path: '/insights-history', label: 'Insights', icon: Brain },
    { path: '/journal', label: 'Journal', icon: BookMarked },
  ]
  
  return (
    <header className="bg-shield-canvas shadow-sm border-b border-shield-panel relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-shield-brand" />
              <span className="text-xl font-bold text-shield-fg">Shield AI</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-shield-brand/15 text-shield-brand shadow-shield-inset'
                      : 'text-shield-muted hover:bg-shield-panel hover:text-shield-fg'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          <div className="flex items-center">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}



