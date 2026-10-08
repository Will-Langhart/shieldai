import { apiService } from './api'
import { devFallbackToken } from '../lib/test-token'
import { ChatMessage, Conversation } from '../types/chat'

/**
 * Error for a failed chat request. Plan-limit denials (403 upgrade_required)
 * carry the server's user-facing message and are named 'UpgradeRequired'.
 */
async function chatErrorFromResponse(response: Response): Promise<Error> {
  try {
    const body = await response.json()
    if (body?.error === 'upgrade_required' && body.message) {
      const err = new Error(body.message)
      err.name = 'UpgradeRequired'
      return err
    }
  } catch {}
  return new Error(`HTTP error! status: ${response.status}`)
}

export class ChatService {
  /**
   * Send a chat message with RAG (Retrieval-Augmented Generation)
   */
  async sendMessage(message: string, conversationId?: string, mode: 'gentle' | 'scholarly' | 'debate' = 'gentle', session?: any): Promise<{ messages: ChatMessage[], conversationId?: string }> {
    try {
      const token = session?.access_token || devFallbackToken();

      // Try RAG API first, fall back to regular chat API
      let response;
      try {
        response = await fetch('/api/chat-rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message,
            conversationId,
            mode,
            stream: false
          })
        });
      } catch (ragError) {
        console.warn('RAG API failed, falling back to regular chat API:', ragError);
        // Fall back to regular chat API
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message,
            conversationId,
            mode,
            stream: false
          })
        });
      }

      if (!response.ok) {
        throw await chatErrorFromResponse(response);
      }

      if (false) {
        // Handle streaming response (not used in this method)
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        let fullText = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
        }

        return {
          messages: [{
            id: Date.now().toString(),
            content: fullText,
            role: 'assistant',
            timestamp: new Date()
          }],
          conversationId: conversationId
        };
      } else {
        // Handle non-streaming response
        const data = await response.json();
        
        // Get the updated conversation messages
        const conversationData = await this.getConversation(data.conversationId, session);
        
        return {
          messages: conversationData,
          conversationId: data.conversationId
        };
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Send a streaming chat message with real-time updates
   */
  async sendStreamingMessage(
    message: string,
    conversationId: string | undefined,
    mode: 'gentle' | 'scholarly' | 'debate' = 'gentle',
    onChunk: (chunk: string) => void,
    onComplete: (fullMessage: ChatMessage) => void,
    onError: (error: Error) => void,
    options?: { regenerate?: boolean }
  ): Promise<void> {
    const regenerate = !!options?.regenerate;
    try {
      // Get auth token from Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to send messages');
      }
      const token = session.access_token;

      // NOTE: the user message is persisted server-side by the chat endpoint
      // (after retrieval / before streaming completes), which is the single
      // source of truth. We intentionally do NOT pre-save it here — doing so
      // duplicated the row and the in-prompt user turn for existing
      // conversations.

      // Try RAG API first, fall back to regular chat API.
      let response;
      try {
        response = await fetch('/api/chat-rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message,
            conversationId,
            mode,
            stream: true,
            regenerate
          })
        });
      } catch (ragError) {
        // The fallback endpoint has no regenerate semantics, so don't use it for
        // regeneration — surface the error instead of duplicating the user turn.
        if (regenerate) throw ragError;
        console.warn('RAG API failed, falling back to regular chat API:', ragError);
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message,
            conversationId,
            mode,
            stream: true
          })
        });
      }

      if (!response.ok) {
        throw await chatErrorFromResponse(response);
      }

      // Capture conversation ID from response header before reading body
      const returnedConversationId = response.headers.get('x-conversation-id') || conversationId || undefined;

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onChunk(chunk);
      }

      const completeMessage: ChatMessage & { conversationId?: string } = {
        id: Date.now().toString(),
        content: fullText,
        role: 'assistant',
        timestamp: new Date(),
        conversationId: returnedConversationId
      };

      onComplete(completeMessage);
    } catch (error) {
      console.error('Error sending streaming message:', error);
      onError(error as Error);
    }
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string, session?: any): Promise<ChatMessage[]> {
    try {
      const token = session?.access_token;
      if (!token) return [];
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const messages = data.messages || [];
      return messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at || msg.timestamp || new Date()),
        conversation_id: msg.conversation_id,
        metadata: msg.metadata
      }));
    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      return [];
    }
  }

  /**
   * Get all conversations for the user
   */
  async getConversations(session?: any): Promise<Conversation[]> {
    try {
      const token = session?.access_token || devFallbackToken();
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const conversations = data.conversations || [];
      return conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        created_at: new Date(conv.created_at),
        updated_at: new Date(conv.updated_at),
        message_count: conv.message_count || 0,
        last_message: conv.last_message
      }));
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      return [];
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<Conversation> {
    try {
      // Get auth token from Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || devFallbackToken();

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || 'New Conversation'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Return a mock conversation for testing
      const mockConversation = {
        id: `conv-${Date.now()}`,
        title: title || 'New Conversation',
        created_at: new Date(),
        updated_at: new Date(),
        message_count: 0
      };
      return mockConversation;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Please sign in to delete conversations');
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Failed to delete conversation: ${response.status}`);
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<Conversation> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Please sign in to rename conversations');
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error(`Failed to rename conversation: ${response.status}`);
    return response.json();
  }

  /**
   * Get conversation suggestions based on context
   */
  async getSuggestions(_context?: string): Promise<string[]> {
    const response = await apiService.getChatSuggestions()
    return response.suggestions
  }
}

export const chatService = new ChatService()

