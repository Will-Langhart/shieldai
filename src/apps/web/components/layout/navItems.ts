import { Home, BookOpen, MessageCircle, Brain, BookMarked, type LucideIcon } from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/bible', label: 'Bible', icon: BookOpen },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/insights-history', label: 'Insights', icon: Brain },
  { path: '/journal', label: 'Journal', icon: BookMarked },
]

export function isActivePath(pathname: string, path: string) {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}
