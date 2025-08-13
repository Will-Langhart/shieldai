import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import InputBar from '../../components/InputBar';
import ConversationHistory from '../../components/ConversationHistory';
import MessageActions from '../../components/MessageActions';
import MemoryInsights from '../../components/MemoryInsights';
import { useAuth } from '../../lib/auth-context';
import { ClientService } from '../../lib/client-service';
import { supabase } from '../../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  mode?: string;
}

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'fast' | 'accurate'>('fast');
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversationTitle, setConversationTitle] = useState<string>('');

  // Load conversation when component mounts or conversationId changes
  useEffect(() => {
    if (user && conversationId && typeof conversationId === 'string') {
      loadConversation(conversationId);
    }
  }, [user, conversationId]);

  const loadConversation = async (convId: string) => {
    try {
      console.log('Loading conversation:', convId);
      const messages = await ClientService.getMessages(convId);
      // Note: We don't have getConversation in ClientService, so we'll skip the title for now
      
      setMessages(messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        mode: msg.mode
      })));
      
      console.log('Loaded conversation with', messages.length, 'messages');
    } catch (error) {
      console.error('Error loading conversation:', error);
      router.push('/');
    }
  };

  const handleSelectConversation = async (newConversationId: string) => {
    router.push(`/chat/${newConversationId}`);
  };

  const handleNewConversation = () => {
    router.push('/');
  };

  const handleRegenerate = async (messageIndex: number) => {
    // Find the user message that preceded this AI response
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex >= 0 && messages[userMessageIndex].role === 'user') {
      const userMessage = messages[userMessageIndex].content;
      
      // Remove the current AI response
      setMessages(prev => prev.filter((_, index) => index !== messageIndex));
      
      // Regenerate the response
      await handleSubmit(userMessage);
    }
  };

  const handleCopyMessage = (content: string) => {
    console.log('Message copied to clipboard');
  };

  const handleShareMessage = (conversationId?: string) => {
    console.log('Share link copied to clipboard');
  };

  const handleFeedback = async (messageIndex: number, type: 'positive' | 'negative') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token;

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        },
        body: JSON.stringify({
          messageId: `msg_${messageIndex}`,
          feedback: type,
          conversationId: conversationId,
          objectionType: 'general' // This could be enhanced to detect objection type
        }),
      });

      if (response.ok) {
        console.log(`Feedback sent: ${type} for message ${messageIndex}`);
      } else {
        console.error('Failed to send feedback');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const handleSubmit = async (message: string) => {
    if (!conversationId || typeof conversationId !== 'string') {
      console.error('No conversation ID available');
      return;
    }

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

      // Streaming request
      const response = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        },
        body: JSON.stringify({
          message,
          mode: currentMode,
          conversationId: conversationId,
          sessionId: conversationId,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response from AI');
      }

      // Create a new assistant message and incrementally append
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        mode: currentMode,
      };
      setMessages(prev => [...prev, newAssistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aggregated = '';
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          aggregated += chunk;
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              updated[lastIndex] = { ...updated[lastIndex], content: aggregated };
            }
            return updated;
          });
        }
      }

      // Trigger conversation history refresh since messages are saved by the API
      if (user) {
        try {
          window.dispatchEvent(new CustomEvent('conversation-updated'));
          console.log('Messages saved by API, conversation updated');
        } catch (error) {
          console.error('Error updating conversation:', error);
        }
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
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
        <title>{conversationTitle ? `${conversationTitle} - Shield AI` : 'Shield AI - AI-powered apologetics companion'}</title>
        <meta name="description" content="Your AI-powered apologetics companion. Ask me anything about theology, philosophy, or defending the Christian worldview." />
        <link rel="icon" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-shield-black flex">
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
            <div className="h-full flex flex-col">
              <ConversationHistory
                onSelectConversation={handleSelectConversation}
                currentConversationId={conversationId as string}
                onNewConversation={handleNewConversation}
              />
              <div className="border-t border-gray-700/50 p-4">
                <MemoryInsights
                  conversationId={conversationId as string}
                  onMemorySelect={(memory) => {
                    console.log('Selected memory:', memory);
                    // You could implement functionality to reference this memory in the conversation
                  }}
                />
              </div>
            </div>
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
                        : 'bg-transparent border border-gray-700/50 text-shield-white'
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
                    
                    {/* Message Actions for AI responses */}
                    {message.role === 'assistant' && (
                      <MessageActions
                        messageId={`msg_${index}`}
                        content={message.content}
                        conversationId={conversationId as string}
                        onRegenerate={() => handleRegenerate(index)}
                        onCopy={() => handleCopyMessage(message.content)}
                        onShare={() => handleShareMessage(conversationId as string)}
                        onFeedback={(type) => handleFeedback(index, type)}
                      />
                    )}
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
          <div className="px-2 sm:px-0">
            <InputBar 
              onSubmit={handleSubmit} 
              isLoading={isLoading}
              mode={currentMode}
              onModeChange={setCurrentMode}
            />
          </div>
        </div>
      </div>
    </>
  );
} 