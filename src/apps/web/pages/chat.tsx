import { Chat } from '../components/features/chat/Chat'
import { Seo } from '../components/Seo'

export default function ChatPage() {
  return (
    <>
      <Seo
        title="AI Apologetics Chat"
        description="Chat with Shield AI for well-reasoned, scripturally grounded answers to theological challenges, skeptic arguments, and questions about the Christian faith."
        path="/chat"
      />
      {/* Open to signed-out visitors; Chat prompts for auth when they hit send.
          Chat's own sidebar is the single, unified sidebar — it hosts the app nav. */}
      <Chat />
    </>
  )
}