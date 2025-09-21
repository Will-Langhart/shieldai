export interface ApiHealth {
  status: string;
  message: string;
}

export interface ChatMessagePayload {
  message: string;
  mode?: 'gentle' | 'scholarly' | 'debate';
  sessionId?: string;
  conversationId?: string;
}


