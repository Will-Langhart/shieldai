import React, { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import InputBar from '../components/InputBar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  mode?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'fast' | 'accurate'>('fast');

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
          mode: currentMode
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
        <main className={`flex-1 flex flex-col ${hasMessages ? 'justify-start' : 'justify-center'} px-4 py-6`}>
          {/* Shield AI Logo and Branding - Only show when no messages */}
          {!hasMessages && (
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-center mb-8">
                <img src="/logo.png" alt="Shield AI Logo" className="w-28 h-28 mr-6 drop-shadow-lg" />
                <h1 className="text-6xl font-bold text-shield-white drop-shadow-lg">Shield AI</h1>
              </div>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                Your AI-powered apologetics companion. Ask me anything about theology, philosophy, or defending the Christian worldview.
              </p>
            </div>
          )}

          {/* Messages Display */}
          {hasMessages && (
            <div className="w-full max-w-4xl mx-auto space-y-6 mb-8">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-2xl px-6 py-4 rounded-2xl shadow-lg ${
                      message.role === 'user' 
                        ? 'bg-shield-blue/20 border border-shield-blue/30 text-shield-white' 
                        : 'bg-shield-gray/80 backdrop-blur-sm border border-gray-700/50 text-shield-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-shield-blue rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-shield-white font-bold text-sm">S</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-shield-white leading-relaxed">{message.content}</p>
                        {message.timestamp && (
                          <p className="text-gray-400 text-xs mt-2 opacity-60">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-shield-blue/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-shield-white font-bold text-sm">U</span>
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
          <div className={`w-full max-w-4xl mx-auto ${hasMessages ? 'mt-auto' : 'mb-8'}`}>
            <InputBar 
              onSubmit={handleSubmit} 
              mode={currentMode}
              onModeChange={setCurrentMode}
              isLoading={isLoading}
            />
          </div>

          {/* Footer text - Only show when no messages */}
          {!hasMessages && (
            <div className="text-center mt-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <p className="text-gray-400 text-sm">
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