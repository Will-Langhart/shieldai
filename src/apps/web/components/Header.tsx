import Link from 'next/link'
import { useRouter } from 'next/router'
import { Shield, BookOpen, MessageCircle, Brain } from 'lucide-react'
// Using simple className concatenation instead of clsx

export function Header() {
  const router = useRouter()
  const location = { pathname: router.pathname }
  
  const navItems = [
    { path: '/', label: 'Home', icon: Shield },
    { path: '/bible', label: 'Bible', icon: BookOpen },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
    { path: '/insights-history', label: 'Insights', icon: Brain },
  ]
  
  return (
    <header className="bg-[#1A1D24] shadow-sm border-b border-[#2C303A] relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-[#E0E0E0]">Shield AI</span>
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
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-blue-400 bg-blue-400/10'
                      : 'text-[#9CA3AF] hover:text-[#E0E0E0] hover:bg-[#2C303A]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}



