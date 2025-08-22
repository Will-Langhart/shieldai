// Client-side service that only calls API endpoints
// This ensures no server-side code (like OpenAI) is bundled in the client
import { supabase } from './supabase';

export interface Conversation {
  id: string;
  title: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  mode?: 'gentle' | 'scholarly' | 'debate';
  created_at: string;
  relevant_videos?: any[];
  bible_verses?: any[];
  video_metadata?: any;
}

export class ClientService {
  // Helper method to get session token
  private static async getSessionToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // Get all conversations for the current user
  static async getConversations(): Promise<Conversation[]> {
    const sessionToken = await this.getSessionToken();
    
    const response = await fetch('/api/conversations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get conversations');
    }

    return response.json();
  }

  // Get messages for a specific conversation
  static async getMessages(conversationId: string): Promise<Message[]> {
    const sessionToken = await this.getSessionToken();
    
    const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get messages');
    }

    return response.json();
  }

  // Create a new conversation
  static async createConversation(title: string): Promise<Conversation> {
    const sessionToken = await this.getSessionToken();
    
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    return response.json();
  }

  // Add a message to a conversation
  static async addMessage(
    conversationId: string,
    content: string,
    role: 'user' | 'assistant',
    mode?: 'gentle' | 'scholarly' | 'debate'
  ): Promise<Message> {
    const sessionToken = await this.getSessionToken();
    
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
      },
      body: JSON.stringify({
        conversationId,
        content,
        role,
        mode,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add message');
    }

    return response.json();
  }

  // Update conversation title
  static async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<void> {
    const sessionToken = await this.getSessionToken();
    
    const response = await fetch('/api/conversations', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
      },
      body: JSON.stringify({ conversationId, title }),
    });

    if (!response.ok) {
      throw new Error('Failed to update conversation title');
    }
  }

  // Delete a conversation
  static async deleteConversation(conversationId: string): Promise<void> {
    const sessionToken = await this.getSessionToken();
    
    const response = await fetch(`/api/conversations?conversationId=${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }
  }

  // Study Plans CRUD
  static async listStudyPlans(userId: string) {
    const response = await fetch(`/api/bible/plans?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to list study plans');
    return response.json();
  }

  static async createStudyPlan(payload: { userId: string; title: string; description?: string; durationDays?: number | null; visibility?: 'private' | 'shared' | 'public'; }) {
    const response = await fetch('/api/bible/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create study plan');
    return response.json();
  }

  static async updateStudyPlan(payload: { id: string; userId: string; title?: string; description?: string; durationDays?: number | null; visibility?: 'private' | 'shared' | 'public'; }) {
    const response = await fetch('/api/bible/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update study plan');
    return response.json();
  }

  static async deleteStudyPlan(id: string, userId: string) {
    const response = await fetch(`/api/bible/plans?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to delete study plan');
    return response.json();
  }

  static async listStudyPlanSteps(planId: string) {
    const response = await fetch(`/api/bible/plan-steps?planId=${encodeURIComponent(planId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to list steps');
    return response.json();
  }

  static async createStudyPlanStep(payload: { planId: string; reference?: string | null; title?: string; notes?: string; }) {
    const response = await fetch('/api/bible/plan-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create step');
    return response.json();
  }

  static async deleteStudyPlanStep(id: string) {
    const response = await fetch(`/api/bible/plan-steps?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to delete step');
    return response.json();
  }
} 