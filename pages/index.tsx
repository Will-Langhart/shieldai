import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import InputBar from '../components/InputBar';
import ConversationHistory from '../components/ConversationHistory';
import { useAuth } from '../lib/auth-context';
import { ClientService } from '../lib/client-service';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  mode?: string;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'fast' | 'accurate'>('fast');
  const [sessionId] = useState(() => {
    // Use a stable session ID based on user ID or create a persistent one
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shieldai_session_id');
      if (stored) {
        console.log('Using stored session ID:', stored);
        return stored;
      }
      const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Creating new session ID:', newId);
      localStorage.setItem('shieldai_session_id', newId);
      return newId;
    }
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Creating new session ID (server):', newId);
    return newId;
  });

  // Update session ID when user changes
  useEffect(() => {
    if (user) {
      const userSessionId = `user_${user.id}_session`;
      console.log('Setting user session ID:', userSessionId);
      localStorage.setItem('shieldai_session_id', userSessionId);
      // Force reload of chat history with new session ID
      loadChatHistory();
    }
  }, [user]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [showSidebar, setShowSidebar] = useState(false); // Start with sidebar closed

  // Load chat history when user is authenticated
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  // Listen for conversation updates
  useEffect(() => {
    const handleConversationUpdate = () => {
      if (user) {
        loadChatHistory();
      }
    };

    window.addEventListener('conversation-updated', handleConversationUpdate);
    return () => window.removeEventListener('conversation-updated', handleConversationUpdate);
  }, [user]);

  const loadChatHistory = async () => {
    try {
      if (!user) {
        console.log('No user authenticated, skipping chat history load');
        return;
      }

      console.log('Loading chat history for user:', user.id);
      
      // First, try to get all conversations
      const conversations = await ClientService.getConversations();
      console.log('Found conversations:', conversations.length);
      
      if (conversations.length === 0) {
        console.log('No conversations found for user');
        setMessages([]);
        setCurrentConversationId(undefined);
        return;
      }

      // If we have a current conversation ID, try to load its messages
      if (currentConversationId) {
        try {
          const messages = await ClientService.getMessages(currentConversationId);
          if (messages.length > 0) {
            const formattedMessages = messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.created_at,
              mode: msg.mode
            }));
            setMessages(formattedMessages);
            console.log('Loaded current conversation:', currentConversationId, 'with', messages.length, 'messages');
            return;
          } else {
            console.log('Current conversation has no messages, falling back to most recent');
          }
        } catch (error) {
          console.error('Error loading current conversation:', error);
        }
      }

      // Load the most recent conversation
      const mostRecent = conversations[0];
      console.log('Loading most recent conversation:', mostRecent.id, mostRecent.title);
      
      const messages = await ClientService.getMessages(mostRecent.id);
      if (messages.length > 0) {
        const formattedMessages = messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          mode: msg.mode
        }));
        setMessages(formattedMessages);
        setCurrentConversationId(mostRecent.id);
        console.log('Loaded most recent conversation:', mostRecent.title, 'with', messages.length, 'messages');
      } else {
        console.log('Most recent conversation has no messages');
        setMessages([]);
        setCurrentConversationId(mostRecent.id);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      const messages = await ClientService.getMessages(conversationId);
      setMessages(messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        mode: msg.mode
      })));
      setCurrentConversationId(conversationId);
      setShowSidebar(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(undefined);
    setShowSidebar(false);
    console.log('New conversation started, sidebar closed');
    // Clear any existing session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shieldai_session_id');
    }
  };

  const handleSubmit = async (message: string) => {
    // Add user message
    const userMessage: Message = { 
      role: 'user', 
      content: message,
      timestamp: new Date().toISOString(),
      mode: currentMode
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        },
        body: JSON.stringify({
          message,
          mode: currentMode,
          sessionId: sessionId,
          conversationId: currentConversationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        mode: data.mode
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle new conversation creation and redirection
      if (user && data.isNewConversation && data.conversationId) {
        try {
          console.log('New conversation created:', data.conversationId);
          
          // Set the current conversation ID
          setCurrentConversationId(data.conversationId);
          
          // Trigger conversation history refresh
          window.dispatchEvent(new CustomEvent('conversation-updated'));
          
          // Redirect to the conversation page
          console.log('Redirecting to conversation:', data.conversationId);
          router.push(`/chat/${data.conversationId}`);
        } catch (error) {
          console.error('Error handling new conversation:', error);
        }
      } else if (user && data.conversationId) {
        // Update current conversation ID if it was provided
        setCurrentConversationId(data.conversationId);
        
        // Trigger conversation history refresh
        window.dispatchEvent(new CustomEvent('conversation-updated'));
        
        console.log('Updated conversation ID:', data.conversationId);
      } else if (user) {
        // If no conversation ID was returned, trigger a refresh to load the most recent conversation
        console.log('No conversation ID returned, triggering refresh');
        setTimeout(() => {
          loadChatHistory();
        }, 1000); // Small delay to ensure the API has processed the message
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or check your API configuration.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  // Show loading screen while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-shield-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-shield-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-shield-white font-bold text-2xl">S</span>
          </div>
          <p className="text-shield-white text-lg">Loading Shield AI...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Shield AI - AI-powered apologetics companion</title>
        <meta name="description" content="Explore and defend the Christian worldview with AI-powered insights" />
        <link rel="icon" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-shield-black flex flex-col">
        {/* Header */}
        <Header />

        {/* Main content */}
        <main className="flex-1 flex">
          {/* Sidebar backdrop for mobile */}
          {user && showSidebar && (
            <div 
              className="fixed inset-0 bg-black/50 z-20"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* Sidebar */}
          {user && (
            <div className={`fixed inset-y-0 left-0 z-30 w-80 bg-shield-gray/50 border-r border-gray-700/50 transition-transform duration-300 ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <ConversationHistory
                onSelectConversation={handleSelectConversation}
                currentConversationId={currentConversationId}
                onNewConversation={handleNewConversation}
              />
            </div>
          )}

          {/* Sidebar toggle button */}
          {user && (
            <button
              onClick={() => {
                console.log('Sidebar toggle clicked, current state:', showSidebar);
                setShowSidebar(!showSidebar);
              }}
              className="fixed top-1/2 left-4 z-40 p-2 bg-shield-gray/80 border border-gray-700/50 rounded-lg text-shield-white hover:bg-shield-gray/60 transition-colors transform -translate-y-1/2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSidebar ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          )}

          {/* Main content */}
          <div className={`flex-1 flex flex-col ${hasMessages ? 'justify-start' : 'justify-center'} px-4 sm:px-6 py-4 sm:py-6 transition-all duration-300 ${user && showSidebar ? 'ml-80' : 'ml-0'}`}>
          {/* Shield AI Logo and Branding - Only show when no messages */}
          {!hasMessages && (
            <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-center justify-center mb-6 sm:mb-8">
                <img src="/logo.png" alt="Shield AI Logo" className="w-32 h-32 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mb-4 sm:mb-0 sm:mr-6 drop-shadow-lg" />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-shield-white drop-shadow-lg">Shield AI</h1>
              </div>
              <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                Your AI-powered apologetics companion. Ask me anything about theology, philosophy, or defending the Christian worldview.
              </p>
              {user && (
                <div className="text-center">
                  <p className="text-shield-blue text-sm font-medium">
                    Signed in as {user.email}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Your conversations will be saved automatically
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Messages Display */}
          {hasMessages && (
            <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 mb-6 sm:mb-8 px-2 sm:px-0">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-xs sm:max-w-md lg:max-w-2xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-lg ${
                      message.role === 'user' 
                        ? 'bg-shield-blue/20 border border-shield-blue/30 text-shield-white' 
                        : 'bg-shield-gray/80 backdrop-blur-sm border border-gray-700/50 text-shield-white'
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shield-blue rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                          <img src="/logo.png" alt="Shield AI" className="w-6 h-6 sm:w-8 sm:h-8 rounded" />
                        </div>
                      )}
                      {message.role === 'user' && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shield-blue/20 border border-shield-blue/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                          {user?.user_metadata?.avatar_url ? (
                            <img 
                              src={user.user_metadata.avatar_url} 
                              alt="User" 
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-shield-blue font-bold text-xs sm:text-sm">
                              {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-shield-white leading-relaxed text-sm sm:text-base">{message.content}</p>
                        {message.timestamp && (
                          <p className="text-gray-400 text-xs mt-2 opacity-60">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-2xl px-6 py-4 rounded-2xl shadow-lg bg-shield-gray/80 backdrop-blur-sm border border-gray-700/50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-shield-blue rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-shield-white font-bold text-sm">S</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-shield-blue rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-shield-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-shield-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Bar - Positioned differently based on message state */}
          <div className={`w-full max-w-4xl mx-auto px-2 sm:px-0 ${hasMessages ? 'mt-auto' : 'mb-6 sm:mb-8'}`}>
            <InputBar 
              onSubmit={handleSubmit} 
              mode={currentMode}
              onModeChange={setCurrentMode}
              isLoading={isLoading}
            />
          </div>

          {/* Footer text - Only show when no messages */}
          {!hasMessages && (
            <div className="text-center mt-6 sm:mt-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <p className="text-gray-400 text-xs sm:text-sm px-4">
                By messaging Shield AI, you agree to our{' '}
                <a href="#" className="text-shield-blue hover:underline transition-colors">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-shield-blue hover:underline transition-colors">Privacy Policy</a>
              </p>
            </div>
          )}
          </div>
        </main>
      </div>
    </>
  );
} 