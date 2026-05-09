import { Chat } from '../components/features/chat/Chat'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <Chat />
    </ProtectedRoute>
  )
}