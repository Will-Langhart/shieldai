import { supabase } from './supabase';
import { createServerSupabaseClient } from './supabase';
import { Database } from './supabase';
import { PineconeService } from './pinecone';
import { EmbeddingService } from './embeddings';
import { SupabaseClient } from '@supabase/supabase-js';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type NewConversation = Database['public']['Tables']['conversations']['Insert'];
type NewMessage = Database['public']['Tables']['messages']['Insert'];

export class ChatService {
  // Helper method to ensure user profile exists
  private static async ensureUserProfile(supabaseClient: any, user: any): Promise<void> {
    try {
      // Check if user profile exists
      const { data: userProfile, error: userError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // User profile doesn't exist, create it
        console.log('Creating user profile for:', user.id, user.email);
        const { error: createError } = await supabaseClient
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User'
          });

        if (createError) {
          console.error('Failed to create user profile:', createError);
          throw new Error('Failed to create user profile');
        }
        console.log('User profile created successfully');
      } else if (userError) {
        console.error('Error checking user profile:', userError);
        throw new Error('Failed to check user profile');
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  }

  // Get all conversations for the current user
  static async getConversations(supabaseClient?: SupabaseClient): Promise<Conversation[]> {
    const client = supabaseClient || supabase;
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return [];
    }

    // Ensure user profile exists
    await this.ensureUserProfile(client, user);

    const { data, error } = await client
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
    
    console.log('Retrieved conversations for user:', user.id, data?.length || 0);
    return data || [];
  }

  // Get messages for a specific conversation
  static async getMessages(conversationId: string, supabaseClient?: SupabaseClient): Promise<Message[]> {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create a new conversation
  static async createConversation(title: string, supabaseClient?: SupabaseClient): Promise<Conversation> {
    const client = supabaseClient || supabase;
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Ensure user profile exists
    await this.ensureUserProfile(client, user);

    console.log('Creating conversation for user:', user.id, 'with title:', title);

    const { data, error } = await client
      .from('conversations')
      .insert({ 
        title,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
    
    console.log('Successfully created conversation:', data.id, data.title);
    return data;
  }

  // Add a message to a conversation
  static async addMessage(
    conversationId: string,
    content: string,
    role: 'user' | 'assistant',
    mode?: 'fast' | 'accurate',
    supabaseClient?: SupabaseClient
  ): Promise<Message> {
    const client = supabaseClient || supabase;
    console.log('Adding message to conversation:', conversationId, 'role:', role, 'content length:', content.length);
    
    const { data, error } = await client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content,
        role,
        mode,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      throw error;
    }

    console.log('Successfully added message:', data.id);

    // Update conversation's last_message and updated_at
    await client
      .from('conversations')
      .update({ last_message: content })
      .eq('id', conversationId);

    // Store embedding in Pinecone
    try {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const embedding = await EmbeddingService.generateEmbedding(content);
        await PineconeService.storeMessage(
          data.id,
          content,
          role,
          conversationId,
          user.id,
          embedding,
          { mode }
        );
        console.log('Stored message embedding in Pinecone');
      }
    } catch (error) {
      console.error('Error storing embedding in Pinecone:', error);
      // Don't throw error to avoid breaking the main flow
    }

    return data;
  }

  // Update conversation title
  static async updateConversationTitle(
    conversationId: string,
    title: string,
    supabaseClient?: SupabaseClient
  ): Promise<void> {
    const client = supabaseClient || supabase;
    const { error } = await client
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) throw error;
  }

  // Update conversation's last message
  static async updateConversationLastMessage(
    conversationId: string,
    lastMessage: string,
    supabaseClient?: SupabaseClient
  ): Promise<void> {
    const client = supabaseClient || supabase;
    const { error } = await client
      .from('conversations')
      .update({ last_message: lastMessage })
      .eq('id', conversationId);

    if (error) throw error;
  }

  // Get a specific conversation
  static async getConversation(conversationId: string, supabaseClient?: SupabaseClient): Promise<Conversation | null> {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
    return data;
  }

  // Delete a conversation and all its messages
  static async deleteConversation(conversationId: string, supabaseClient?: SupabaseClient): Promise<void> {
    const client = supabaseClient || supabase;
    const { error } = await client
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  }

  // Get or create a conversation for the current session
  static async getOrCreateConversation(sessionId: string, supabaseClient?: SupabaseClient): Promise<Conversation> {
    const client = supabaseClient || supabase;
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Try to find existing conversation for this session and user
    const { data: existing } = await client
      .from('conversations')
      .select('*')
      .eq('title', `Session ${sessionId}`)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    // Create new conversation
    return await this.createConversation(`Session ${sessionId}`, client);
  }

  // Save the current conversation state
  static async saveConversationState(
    sessionId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string; mode?: 'fast' | 'accurate' }>,
    supabaseClient?: SupabaseClient
  ): Promise<void> {
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(sessionId, supabaseClient);

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
          message.mode,
          supabaseClient
        );
      }
    } catch (error) {
      console.error('Error saving conversation state:', error);
    }
  }

  // Load conversation state
  static async loadConversationState(sessionId: string, supabaseClient?: SupabaseClient): Promise<Message[]> {
    try {
      console.log('Loading conversation state for sessionId:', sessionId);
      const conversation = await this.getOrCreateConversation(sessionId, supabaseClient);
      console.log('Found conversation:', conversation.id, conversation.title);
      
      const messages = await this.getMessages(conversation.id, supabaseClient);
      console.log('Retrieved messages for conversation:', messages.length);
      return messages;
    } catch (error) {
      console.error('Error loading conversation state:', error);
      return [];
    }
  }

  // Search for similar messages using vector similarity
  static async searchSimilarMessages(
    query: string,
    userId: string,
    conversationId?: string,
    topK: number = 5,
    supabaseClient?: SupabaseClient
  ): Promise<Array<{ content: string; role: string; score: number }>> {
    try {
      const client = supabaseClient || supabase;
      const embedding = await EmbeddingService.generateEmbedding(query);
      const results = await PineconeService.searchSimilarMessages(
        embedding,
        userId,
        conversationId,
        topK
      );
      
      return results.map(result => ({
        content: result.content,
        role: result.role,
        score: result.score,
      }));
    } catch (error) {
      console.error('Error searching similar messages:', error);
      return [];
    }
  }

  // Get conversation context from vector database
  static async getConversationContext(
    conversationId: string,
    userId: string,
    topK: number = 10,
    supabaseClient?: SupabaseClient
  ): Promise<Array<{ content: string; role: string; score: number }>> {
    try {
      const client = supabaseClient || supabase;
      const results = await PineconeService.getConversationContext(
        conversationId,
        userId,
        topK
      );
      
      return results.map(result => ({
        content: result.content,
        role: result.role,
        score: result.score,
      }));
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  }
} 