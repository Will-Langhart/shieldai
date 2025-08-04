import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, MoreVertical, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ConversationHistoryProps {
  onSelectConversation: (conversationId: string) => Promise<void>;
  currentConversationId?: string;
  onNewConversation: () => void;
  theme?: 'light' | 'dark';
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ 
  onSelectConversation, 
  currentConversationId, 
  onNewConversation,
  theme = 'dark'
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return;
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'text-shield-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-shield-white' : 'text-gray-900'}`}>
            Conversations
          </h2>
          <button
            onClick={onNewConversation}
            className={`p-2 rounded-lg transition-all duration-200 group ${
              theme === 'dark'
                ? 'text-shield-white hover:bg-shield-light-gray/50'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="New conversation"
          >
            <Plus size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-16 rounded-lg ${
                  theme === 'dark' ? 'bg-shield-gray/30' : 'bg-gray-100'
                }`} />
              ))}
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare size={48} className={`mx-auto mb-4 opacity-50 ${
              theme === 'dark' ? 'text-shield-white' : 'text-gray-400'
            }`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No conversations yet
            </p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              Start a new conversation to begin
            </p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative mb-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  conversation.id === currentConversationId
                    ? theme === 'dark'
                      ? 'bg-shield-blue/20 border border-shield-blue/30'
                      : 'bg-blue-50 border border-blue-200'
                    : theme === 'dark'
                      ? 'hover:bg-shield-light-gray/30 border border-transparent hover:border-gray-600/50'
                      : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      conversation.id === currentConversationId
                        ? theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                        : theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                    }`}>
                      {truncateTitle(conversation.title || 'Untitled Conversation')}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        <MessageSquare size={12} className={`${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {conversation.message_count || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={12} className={`${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatDate(conversation.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title="Delete conversation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory; 