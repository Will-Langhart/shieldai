import { apiService } from './api'
import { ChatMessage, Conversation } from '../types/chat'

export class ChatService {
  /**
   * Send a chat message
   */
  async sendMessage(message: string, conversationId?: string): Promise<ChatMessage> {
    const response = await apiService.sendChatMessage(message, conversationId)
    return response.data
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<ChatMessage[]> {
    const response = await apiService.getConversation(conversationId)
    return response.data.messages
  }

  /**
   * Get all conversations for the user
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await apiService.getConversations()
    return response.data.conversations
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<Conversation> {
    const response = await apiService.createConversation(title)
    return response.data
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
    return response.data
  }

  /**
   * Get conversation suggestions based on context
   */
  async getSuggestions(context?: string): Promise<string[]> {
    const response = await apiService.getChatSuggestions(context)
    return response.data.suggestions
  }
}

export const chatService = new ChatService()

