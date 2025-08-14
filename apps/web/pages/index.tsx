import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import InputBar from '../components/InputBar';
import ConversationHistory from '../components/ConversationHistory';
import MessageActions from '../components/MessageActions';
import MessageRenderer from '../components/MessageRenderer';
import EnhancedSubscriptionModal from '../components/EnhancedSubscriptionModal';

import MoodVerseSystem from '../components/MoodVerseSystem';
import EnhancedChurchFinder from '../components/EnhancedChurchFinder';
import EnhancedBibleSearch from '../components/EnhancedBibleSearch';
import EnhancedBibleInterface from '../components/EnhancedBibleInterface';
import ApologeticsBible from '../components/ApologeticsBible';
import NoteCreationModal from '../components/NoteCreationModal';
import EnhancedNoteModal from '../components/EnhancedNoteModal';
import NotesManager from '../components/NotesManager';
import MobileNavigation from '../components/MobileNavigation';
import { useAuth } from '../lib/auth-context';
import { ClientService } from '../lib/client-service';
import { supabase } from '../lib/supabase';

import { Shield, Crown, AlertTriangle, Sun, Moon, Monitor, Heart, MapPin, BookOpen, X } from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  mode?: string;
  isStreaming?: boolean;
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

  const [showMoodVerseSystem, setShowMoodVerseSystem] = useState(false);
  const [showChurchFinder, setShowChurchFinder] = useState(false);
  const [showBibleSearch, setShowBibleSearch] = useState(false);
  const [showApologeticsBible, setShowApologeticsBible] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEnhancedNoteModal, setShowEnhancedNoteModal] = useState(false);
  const [showNotesManager, setShowNotesManager] = useState(false);
  const [selectedVerseForNote, setSelectedVerseForNote] = useState<{ reference: string; text: string } | null>(null);
  const [theme, setTheme] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [currentMobileSection, setCurrentMobileSection] = useState<'chat' | 'bible' | 'church' | 'mood' | 'settings'>('chat');
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

  // Theme and Language management
  useEffect(() => {
    const savedTheme = localStorage.getItem('shieldai-theme') as Theme || 'auto';
    const savedLanguage = localStorage.getItem('shieldai-language') || 'en';
    setTheme(savedTheme);
    setCurrentLanguage(savedLanguage);
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

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('shieldai-language', languageCode);
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
              id: msg.id || `loaded_${msg.created_at}_${Math.random().toString(36).substr(2, 9)}`,
              role: msg.role,
              content: msg.content,
              timestamp: msg.created_at,
              mode: msg.mode,
              isStreaming: false, // Ensure loaded messages are not streaming
            }));
            console.log('Loading messages with isStreaming=false:', formattedMessages.length);
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
            id: msg.id || `loaded_${msg.created_at}_${Math.random().toString(36).substr(2, 9)}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
            mode: msg.mode,
            isStreaming: false, // Ensure loaded messages are not streaming
          }));
          console.log('Loading most recent conversation with isStreaming=false:', formattedMessages.length);
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
        id: msg.id || `loaded_${msg.created_at}_${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        mode: msg.mode,
        isStreaming: false, // Ensure loaded messages are not streaming
      }));
      console.log('Selecting conversation with isStreaming=false:', formattedMessages.length);
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
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      mode: currentMode
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Debug authentication state
      console.log('Current user:', user);
      console.log('Auth loading:', authLoading);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }
      
      const token = session?.access_token;
      console.log('Session token exists:', !!token);
      console.log('Token length:', token?.length || 0);
      
      if (!token) {
        console.error('No session token available');
        throw new Error('Authentication required - please sign in again');
      }

      const response = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId,
          mode: currentMode,
          developerMode: user?.email === 'langhartcw@gmail.com',
          stream: true,
        })
      });

      if (!response.ok || !response.body) {
        console.error('Chat response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to stream response: ${response.status}`);
      }

      // Add an empty assistant message and stream into it
      const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newAssistantMessage = {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date().toISOString(),
        mode: currentMode,
        isStreaming: true,
      };
      
      console.log('Creating new streaming message:', assistantMessageId);
      setMessages(prev => [...prev, newAssistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aggregated = '';
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          aggregated += chunk;
          
          // Update only the specific message being streamed
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: aggregated }
              : msg
          ));
        }
      }
      
      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Sorry, I had trouble responding. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Please sign in to continue chatting.';
        } else if (error.message.includes('Failed to stream response')) {
          errorMessage = 'Connection error. Please check your internet and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
      }]);
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

      <div className={`h-screen flex flex-col transition-colors duration-300 overflow-hidden ${
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
          onMoodVerseClick={() => setShowMoodVerseSystem(true)}
          onChurchFinderClick={() => setShowChurchFinder(true)}
          onBibleSearchClick={() => setShowBibleSearch(true)}
          onApologeticsBibleClick={() => setShowApologeticsBible(true)}
          onNotesManagerClick={() => {
            console.log('Notes manager button clicked!');
            setShowNotesManager(true);
          }}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />

        {/* Main content */}
        <main className="flex-1 flex relative overflow-hidden">
          {/* Sidebar backdrop for mobile */}
          {user && showSidebar && (
            <div 
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* Sidebar */}
          {user && (
            <div className={`fixed inset-y-0 left-0 z-30 w-80 border-r transition-transform duration-300 mobile-sidebar ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            } md:relative md:translate-x-0 md:block ${showSidebar ? 'md:block' : 'md:hidden'} ${
              resolvedTheme === 'dark' 
                ? 'bg-shield-gray/50 border-gray-700/50' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="h-full overflow-y-auto">
                <ConversationHistory
                  onSelectConversation={handleSelectConversation}
                  currentConversationId={currentConversationId}
                  onNewConversation={handleNewConversation}
                  theme={resolvedTheme}
                />
              </div>
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
          <div className={`flex-1 flex flex-col transition-all duration-300 ${user && showSidebar ? 'md:ml-80' : 'ml-0'}`}>
            {/* Conversation Area - Scrollable with fixed height */}
            <div className={`flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6 ${hasMessages ? 'justify-start' : 'justify-center flex items-center'} swipe-area`}>
              {/* Shield AI Logo and Branding - Only show when no messages */}
              {!hasMessages && (
                <div className="text-center mb-10 sm:mb-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Hero banner matching BibleAI structure but with Shield AI brand */}
                  <div className="relative rounded-2xl overflow-hidden">
                    <div className={`px-6 sm:px-10 py-16 sm:py-24 rounded-2xl ${
                      resolvedTheme === 'dark' ? 'bg-shield-black' : 'bg-white'
                    }`}>
                      <div className="flex flex-col items-center">
                        <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight ${
                          resolvedTheme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                        }`}>
                          Discover The Most Advanced Apologetics Assistant
                        </h1>
                        <p className={`mt-4 text-sm sm:text-base max-w-3xl ${
                          resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Ask theology questions, explore scripture context, and get thoughtful, Bible-informed answers.
                        </p>
                        {/* Search bar style */}
                        <div className="mt-8 w-full max-w-3xl">
                          <div className={`flex items-center rounded-xl border shadow-inner ${
                            resolvedTheme === 'dark' ? 'bg-[#1f1f1f] border-gray-700' : 'bg-white border-gray-200'
                          }`}> 
                            <input
                              type="text"
                              className={`flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-l-xl focus:outline-none ${
                                resolvedTheme === 'dark' ? 'bg-transparent text-white placeholder-gray-400' : 'bg-transparent text-gray-900 placeholder-gray-500'
                              }`}
                              placeholder="Ask a question... e.g., Where was Jesus born?"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = (e.target as HTMLInputElement).value;
                                  if (val) handleSubmit(val);
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const el = document.querySelector('input[type="text"]') as HTMLInputElement;
                                if (el && el.value) handleSubmit(el.value);
                              }}
                              className={`mx-2 my-2 px-4 py-2 rounded-lg text-sm font-medium ${
                                resolvedTheme === 'dark' ? 'bg-shield-blue text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              Search
                            </button>
                          </div>
                        </div>
                        {user && (
                          <p className={`mt-4 text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Signed in as {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Display */}
              {hasMessages && (
                <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-4 min-w-0">
                  <div className="space-y-4 sm:space-y-6 min-w-0">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md lg:max-w-3xl px-5 sm:px-6 py-4 sm:py-5 rounded-2xl shadow-lg min-w-0 message-bubble-mobile transition-all duration-200 hover:shadow-xl ${
                            message.role === 'user' 
                              ? (resolvedTheme === 'dark'
                                ? 'bg-gradient-to-r from-shield-blue/10 to-shield-blue/20 border border-shield-blue/30 text-shield-white backdrop-blur-sm'
                                : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-gray-900')
                              : (resolvedTheme === 'dark'
                                ? 'bg-transparent border border-gray-700/50 text-shield-white'
                                : 'bg-transparent border border-gray-200 text-gray-900')
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
                              <div className={`text-sm sm:text-base ${
                                resolvedTheme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                              }`}>
                                <MessageRenderer
                                  content={message.content}
                                  theme={resolvedTheme}
                                  animated={message.isStreaming || false}
                                  className="message-scrollbar"
                                  onCopy={(text) => {
                                    navigator.clipboard.writeText(text);
                                    // You can add a toast notification here
                                  }}
                                />
                                {message.isStreaming && (
                                  <span className="inline-block ml-2 text-blue-400 animate-pulse">
                                    ●
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-2 opacity-60 ${
                                resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                                {message.mode && (
                                  <span className="ml-2">
                                    • {message.mode === 'fast' ? '⚡' : '🎯'} {message.mode}
                                  </span>
                                )}
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
                              onEdit={() => {
                                // Implement edit functionality
                                console.log('Edit message:', index);
                              }}
                              onQuote={() => {
                                // Implement quote functionality
                                const quotedText = `> ${message.content}\n\n`;
                                // You can add this to a new message input
                                console.log('Quote message:', quotedText);
                              }}
                              onSpeech={() => {
                                console.log('Text-to-speech for message:', index);
                              }}
                              onExport={() => {
                                console.log('Export message:', index);
                              }}
                              theme={resolvedTheme}
                              showExtendedActions={true}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Enhanced Loading indicator */}
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
                              <img src="/logo.png" alt="Shield AI" className="w-6 h-6 rounded animate-pulse" />
                            </div>
                            <div className="flex-1 pt-1">
                              <div className="flex items-center space-x-1 mb-3">
                                <div className={`w-2 h-2 rounded-full loading-dot ${
                                  resolvedTheme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                                }`}></div>
                                <div className={`w-2 h-2 rounded-full loading-dot ${
                                  resolvedTheme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                                }`}></div>
                                <div className={`w-2 h-2 rounded-full loading-dot ${
                                  resolvedTheme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                                }`}></div>
                              </div>
                              <div className="space-y-2">
                                <div className={`h-2 rounded animate-pulse ${
                                  resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                }`} style={{ width: '75%' }}></div>
                                <div className={`h-2 rounded animate-pulse ${
                                  resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                }`} style={{ width: '60%' }}></div>
                                <div className={`h-2 rounded animate-pulse ${
                                  resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                }`} style={{ width: '45%' }}></div>
                              </div>
                              <p className={`text-xs mt-2 ${
                                resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Shield AI is thinking...
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}


            </div>

            {/* Input Bar - Fixed at bottom */}
            <div className={`w-full px-4 sm:px-6 py-4 border-t ${
              resolvedTheme === 'dark' 
                ? 'border-gray-700/50 bg-shield-black' 
                : 'border-gray-200 bg-white'
            } min-w-0 flex-shrink-0`}>
              <div className="w-full max-w-4xl mx-auto min-w-0">
                <InputBar 
                  onSubmit={handleSubmit} 
                  mode={currentMode}
                  onModeChange={setCurrentMode}
                  isLoading={isLoading}
                  disabled={shouldShowUpgradePrompt}
                  theme={resolvedTheme}
                  onBibleSelectClick={() => setShowBibleSearch(true)}
                />
                {/* Copyright text */}
                <div className="text-center mt-3">
                  <p className={`text-xs ${
                    resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    2025 Shield AI All Rights Reserved
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Navigation - Only show on mobile */}
        {user && (
          <div className="md:hidden">
            <MobileNavigation
              currentSection={currentMobileSection}
              onSectionChange={setCurrentMobileSection}
              theme={resolvedTheme}
              onNewConversation={handleNewConversation}
              onBibleSearchClick={() => setShowBibleSearch(true)}
              onChurchFinderClick={() => setShowChurchFinder(true)}
              onMoodVerseClick={() => setShowMoodVerseSystem(true)}
              onSettingsClick={() => {/* TODO: Add settings modal */}}
            />
          </div>
        )}

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
        <EnhancedSubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          theme={resolvedTheme}
          onSubscriptionChange={() => {
            loadSubscriptionStatus();
            setShowSubscriptionModal(false);
          }}
        />



        {/* Mood Verse System */}
        <MoodVerseSystem
          isOpen={showMoodVerseSystem}
          onClose={() => setShowMoodVerseSystem(false)}
          onVerseSelect={handleVerseSelect}
          theme={resolvedTheme}
        />

        {/* Church Finder */}
        <EnhancedChurchFinder
          isOpen={showChurchFinder}
          onClose={() => setShowChurchFinder(false)}
          onChurchSelect={handleChurchSelect}
          theme={resolvedTheme}
        />

        {/* Enhanced Bible Interface */}
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${showBibleSearch ? 'block' : 'hidden'}`}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBibleSearch(false)} />
          <div className="relative w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto">
            <EnhancedBibleInterface
              onVerseSelect={(reference, text, version) => {
                // Add the selected verse to the chat with version info
                const verseMessage = `${reference} (${version || 'KJV'}): "${text}"`;
                handleSubmit(verseMessage);
                setShowBibleSearch(false);
              }}
              onAddNote={(reference, text) => {
                setSelectedVerseForNote({ reference, text });
                setShowNoteModal(true);
              }}
              className="w-full min-h-full"
            />
            <button
              onClick={() => setShowBibleSearch(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Apologetics Bible Interface */}
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${showApologeticsBible ? 'block' : 'hidden'}`}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowApologeticsBible(false)} />
          <div className="relative w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto">
            <ApologeticsBible
              onVerseSelect={(reference, text, version) => {
                // Add the selected verse to the chat with version info
                const verseMessage = `${reference} (${version || 'KJV'}): "${text}"`;
                handleSubmit(verseMessage);
                setShowApologeticsBible(false);
              }}
              onAddNote={(reference, text) => {
                setSelectedVerseForNote({ reference, text });
                setShowNoteModal(true);
              }}
              className="w-full min-h-full"
            />
            <button
              onClick={() => setShowApologeticsBible(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Note Creation Modal */}
      {selectedVerseForNote && (
        <NoteCreationModal
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setSelectedVerseForNote(null);
          }}
          reference={selectedVerseForNote.reference}
          text={selectedVerseForNote.text}
          onNoteCreated={(note) => {
            console.log('Note created:', note);
            // Could add a success message or update UI
          }}
        />
      )}

      {/* Enhanced Note Modal */}
      {showEnhancedNoteModal && (
        <EnhancedNoteModal
          isOpen={showEnhancedNoteModal}
          onClose={() => setShowEnhancedNoteModal(false)}
          reference={selectedVerseForNote?.reference}
          text={selectedVerseForNote?.text}
          theme={resolvedTheme}
          onNoteCreated={(note) => {
            console.log('Enhanced note created:', note);
            setShowEnhancedNoteModal(false);
            setSelectedVerseForNote(null);
          }}
        />
      )}

      {/* Notes Manager */}
      {showNotesManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotesManager(false)} />
          <div className="relative w-full max-w-7xl mx-4 max-h-[95vh] overflow-y-auto">
            <NotesManager
              className="w-full min-h-full"
              onNoteSelect={(note) => {
                console.log('Note selected:', note);
                // Could open note in modal for editing
              }}
              onNoteEdit={(note) => {
                console.log('Note edit:', note);
                // Could open note in modal for editing
              }}
              onNoteDelete={(noteId) => {
                console.log('Note deleted:', noteId);
                // Could show confirmation or update UI
              }}
            />
            <button
              onClick={() => setShowNotesManager(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </>
  );
} 