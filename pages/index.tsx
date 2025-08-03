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
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-shield-black flex flex-col">
        {/* Header */}
        <Header />

        {/* Main content */}
        <main className={`flex-1 flex flex-col ${hasMessages ? 'justify-start' : 'justify-center'} px-4 py-8`}>
          {/* Shield AI Logo and Branding - Only show when no messages */}
          {!hasMessages && (
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-shield-blue rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-shield-white font-bold text-3xl">S</span>
                </div>
                <h1 className="text-6xl font-bold text-shield-white">Shield AI</h1>
              </div>
            </div>
          )}

          {/* Messages Display */}
          {hasMessages && (
            <div className="w-full max-w-4xl mx-auto space-y-4 mb-8">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-shield-light-gray ml-auto max-w-2xl' 
                      : 'bg-shield-gray mr-auto max-w-2xl'
                  }`}
                >
                  <p className="text-shield-white">{message.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar - Positioned differently based on message state */}
          <div className={`w-full max-w-4xl mx-auto ${hasMessages ? 'mt-auto' : 'mb-8'}`}>
            <InputBar 
              onSubmit={handleSubmit} 
              mode={currentMode}
              onModeChange={setCurrentMode}
            />
          </div>

          {/* Footer text - Only show when no messages */}
          {!hasMessages && (
            <div className="text-center mt-8">
              <p className="text-gray-400 text-sm">
                By messaging Shield AI, you agree to our{' '}
                <a href="#" className="text-shield-blue hover:underline">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-shield-blue hover:underline">Privacy Policy</a>
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
} 