import { Chat } from '../components/features/chat/Chat'
import { Sidebar } from '../components/layout/Sidebar'
import { useSidebarCollapsed } from '../components/layout/useSidebarCollapsed'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { cn } from '../utils/cn'

function ChatShell() {
  const { collapsed, toggle } = useSidebarCollapsed()
  return (
    <>
      {/* Chat keeps its own full-screen chrome; the nav rail sits to its left on desktop. */}
      <Sidebar collapsed={collapsed} onToggleCollapse={toggle} />
      <div
        className={cn(
          'transition-[padding] duration-200 ease-in-out',
          collapsed ? 'md:pl-16' : 'md:pl-60'
        )}
      >
        <Chat />
      </div>
    </>
  )
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatShell />
    </ProtectedRoute>
  )
}