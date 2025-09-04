import { apiService } from './api'
import { ChatMessage, Conversation } from '../types/chat'

export class ChatService {
  /**
   * Send a chat message with RAG (Retrieval-Augmented Generation)
   */
  async sendMessage(message: string, conversationId?: string, mode: string = 'gentle', stream: boolean = false): Promise<ChatMessage> {
    try {
      const response = await fetch('/api/chat-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message,
          conversationId,
          mode,
          stream
        })
      });

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
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<ChatMessage[]> {
    const response = await apiService.getConversation(conversationId)
    return response.messages
  }

  /**
   * Get all conversations for the user
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await apiService.getConversations()
    return response.conversations
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<Conversation> {
    const response = await apiService.createConversation(title || 'New Conversation')
    return response
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

