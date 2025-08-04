import { supabase } from './supabase';
import { Database } from './supabase';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type NewConversation = Database['public']['Tables']['conversations']['Insert'];
type NewMessage = Database['public']['Tables']['messages']['Insert'];

export class ChatService {
  // Get all conversations for the current user
  static async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get messages for a specific conversation
  static async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create a new conversation
  static async createConversation(title: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Add a message to a conversation
  static async addMessage(
    conversationId: string,
    content: string,
    role: 'user' | 'assistant',
    mode?: 'fast' | 'accurate'
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content,
        role,
        mode,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's last_message and updated_at
    await supabase
      .from('conversations')
      .update({ last_message: content })
      .eq('id', conversationId);

    return data;
  }

  // Update conversation title
  static async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) throw error;
  }

  // Delete a conversation and all its messages
  static async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  }

  // Get or create a conversation for the current session
  static async getOrCreateConversation(sessionId: string): Promise<Conversation> {
    // Try to find existing conversation for this session
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('title', `Session ${sessionId}`)
      .single();

    if (existing) {
      return existing;
    }

    // Create new conversation
    return await this.createConversation(`Session ${sessionId}`);
  }

  // Save the current conversation state
  static async saveConversationState(
    sessionId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string; mode?: 'fast' | 'accurate' }>
  ): Promise<void> {
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(sessionId);

      // Clear existing messages for this conversation
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversation.id);

      // Add all messages
      for (const message of messages) {
        await this.addMessage(
          conversation.id,
          message.content,
          message.role,
          message.mode
        );
      }
    } catch (error) {
      console.error('Error saving conversation state:', error);
    }
  }

  // Load conversation state
  static async loadConversationState(sessionId: string): Promise<Message[]> {
    try {
      const conversation = await this.getOrCreateConversation(sessionId);
      return await this.getMessages(conversation.id);
    } catch (error) {
      console.error('Error loading conversation state:', error);
      return [];
    }
  }
} 