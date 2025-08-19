export interface ApiHealth {
  status: string;
  message: string;
}

export interface ChatMessagePayload {
  message: string;
  mode?: 'fast' | 'accurate';
  sessionId?: string;
  conversationId?: string;
}


