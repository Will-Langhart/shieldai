import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import InputBar from '../components/InputBar';
import ConversationHistory from '../components/ConversationHistory';
import MessageActions from '../components/MessageActions';
import SubscriptionModal from '../components/SubscriptionModal';
import AchievementSystem from '../components/AchievementSystem';
import MoodVerseSystem from '../components/MoodVerseSystem';
import ChurchFinder from '../components/ChurchFinder';
import { useAuth } from '../lib/auth-context';
import { ClientService } from '../lib/client-service';
import { supabase } from '../lib/supabase';
import { GamificationService } from '../lib/gamification-service';
import { Shield, Crown, AlertTriangle, Sun, Moon, Monitor, Heart, MapPin } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  mode?: string;
}

interface SubscriptionStatus {
  isInTrial: boolean;
  hasActiveSubscription: boolean;
  messageLimit: number;
  remainingMessages: number;
}

type Theme = 'light' | 'dark' | 'auto';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'fast' | 'accurate'>('fast');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showAchievementSystem, setShowAchievementSystem] = useState(false);
  const [showMoodVerseSystem, setShowMoodVerseSystem] = useState(false);
  const [showChurchFinder, setShowChurchFinder] = useState(false);
  const [theme, setTheme] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [userProgress, setUserProgress] = useState<any>(null);
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

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('shieldai-theme') as Theme || 'auto';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();
    
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('shieldai-theme', theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [theme, resolvedTheme]);

  const toggleTheme = () => {
    const themes: Theme[] = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'auto':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  // Load user progress
  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;
    
    try {
      const progress = await GamificationService.getUserProgress(user.id);
      setUserProgress(progress || mockUserProgress);
    } catch (error) {
      console.error('Error loading user progress:', error);
      setUserProgress(mockUserProgress);
    }
  };

  // Handle XP tracking for conversations
  const handleConversationComplete = async () => {
    if (!user) return;
    
    try {
      await GamificationService.addXP(
        user.id, 
        'conversation', 
        15, 
        'Completed apologetics conversation'
      );
      await loadUserProgress(); // Refresh progress
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  // Handle verse selection from mood system
  const handleVerseSelect = (verse: string) => {
    // Start a new conversation
    setMessages([]);
    setCurrentConversationId(undefined);
    
    // Create a prompt with the selected verse
    const prompt = `Can you help me understand this Bible verse: ${verse}`;
    
    // Add the verse to the input field
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = prompt;
      inputElement.focus();
    }
    
    // Automatically send the message to start the conversation
    setTimeout(() => {
      handleSubmit(prompt);
    }, 100);
  };

  // Handle church selection
  const handleChurchSelect = (church: any) => {
    // Start a new conversation
    setMessages([]);
    setCurrentConversationId(undefined);
    
    // Create a prompt about the selected church
    const message = `Tell me about ${church.name} in ${church.city}. What are their main ministries and how can I get involved?`;
    
    // Add the message to the input field
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = message;
      inputElement.focus();
    }
    
    // Automatically send the message to start the conversation
    setTimeout(() => {
      handleSubmit(message);
    }, 100);
  };

  // Mock user progress data - will be replaced with real data from GamificationService
  const mockUserProgress = {
    level: 10,
    currentXP: 1890,
    xpToNextLevel: 2100,
    totalXP: 1890,
    achievementsUnlocked: 3,
    totalAchievements: 6,
    streakDays: 5,
    conversationsCompleted: 35,
    versesReferenced: 67
  };

  // Update session ID when user changes
  useEffect(() => {
    if (user) {
      const userSessionId = `user_${user.id}_session`;
      console.log('Setting user session ID:', userSessionId);
      localStorage.setItem('shieldai_session_id', userSessionId);
      // Force reload of chat history with new session ID
      loadChatHistory();
      loadSubscriptionStatus();
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

  const loadSubscriptionStatus = async () => {
    if (!user) return;
    
    // Developer bypass for langhartcw@gmail.com
    const isDeveloper = user.email === 'langhartcw@gmail.com';
    if (isDeveloper) {
      setSubscriptionStatus({
        isInTrial: true,
        hasActiveSubscription: true,
        messageLimit: 999999,
        remainingMessages: 999999,
      });
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token;

      const response = await fetch('/api/subscriptions/status', {
        headers: {
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus({
          isInTrial: data.isInTrial,
          hasActiveSubscription: data.hasActiveSubscription,
          messageLimit: data.subscription?.messageLimit || 0,
          remainingMessages: data.subscription?.remainingMessages || 0,
        });
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

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
              mode: msg.mode,
            }));
            setMessages(formattedMessages);
            return;
          }
        } catch (error) {
          console.error('Error loading messages for current conversation:', error);
        }
      }

      // If no current conversation or no messages, load the most recent conversation
      const mostRecentConversation = conversations[0];
      if (mostRecentConversation) {
        try {
          const messages = await ClientService.getMessages(mostRecentConversation.id);
          const formattedMessages = messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
            mode: msg.mode,
          }));
          setMessages(formattedMessages);
          setCurrentConversationId(mostRecentConversation.id);
        } catch (error) {
          console.error('Error loading messages for most recent conversation:', error);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      const messages = await ClientService.getMessages(conversationId);
      const formattedMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        mode: msg.mode,
      }));
      setMessages(formattedMessages);
      setCurrentConversationId(conversationId);
      setShowSidebar(false); // Close sidebar on mobile
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(undefined);
    setShowSidebar(false); // Close sidebar on mobile
  };

  const handleRegenerate = async (messageIndex: number) => {
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      const newMessages = messages.slice(0, messageIndex - 1);
      setMessages(newMessages);
      await handleSubmit(userMessage.content);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleShareMessage = (conversationId?: string) => {
    const url = conversationId 
      ? `${window.location.origin}/chat/${conversationId}`
      : window.location.href;
    navigator.clipboard.writeText(url);
  };

  const handleFeedback = async (messageIndex: number, type: 'positive' | 'negative') => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageIndex,
          type,
          sessionId,
          conversationId: currentConversationId,
        }),
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleSubmit = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const newMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      mode: currentMode
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId,
          mode: currentMode,
          developerMode: user?.email === 'langhartcw@gmail.com'
        })
      });

      const data = await response.json();

      if (data.error) {
        if (data.requiresUpgrade) {
          setShowUpgradePrompt(true);
        } else {
          console.error('Chat error:', data.error);
        }
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        mode: currentMode
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Track XP for conversation completion
      await handleConversationComplete();

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    setShowSubscriptionModal(true);
    setShowUpgradePrompt(false);
  };

  // Show upgrade prompt if user is not subscribed (but not for developer)
  const shouldShowUpgradePrompt = subscriptionStatus ? 
    (!subscriptionStatus.isInTrial && !subscriptionStatus.hasActiveSubscription && user?.email !== 'langhartcw@gmail.com') : 
    false;

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

      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        resolvedTheme === 'dark' 
          ? 'bg-shield-black text-shield-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Header */}
        <Header 
          onMenuClick={() => setShowSidebar(!showSidebar)}
          showSidebar={showSidebar}
          theme={resolvedTheme}
          onThemeToggle={toggleTheme}
          themeIcon={getThemeIcon()}
          onAchievementClick={() => setShowAchievementSystem(true)}
          onMoodVerseClick={() => setShowMoodVerseSystem(true)}
          onChurchFinderClick={() => setShowChurchFinder(true)}
        />

        {/* Main content */}
        <main className="flex-1 flex">
          {/* Sidebar backdrop for mobile */}
          {user && showSidebar && (
            <div 
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* Sidebar */}
          {user && (
            <div className={`fixed inset-y-0 left-0 z-30 w-80 border-r transition-transform duration-300 ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            } md:relative md:translate-x-0 md:block ${showSidebar ? 'md:block' : 'md:hidden'} ${
              resolvedTheme === 'dark' 
                ? 'bg-shield-gray/50 border-gray-700/50' 
                : 'bg-white border-gray-200'
            }`}>
              <ConversationHistory
                onSelectConversation={handleSelectConversation}
                currentConversationId={currentConversationId}
                onNewConversation={handleNewConversation}
                theme={resolvedTheme}
              />
            </div>
          )}

          {/* Sidebar toggle button */}
          {user && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`fixed top-1/2 left-4 z-40 p-2 rounded-lg transition-colors transform -translate-y-1/2 md:left-4 ${
                resolvedTheme === 'dark'
                  ? 'bg-shield-gray/80 border border-gray-700/50 text-shield-white hover:bg-shield-gray/60'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSidebar ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          )}

          {/* Main content */}
          <div className={`flex-1 flex flex-col ${hasMessages ? 'justify-start' : 'justify-center'} px-4 sm:px-6 py-4 sm:py-6 transition-all duration-300 ${user && showSidebar ? 'md:ml-80' : 'ml-0'}`}>
            {/* Shield AI Logo and Branding - Only show when no messages */}
            {!hasMessages && (
              <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row items-center justify-center mb-6 sm:mb-8">
                  <img src="/logo.png" alt="Shield AI Logo" className="w-32 h-32 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mb-4 sm:mb-0 sm:mr-6 drop-shadow-lg" />
                  <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold drop-shadow-lg ${
                    resolvedTheme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                  }`}>Shield AI</h1>
                </div>
                <p className={`text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4 ${
                  resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Your AI-powered apologetics companion. Ask me anything about theology, philosophy, or defending the Christian worldview.
                </p>
                {user && (
                  <div className="text-center">
                    <p className={`text-sm font-medium ${
                      resolvedTheme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
                    }`}>
                      Signed in as {user.email}
                    </p>
                    <p className={`text-xs mt-1 ${
                      resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Your conversations will be saved automatically
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Messages Display */}
            {hasMessages && (
              <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 mb-6 sm:mb-8 px-2 sm:px-0 overflow-y-auto flex-1">
                <div className="space-y-4 sm:space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md lg:max-w-2xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-lg ${
                          message.role === 'user' 
                            ? resolvedTheme === 'dark'
                              ? 'bg-shield-blue/20 border border-shield-blue/30 text-shield-white'
                              : 'bg-blue-100 border border-blue-200 text-gray-900'
                            : resolvedTheme === 'dark'
                              ? 'bg-transparent border border-gray-700/30 text-shield-white'
                              : 'bg-transparent border border-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          {message.role === 'assistant' && (
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ${
                              resolvedTheme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                            }`}>
                              <img src="/logo.png" alt="Shield AI" className="w-6 h-6 sm:w-8 sm:h-8 rounded" />
                            </div>
                          )}
                          {message.role === 'user' && (
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ${
                              resolvedTheme === 'dark'
                                ? 'bg-shield-blue/20 border border-shield-blue/30'
                                : 'bg-blue-100 border border-blue-200'
                            }`}>
                              {user?.user_metadata?.avatar_url ? (
                                <img 
                                  src={user.user_metadata.avatar_url} 
                                  alt="User" 
                                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className={`font-bold text-xs sm:text-sm ${
                                  resolvedTheme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
                                }`}>
                                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`leading-relaxed text-sm sm:text-base break-words ${
                              resolvedTheme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                            }`}>{message.content}</p>
                            <p className={`text-xs mt-2 opacity-60 ${
                              resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Message Actions for AI responses */}
                        {message.role === 'assistant' && (
                          <MessageActions
                            messageId={`msg_${index}`}
                            content={message.content}
                            conversationId={currentConversationId}
                            onRegenerate={() => handleRegenerate(index)}
                            onCopy={() => handleCopyMessage(message.content)}
                            onShare={() => handleShareMessage(currentConversationId)}
                            onFeedback={(type) => handleFeedback(index, type)}
                            theme={resolvedTheme}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className={`max-w-2xl px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm border ${
                        resolvedTheme === 'dark'
                          ? 'bg-transparent border-gray-700/30'
                          : 'bg-transparent border-gray-200'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                            resolvedTheme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                          }`}>
                            <span className={`font-bold text-sm ${
                              resolvedTheme === 'dark' ? 'text-shield-white' : 'text-white'
                            }`}>S</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex space-x-1">
                              <div className={`w-2 h-2 rounded-full animate-bounce ${
                                resolvedTheme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                              }`}></div>
                              <div className={`w-2 h-2 rounded-full animate-bounce ${
                                resolvedTheme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                              }`} style={{ animationDelay: '0.1s' }}></div>
                              <div className={`w-2 h-2 rounded-full animate-bounce ${
                                resolvedTheme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                              }`} style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Input Bar - Positioned differently based on message state */}
            <div className={`w-full max-w-4xl mx-auto px-2 sm:px-0 ${hasMessages ? 'mt-auto' : 'mb-6 sm:mb-8'}`}>
              <InputBar 
                onSubmit={handleSubmit} 
                mode={currentMode}
                onModeChange={setCurrentMode}
                isLoading={isLoading}
                disabled={shouldShowUpgradePrompt}
                theme={resolvedTheme}
              />
            </div>

            {/* Footer text - Only show when no messages */}
            {!hasMessages && (
              <div className="text-center mt-6 sm:mt-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <p className={`text-xs sm:text-sm px-4 ${
                  resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  By messaging Shield AI, you agree to our{' '}
                  <a href="#" className={`hover:underline transition-colors ${
                    resolvedTheme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
                  }`}>Terms</a>
                  {' '}and{' '}
                  <a href="#" className={`hover:underline transition-colors ${
                    resolvedTheme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
                  }`}>Privacy Policy</a>
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Upgrade Prompt Modal */}
        {showUpgradePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUpgradePrompt(false)} />
            <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upgrade Required</h3>
              <p className="text-gray-600 mb-6">
                Your free trial has ended. Upgrade to continue using Shield AI and unlock all features.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleUpgradeClick}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Modal */}
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          currentSubscription={null}
          isInTrial={subscriptionStatus?.isInTrial}
          theme={resolvedTheme}
        />

        {/* Achievement System */}
        <AchievementSystem
          isOpen={showAchievementSystem}
          onClose={() => setShowAchievementSystem(false)}
          theme={resolvedTheme}
          userProgress={userProgress}
        />

        {/* Mood Verse System */}
        <MoodVerseSystem
          isOpen={showMoodVerseSystem}
          onClose={() => setShowMoodVerseSystem(false)}
          onVerseSelect={handleVerseSelect}
          theme={resolvedTheme}
        />

        {/* Church Finder */}
        <ChurchFinder
          isOpen={showChurchFinder}
          onClose={() => setShowChurchFinder(false)}
          onChurchSelect={handleChurchSelect}
          theme={resolvedTheme}
        />
      </div>
    </>
  );
} 