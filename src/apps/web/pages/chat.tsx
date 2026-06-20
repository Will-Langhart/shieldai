import { Chat } from '../components/features/chat/Chat'
import { Sidebar } from '../components/layout/Sidebar'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export default function ChatPage() {
  return (
    <ProtectedRoute>
      {/* Chat keeps its own full-screen chrome; the nav rail sits to its left on desktop. */}
      <Sidebar />
      <div className="md:pl-16">
        <Chat />
      </div>
    </ProtectedRoute>
  )
}