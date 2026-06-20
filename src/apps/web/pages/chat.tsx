import { Chat } from '../components/features/chat/Chat'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export default function ChatPage() {
  return (
    <ProtectedRoute>
      {/* Chat's own sidebar is the single, unified sidebar — it now hosts the app nav. */}
      <Chat />
    </ProtectedRoute>
  )
}