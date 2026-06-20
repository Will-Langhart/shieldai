import React, { useState } from 'react'
import { Header } from '../Header'
import { Sidebar } from './Sidebar'
import { useSidebarCollapsed } from './useSidebarCollapsed'
import { cn } from '../../utils/cn'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * Standard app layout: a collapsible left nav rail (desktop) plus a slide-in
 * drawer (mobile) opened from the header's hamburger. Content padding tracks
 * the rail width so the two never overlap.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { collapsed, toggle } = useSidebarCollapsed()

  return (
    <div className="min-h-screen bg-shield-canvas">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggle}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          'transition-[padding] duration-200 ease-in-out',
          collapsed ? 'md:pl-16' : 'md:pl-60'
        )}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  )
}

export default AppShell
