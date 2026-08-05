import { Chat } from '../components/features/chat/Chat'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { Seo } from '../components/Seo'

export default function ChatPage() {
  return (
    <>
      {/* Seo sits outside ProtectedRoute so the tags render server-side for
          crawlers even though the page content is behind auth. */}
      <Seo
        title="AI Apologetics Chat"
        description="Chat with Shield AI for well-reasoned, scripturally grounded answers to theological challenges, skeptic arguments, and questions about the Christian faith."
        path="/chat"
      />
      <ProtectedRoute>
        {/* Chat's own sidebar is the single, unified sidebar — it now hosts the app nav. */}
        <Chat />
      </ProtectedRoute>
    </>
  )
}