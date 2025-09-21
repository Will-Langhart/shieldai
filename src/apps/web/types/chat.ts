// Chat Types
export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  conversation_id?: string
  metadata?: Record<string, any>
}

export interface Conversation {
  id: string
  title: string
  created_at: Date
  updated_at: Date
  message_count: number
  last_message?: string
}

export interface ChatSuggestion {
  id: string
  text: string
  category: string
  context?: string
}

