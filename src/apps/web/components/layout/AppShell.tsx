import React, { useState } from 'react'
import { Header } from '../Header'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * Standard app layout: a persistent left nav rail (desktop) plus a slide-in
 * drawer (mobile) opened from the header's hamburger. Wrap page content in this
 * to get consistent navigation between Home / Bible / Chat / Insights / Journal.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-shield-canvas">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:pl-16">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  )
}

export default AppShell
