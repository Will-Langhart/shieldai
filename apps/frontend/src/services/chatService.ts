import { apiService } from './api'
import { ChatMessage, Conversation } from '../types/chat'

export class ChatService {
  /**
   * Send a chat message with RAG (Retrieval-Augmented Generation)
   */
  async sendMessage(message: string, conversationId?: string, mode: string = 'gentle', stream: boolean = false): Promise<ChatMessage> {
    try {
      // Try RAG API first, fall back to regular chat API
      let response;
      try {
        response = await fetch('/api/chat-rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
          },
          body: JSON.stringify({
            message,
            conversationId,
            mode,
            stream
          })
        });
      } catch (ragError) {
        console.warn('RAG API failed, falling back to regular chat API:', ragError);
        // Fall back to regular chat API
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
          },
          body: JSON.stringify({
            message,
            conversationId,
            mode,
            stream
          })
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (stream) {
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
        }

        return {
          id: Date.now().toString(),
          content: fullText,
          role: 'assistant',
          timestamp: new Date()
        };
      } else {
        // Handle non-streaming response
        const data = await response.json();
        return {
          id: Date.now().toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date()
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
    mode: string = 'gentle',
    onChunk: (chunk: string) => void,
    onComplete: (fullMessage: ChatMessage) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Try RAG API first, fall back to regular chat API
      let response;
      try {
        response = await fetch('/api/chat-rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
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
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
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

      onComplete(completeMessage);
    } catch (error) {
      console.error('Error sending streaming message:', error);
      onError(error as Error);
    }
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error getting conversation:', error);
      return [];
    }
  }

  /**
   * Get all conversations for the user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.conversations || [];
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<Conversation> {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

