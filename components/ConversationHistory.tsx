import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Edit3, Plus, Search, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { ChatService } from '../lib/chat-service';

interface Conversation {
  id: string;
  title: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
}

interface ConversationHistoryProps {
  onSelectConversation: (conversationId: string) => void;
  currentConversationId?: string;
  onNewConversation: () => void;
}

export default function ConversationHistory({ 
  onSelectConversation, 
  currentConversationId, 
  onNewConversation 
}: ConversationHistoryProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Refresh conversations when a new one is created
  useEffect(() => {
    if (user) {
      const interval = setInterval(loadConversations, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const data = await ChatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await ChatService.deleteConversation(conversationId);
        await loadConversations();
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  const handleUpdateTitle = async (conversationId: string) => {
    if (newTitle.trim()) {
      try {
        await ChatService.updateConversationTitle(conversationId, newTitle.trim());
        await loadConversations();
        setEditingTitle(null);
        setNewTitle('');
      } catch (error) {
        console.error('Error updating conversation title:', error);
      }
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-400">
        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
        <p>Sign in to view your conversation history</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-shield-white">Conversations</h3>
          <button
            onClick={onNewConversation}
            className="p-2 bg-shield-blue text-shield-white rounded-lg hover:bg-shield-blue/90 transition-colors"
            title="New Conversation"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white placeholder-gray-400 focus:outline-none focus:border-shield-blue/50 transition-colors"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shield-blue mx-auto"></div>
            <p className="mt-2">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? 'No conversations found' : 'No conversations yet'}</p>
            {!searchTerm && (
              <button
                onClick={onNewConversation}
                className="mt-4 px-4 py-2 bg-shield-blue text-shield-white rounded-lg hover:bg-shield-blue/90 transition-colors"
              >
                Start your first conversation
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                  currentConversationId === conversation.id
                    ? 'bg-shield-blue/20 border border-shield-blue/50'
                    : 'hover:bg-shield-light-gray/30 border border-transparent'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingTitle === conversation.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdateTitle(conversation.id)}
                          className="flex-1 px-2 py-1 bg-shield-light-gray/50 border border-gray-600/50 rounded text-shield-white text-sm focus:outline-none focus:border-shield-blue/50"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateTitle(conversation.id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingTitle(null);
                            setNewTitle('');
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <h4 className="text-shield-white font-medium truncate">
                          {conversation.title}
                        </h4>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitle(conversation.id);
                              setNewTitle(conversation.title);
                            }}
                            className="p-1 text-gray-400 hover:text-shield-white transition-colors"
                            title="Edit title"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete conversation"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {conversation.last_message && (
                      <p className="text-gray-400 text-sm truncate mt-1">
                        {conversation.last_message}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock size={12} className="text-gray-500" />
                      <span className="text-gray-500 text-xs">
                        {formatDate(conversation.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 