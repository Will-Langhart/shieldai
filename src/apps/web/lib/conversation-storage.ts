// Simple file-based conversation storage for development
// This will be replaced with proper database persistence once RLS is configured
import fs from 'fs';
import path from 'path';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  metadata?: any;
}

interface StorageData {
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[]>;
  userConversations: Record<string, string[]>;
}

class ConversationStorage {
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private userConversations: Map<string, string[]> = new Map();
  private storageFile: string;

  constructor() {
    this.storageFile = path.join(process.cwd(), '.conversation-storage.json');
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8')) as StorageData;
        this.conversations = new Map(Object.entries(data.conversations || {}));
        this.messages = new Map(Object.entries(data.messages || {}));
        this.userConversations = new Map(Object.entries(data.userConversations || {}));
      }
    } catch (error) {
      console.warn('Failed to load conversation storage:', error);
    }
  }

  private saveToFile(): void {
    try {
      const data: StorageData = {
        conversations: Object.fromEntries(this.conversations),
        messages: Object.fromEntries(this.messages),
        userConversations: Object.fromEntries(this.userConversations)
      };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to save conversation storage:', error);
    }
  }

  // Create a new conversation
  createConversation(userId: string, title: string): Conversation {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const conversation: Conversation = {
      id,
      title,
      created_at: now,
      updated_at: now,
      user_id: userId
    };

    this.conversations.set(id, conversation);
    
    // Add to user's conversation list
    if (!this.userConversations.has(userId)) {
      this.userConversations.set(userId, []);
    }
    this.userConversations.get(userId)!.push(id);
    
    this.saveToFile();
    return conversation;
  }

  // Get conversations for a user
  getConversations(userId: string): Conversation[] {
    const conversationIds = this.userConversations.get(userId) || [];
    return conversationIds
      .map(id => this.conversations.get(id))
      .filter(Boolean)
      .sort((a, b) => new Date(b!.updated_at).getTime() - new Date(a!.updated_at).getTime()) as Conversation[];
  }

  // Get a specific conversation
  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  // Add a message to a conversation
  addMessage(conversationId: string, userId: string, content: string, role: 'user' | 'assistant', metadata?: any): Message {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const message: Message = {
      id,
      conversation_id: conversationId,
      user_id: userId,
      content,
      role,
      created_at: now,
      metadata
    };

    // Add message to conversation
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
    }
    this.messages.get(conversationId)!.push(message);

    // Update conversation's updated_at timestamp
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.updated_at = now;
    }

    this.saveToFile();
    return message;
  }

  // Get messages for a conversation
  getMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }

  // Update conversation title
  updateConversationTitle(conversationId: string, title: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.title = title;
      conversation.updated_at = new Date().toISOString();
      this.saveToFile();
      return true;
    }
    return false;
  }

  // Delete a conversation
  deleteConversation(conversationId: string, userId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (conversation && conversation.user_id === userId) {
      this.conversations.delete(conversationId);
      this.messages.delete(conversationId);
      
      // Remove from user's conversation list
      const userConversations = this.userConversations.get(userId) || [];
      const index = userConversations.indexOf(conversationId);
      if (index > -1) {
        userConversations.splice(index, 1);
      }
      
      this.saveToFile();
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const conversationStorage = new ConversationStorage();
export type { Conversation, Message };
