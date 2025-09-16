import { apiService } from './api'
import { ChatMessage, Conversation } from '../types/chat'

export class ChatService {
  /**
   * Send a chat message with RAG (Retrieval-Augmented Generation)
   */
  async sendMessage(message: string, conversationId?: string, mode: 'gentle' | 'scholarly' | 'debate' = 'gentle', session?: any): Promise<{ messages: ChatMessage[], conversationId?: string }> {
    try {
      const token = session?.access_token || 'test-token';

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
        throw new Error(`HTTP error! status: ${response.status}`);
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
    onError: (error: Error) => void
  ): Promise<void> {
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
      const token = session?.access_token || 'test-token';

      // Save user message first
      if (conversationId) {
        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              conversationId,
              content: message,
              role: 'user',
              mode
            })
          });
        } catch (error) {
          console.warn('Failed to save user message:', error);
        }
      }

      // Try RAG API first, fall back to regular chat API
      let response;
      try {
        console.log('🔍 DEBUG: Sending to /api/chat-rag with message:', JSON.stringify(message))
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
            stream: true
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
            stream: true
          })
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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

      const completeMessage: ChatMessage = {
        id: Date.now().toString(),
        content: fullText,
        role: 'assistant',
        timestamp: new Date()
      };

      // Save assistant message
      if (conversationId) {
        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              conversationId,
              content: fullText,
              role: 'assistant',
              mode
            })
          });
        } catch (error) {
          console.warn('Failed to save assistant message:', error);
        }
      }

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
      console.log('🔍 getConversation called with ID:', conversationId);
      
      // Get auth token from session or fallback to test token
      const token = session?.access_token || 'test-token';
      
      console.log('🔑 Session token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('🌐 Making request to:', `/api/conversations/${conversationId}`);
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Raw response data:', data);
      
      const messages = data.messages || [];
      console.log('💬 Messages array:', messages);
      
      // Map API response to ChatMessage format
      const mappedMessages = messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at || msg.timestamp || new Date()),
        conversation_id: msg.conversation_id,
        metadata: msg.metadata
      }));
      
      console.log('🔄 Mapped messages:', mappedMessages);
      return mappedMessages;
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
      console.log('📋 getConversations called');
      
      // Get auth token from session or fallback to test token
      const token = session?.access_token || 'test-token';

      console.log('🌐 Making request to:', '/api/conversations');
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Raw response data:', data);
      
      const conversations = data.conversations || [];
      console.log('💬 Conversations array:', conversations);
      
      // Map API response to Conversation format
      const mappedConversations = conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        created_at: new Date(conv.created_at),
        updated_at: new Date(conv.updated_at),
        message_count: conv.message_count || 0,
        last_message: conv.last_message
      }));
      
      console.log('🔄 Mapped conversations:', mappedConversations);
      return mappedConversations;
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
      const token = session?.access_token || 'test-token';

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
    await apiService.deleteConversation(conversationId)
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<Conversation> {
    const response = await apiService.updateConversationTitle(conversationId, title)
    return response
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

