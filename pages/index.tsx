import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import InputBar from '../components/InputBar';
import { useAuth } from '../lib/auth-context';
import { ChatService } from '../lib/chat-service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  mode?: string;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'fast' | 'accurate'>('fast');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Load chat history when user is authenticated
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const savedMessages = await ChatService.loadConversationState(sessionId);
      if (savedMessages.length > 0) {
        setMessages(savedMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          mode: msg.mode
        })));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSubmit = async (message: string) => {
    // Add user message
    const userMessage: Message = { 
      role: 'user', 
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          mode: currentMode,
          sessionId: sessionId
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

      // Save conversation state if user is authenticated
      if (user) {
        try {
          await ChatService.saveConversationState(sessionId, [
            ...messages,
            userMessage,
            aiMessage
          ]);
        } catch (error) {
          console.error('Error saving conversation state:', error);
        }
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
        <main className={`flex-1 flex flex-col ${hasMessages ? 'justify-start' : 'justify-center'} px-4 sm:px-6 py-4 sm:py-6`}>
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
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-shield-blue rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-shield-white font-bold text-xs sm:text-sm">S</span>
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
                      {message.role === 'user' && (
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-shield-blue/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-shield-white font-bold text-xs sm:text-sm">U</span>
                        </div>
                      )}
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
        </main>
      </div>
    </>
  );
} 