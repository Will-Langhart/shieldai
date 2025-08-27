import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import InputBar from '../../components/InputBar';
import ConversationHistory from '../../components/ConversationHistory';
import MessageActions from '../../components/MessageActions';
import MemoryInsights from '../../components/MemoryInsights';
import { EnhancedVideoDisplay } from '../../components/EnhancedVideoDisplay';
import { useAuth } from '../../lib/auth-context';
import { ClientService } from '../../lib/client-service';
import { supabase } from '../../lib/supabase';
import EnhancedBibleInterface from '../../components/EnhancedBibleInterface';
import { VideoResult } from '../../lib/video-service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  mode?: string;
  relevantVideos?: VideoResult[];
  bibleVerses?: any[];
}

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'gentle' | 'scholarly' | 'debate'>('gentle');
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [showBibleModal, setShowBibleModal] = useState(false);
  const [banner, setBanner] = useState<string>('');
  const [currentVideos, setCurrentVideos] = useState<VideoResult[]>([]);
  const [currentBibleVerses, setCurrentBibleVerses] = useState<any[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load conversation when component mounts or conversationId changes
  useEffect(() => {
    if (user && conversationId && typeof conversationId === 'string') {
      loadConversation(conversationId);
    }
  }, [user, conversationId]);

  // Listen for global event to open Bible UI from input bar
  useEffect(() => {
    const openHandler = () => setShowBibleModal(true);
    window.addEventListener('open-bible-search', openHandler as any);
    return () => window.removeEventListener('open-bible-search', openHandler as any);
  }, []);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    
    setTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  const loadConversation = async (convId: string) => {
    try {
      console.log('Loading conversation:', convId);
      const messagesResponse = await ClientService.getMessages(convId);
      // Note: We don't have getConversation in ClientService, so we'll skip the title for now
      
      setMessages((messagesResponse.items || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        mode: msg.mode,
        relevantVideos: msg.relevant_videos || [],
        bibleVerses: msg.bible_verses || []
      })));
      
      console.log('Loaded conversation with', (messagesResponse.items || []).length, 'messages');
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

  const handleQuoteMessage = async (content: string) => {
    try {
      if (!conversationId || typeof conversationId !== 'string') return;
      const quoted = content.split('\n').map((line) => `> ${line}`).join('\n');
      await ClientService.addMessage(conversationId, quoted, 'user', currentMode);
      setMessages((prev) => ([
        ...prev,
        { role: 'user', content: quoted, timestamp: new Date().toISOString(), mode: currentMode },
      ]));
    } catch (e) {
      console.error('Failed to quote message', e);
    }
  };

  const ensureDefaultPlan = async (): Promise<string | null> => {
    try {
      if (!user?.id) return null;
      const plansResp = await ClientService.listStudyPlans(user.id);
      const existing = (plansResp?.plans || []).find((p: any) => p.title === 'Saved from Chat');
      if (existing) return existing.id;
      const { plan } = await ClientService.createStudyPlan({ userId: user.id, title: 'Saved from Chat', description: 'Items saved from chat messages', durationDays: null, visibility: 'private' });
      return plan?.id || null;
    } catch (e) {
      console.error('Failed to ensure default plan', e);
      return null;
    }
  };

  const handleAddMessageToPlan = async (content: string) => {
    try {
      const planId = await ensureDefaultPlan();
      if (!planId) return;
      const title = content.substring(0, 60);
      await ClientService.createStudyPlanStep({ planId, title, notes: content });
      setBanner('Added to plan');
      setTimeout(() => setBanner(''), 2000);
    } catch (e) {
      console.error('Failed to add message to plan', e);
    }
  };

  const handleAddVerseToConversation = async (reference: string, text: string, version?: string) => {
    try {
      if (!conversationId || typeof conversationId !== 'string') return;
      const formatted = `${reference}${version ? ` (${version})` : ''}: "${text}"`;
      await ClientService.addMessage(conversationId, formatted, 'user', currentMode);
      setMessages((prev) => ([
        ...prev,
        { role: 'user', content: formatted, timestamp: new Date().toISOString(), mode: currentMode },
      ]));
      setShowBibleModal(false);
      setBanner('Verse added to conversation');
      setTimeout(() => setBanner(''), 2000);
    } catch (e) {
      console.error('Failed to add verse to conversation', e);
    }
  };

  const handleAddVerseToPlan = async (reference: string, text: string) => {
    try {
      const planId = await ensureDefaultPlan();
      if (!planId) return;
      await ClientService.createStudyPlanStep({ planId, reference, title: reference, notes: text });
      setBanner('Verse added to plan');
      setTimeout(() => setBanner(''), 2000);
    } catch (e) {
      console.error('Failed to add verse to plan', e);
    }
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
      let aiResponseContent = '';
      let videoData: any = null;
      let isVideoDataChunk = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          console.log('Received chunk:', chunk);
          
          // Check if this chunk contains video data markers
          if (chunk.includes('VIDEO_DATA_START') && chunk.includes('VIDEO_DATA_END')) {
            isVideoDataChunk = true;
            try {
              const startMarker = 'VIDEO_DATA_START';
              const endMarker = 'VIDEO_DATA_END';
              
              const startIndex = chunk.indexOf(startMarker) + startMarker.length;
              const endIndex = chunk.indexOf(endMarker);
              
              if (startIndex !== -1 && endIndex !== -1) {
                const jsonStr = chunk.substring(startIndex, endIndex).trim();
                console.log('Raw JSON string from stream:', jsonStr);
                videoData = JSON.parse(jsonStr);
                console.log('Successfully parsed video data:', videoData);
                console.log('Video count:', videoData.videos?.length || 0);
                console.log('Bible verses count:', videoData.bibleVerses?.length || 0);
              }
            } catch (e) {
              console.error('Failed to parse video data:', e);
              console.error('Chunk content:', chunk);
            }
          } else {
            // This is AI response content, not video data
            aiResponseContent += chunk;
            console.log('Adding to AI response content:', chunk.substring(0, 50) + '...');
            
            // Update the message content in real-time
            setMessages(prev => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                updated[lastIndex] = { ...updated[lastIndex], content: aiResponseContent };
              }
              return updated;
            });
          }
        }
      }
      
      // Extract video and scripture data if available
      console.log('Final video data:', videoData);
      console.log('Video data type:', typeof videoData);
      console.log('Video data keys:', videoData ? Object.keys(videoData) : 'null');
      console.log('AI Response Content:', aiResponseContent);
      
      // AI response content is already set in real-time during streaming
      
      if (videoData && videoData.videos && Array.isArray(videoData.videos) && videoData.videos.length > 0) {
        console.log('Setting videos:', videoData.videos);
        console.log('First video structure:', videoData.videos[0]);
        setCurrentVideos(videoData.videos);
        setCurrentBibleVerses(videoData.bibleVerses || []);
        
        // Update the last message with video data
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
            console.log('Updating message with videos:', videoData.videos);
            updated[lastIndex] = { 
              ...updated[lastIndex], 
              relevantVideos: videoData.videos,
              bibleVerses: videoData.bibleVerses || []
            };
          }
          return updated;
        });
      } else {
        console.log('No video data found or videos array is empty');
        console.log('Video data structure:', videoData);
        if (videoData && videoData.videos) {
          console.log('Videos array type:', typeof videoData.videos);
          console.log('Videos array length:', videoData.videos.length);
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
        {/* Banner */}
        {banner && (
          <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded bg-green-600 text-white text-sm shadow-lg">
            {banner}
          </div>
        )}
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
            className={`fixed top-1/2 z-40 p-2 bg-shield-gray/80 border border-gray-700/50 rounded-lg text-shield-white hover:bg-shield-gray/60 transition-all duration-300 transform -translate-y-1/2 ${
              showSidebar 
                ? 'left-80' // Position outside sidebar when open
                : 'left-4'  // Position on left when closed
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSidebar ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
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
            <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 mb-6 sm:mb-8 px-2 sm:px-0">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} fade-in-up duration-300`}
                >
                  <div
                    className={`max-w-xs sm:max-w-md lg:max-w-5xl px-4 sm:px-6 py-3 sm:py-4 ${
                      message.role === 'user' 
                        ? 'bg-shield-blue/20 text-shield-white' 
                        : 'bg-transparent text-shield-white'
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {message.role === 'assistant' && (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shield-blue rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <img src="/logo.png" alt="Shield AI" className="w-6 h-6 sm:w-8 sm:h-8 rounded" />
                        </div>
                      )}
                      {message.role === 'user' && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shield-blue/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
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
                        onQuote={() => handleQuoteMessage(message.content)}
                        onExport={() => {}}
                        onAddToPlan={(c) => handleAddMessageToPlan(c)}
                      />
                    )}

                    {/* Video Display for AI responses */}
                    {message.role === 'assistant' && (
                      <div>
                        {(() => { 
                          console.log('Message videos:', message.relevantVideos); 
                          console.log('Message structure:', message);
                          console.log('Message role:', message.role);
                          console.log('Message content length:', message.content?.length);
                          return null; 
                        })()}
                        {message.relevantVideos && message.relevantVideos.length > 0 ? (
                          <div className="mt-4">
                            <EnhancedVideoDisplay
                              videos={message.relevantVideos}
                              className="mt-4"
                            />
                          </div>
                        ) : (
                          <div className="mt-2 text-gray-400 text-sm">
                            Debug: No videos found for this message. Videos array: {JSON.stringify(message.relevantVideos)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start fade-in-up duration-300">
                  <div className="w-full px-6 py-4 text-shield-white">
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
              onBibleSelectClick={() => {
                try {
                  const evt = new CustomEvent('open-bible-search');
                  window.dispatchEvent(evt);
                } catch {}
              }}
            />
          </div>
          {/* Bible Modal */}
          {showBibleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowBibleModal(false)} />
              <div className="relative z-10 w-full max-w-4xl mx-4">
                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between p-3 border-b border-gray-700">
                    <h3 className="text-sm font-medium text-white">Bible Study</h3>
                    <button onClick={() => setShowBibleModal(false)} className="text-gray-300 hover:text-white">✕</button>
                  </div>
                  <div className="p-3 bg-gray-900">
                    <EnhancedBibleInterface
                      className=""
                      onVerseSelect={(ref, txt, ver) => handleAddVerseToConversation(ref, txt, ver)}
                      onAddToPlan={(ref, txt) => handleAddVerseToPlan(ref, txt)}
                      onAddNote={() => {}}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 