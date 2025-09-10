import { useState, useRef, useEffect } from 'react'
import { Plus, Clock, Settings, Mic, Send, ChevronRight, Menu, X } from 'lucide-react'
import { chatService } from '../services/chatService'
import { Conversation } from '../types/chat'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/auth/LoginForm'
import { SignUpForm } from '../components/auth/SignUpForm'
import { UserProfile } from '../components/auth/UserProfile'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}


export function Chat() {
  const { user, session } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'gentle' | 'scholarly' | 'debate'>('gentle')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>()
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    // Check if user is authenticated
    if (!user) {
      setShowAuth(true)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage('')
    setLoading(true)
    setStreamingMessage('')

    try {
      // Create or get conversation ID
      let conversationId = currentConversationId
      if (!conversationId) {
        const newConversation = await chatService.createConversation(
          currentMessage.length > 50 ? currentMessage.substring(0, 50) + '...' : currentMessage
        )
        conversationId = newConversation.id
        setCurrentConversationId(conversationId)
        setConversations(prev => [newConversation, ...prev])
      }

      // Use streaming chat service
      await chatService.sendStreamingMessage(
        currentMessage,
        conversationId,
        selectedMode,
        (chunk: string) => {
          setStreamingMessage(prev => prev + chunk)
        },
        (fullMessage: Message) => {
          setMessages(prev => [...prev, fullMessage])
          setStreamingMessage('')
        },
        (error: Error) => {
          console.error('Error sending message:', error)
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
            role: 'assistant',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
          setStreamingMessage('')
        }
      )
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewTopic = () => {
    setMessages([])
    setInputMessage('')
    setCurrentConversationId(undefined)
    setStreamingMessage('')
  }

  const loadConversation = async (conversationId: string) => {
    try {
      console.log('🔄 loadConversation called with:', conversationId)
      setLoading(true)
      setLoadingConversationId(conversationId)
      setMessages([])
      setStreamingMessage('')
      setCurrentConversationId(conversationId)
      
      console.log('📞 Calling chatService.getConversation...')
      const conversationData = await chatService.getConversation(conversationId, session)
      console.log('📨 Received conversation data:', conversationData)
      
      // Extract messages from the response
      const conversationMessages = conversationData?.messages || []
      console.log('📨 Extracted messages:', conversationMessages)
      
      // Map the messages to the expected format
      const mappedMessages = conversationMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at || msg.timestamp || new Date())
      }))
      
      console.log('🔄 Setting messages:', mappedMessages)
      setMessages(mappedMessages)
      console.log('✅ Successfully loaded conversation with', mappedMessages.length, 'messages')
    } catch (error) {
      console.error('❌ Error loading conversation:', error)
      // Show error message to user
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't load this conversation. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages([errorMessage])
    } finally {
      setLoading(false)
      setLoadingConversationId(null)
    }
  }

  // Load conversations when user is authenticated
  useEffect(() => {
    const loadConversations = async () => {
      console.log('👤 User state:', user ? `Authenticated as ${user.email}` : 'Not authenticated')
      if (!user) {
        console.log('❌ No user, clearing conversations')
        setConversations([])
        setCurrentConversationId(undefined)
        setMessages([])
        return
      }
      
      // Prevent multiple simultaneous calls
      if (conversationsLoading) {
        return
      }
      
      setConversationsLoading(true)
      try {
        console.log('📋 Loading conversations...')
        const conversationsList = await chatService.getConversations(session)
        console.log('📋 Loaded conversations:', conversationsList)
        setConversations(conversationsList)
      } catch (error) {
        console.error('❌ Error loading conversations:', error)
      } finally {
        setConversationsLoading(false)
      }
    }
    
    loadConversations()
  }, [user])

  return (
    <div className="min-h-screen bg-[#1A1D24] flex">
      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-[#1A1D24] border-r border-[#2C303A] flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-6 border-b border-[#2C303A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              {!sidebarCollapsed && (
                <span className="text-[#E0E0E0] text-lg font-medium">Shield AI</span>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 text-[#E0E0E0] hover:text-white transition-colors"
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* New Topic Button */}
        <div className="p-4">
          <button
            onClick={handleNewTopic}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 bg-[#1A1D24] border border-[#2C303A] rounded-lg hover:bg-[#2C303A] transition-colors`}
            title={sidebarCollapsed ? "New Topic" : undefined}
          >
            <Plus className="w-5 h-5 text-[#E0E0E0]" />
            {!sidebarCollapsed && (
              <span className="text-[#E0E0E0] font-medium">New Topic</span>
            )}
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-4 h-4 text-[#E0E0E0]" />
              <h3 className="text-[#E0E0E0] font-medium">Conversations</h3>
            </div>
          )}
          <div className="space-y-2">
            {console.log('🎨 Rendering conversations:', conversations.length, 'conversations')}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`w-full text-left ${sidebarCollapsed ? 'px-2' : 'px-3'} py-2 text-[#E0E0E0] hover:bg-[#2C303A] rounded-lg transition-colors ${
                  currentConversationId === conversation.id ? 'bg-[#2C303A]' : ''
                } ${loadingConversationId === conversation.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={sidebarCollapsed ? conversation.title : undefined}
                onClick={() => {
                  console.log('🖱️ Conversation clicked:', conversation.id, conversation.title)
                  loadConversation(conversation.id)
                }}
                disabled={loadingConversationId === conversation.id}
              >
                {sidebarCollapsed ? (
                  <div className="w-6 h-6 bg-[#2C303A] rounded flex items-center justify-center">
                    {loadingConversationId === conversation.id ? (
                      <div className="w-3 h-3 border border-[#E0E0E0] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-xs font-medium">{conversation.title.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="truncate">{conversation.title}</span>
                    {loadingConversationId === conversation.id && (
                      <div className="w-4 h-4 border border-[#E0E0E0] border-t-transparent rounded-full animate-spin ml-2"></div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-[#2C303A]">
          <button 
            onClick={() => user ? setShowUserProfile(true) : setShowAuth(true)}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 bg-[#1A1D24] border border-[#2C303A] rounded-lg hover:bg-[#2C303A] transition-colors`}
            title={sidebarCollapsed ? (user ? "Profile" : "Sign In") : undefined}
          >
            <Settings className="w-5 h-5 text-[#E0E0E0]" />
            {!sidebarCollapsed && (
              <span className="text-[#E0E0E0] font-medium">
                {user ? 'Profile' : 'Sign In'}
              </span>
            )}
          </button>
          
          {/* Test button for debugging */}
          {!sidebarCollapsed && (
            <button 
              onClick={() => {
                console.log('Test button clicked!')
                loadConversation('test-conv-1')
              }}
              className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Test Load Conversation
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#1A1D24]">
        {/* Breadcrumbs */}
        <div className="p-4 border-b border-[#2C303A]">
          <div className="flex items-center space-x-2 text-[#E0E0E0] text-sm">
            <span>Chat</span>
            <ChevronRight className="w-4 h-4" />
            <span>
              {currentConversationId 
                ? conversations.find(c => c.id === currentConversationId)?.title || 'Loading...'
                : 'New Chat'
              }
            </span>
          </div>
        </div>

        {/* Chat Content */}
        <div className={`flex-1 flex flex-col ${messages.length > 0 ? 'justify-between' : 'items-center justify-center'} p-8`}>
          {console.log('🎨 Chat render - messages.length:', messages.length, 'currentConversationId:', currentConversationId)}
          {messages.length === 0 ? (
            <>
              {/* Central Logo - only show when no messages */}
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-4xl">S</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Messages Area - when there are messages */}
              <div className="w-full flex justify-center flex-1">
                <div className="max-w-4xl w-full space-y-4 overflow-y-auto">
                  {console.log('🎨 Rendering messages:', messages.length, 'messages')}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'text-[#E0E0E0]'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Streaming message */}
                  {streamingMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-2xl px-4 py-3 rounded-lg text-[#E0E0E0]">
                        <p className="text-sm leading-relaxed">
                          {streamingMessage}
                          <span className="animate-pulse">|</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {loading && !streamingMessage && (
                    <div className="flex justify-start">
                      <div className="text-[#E0E0E0] px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-[#E0E0E0] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[#E0E0E0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-[#E0E0E0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          {loadingConversationId && (
                            <span className="text-sm text-[#9CA3AF]">Loading conversation...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </>
          )}

          {/* Input Section - always at bottom with more spacing */}
          <div className={`w-full flex justify-center ${messages.length > 0 ? 'mt-16 mb-8' : ''}`}>
            <div className="max-w-4xl w-full">
            {/* Message Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write your message..."
                className="w-full px-4 py-4 bg-[#2C303A] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                <button className="p-2 text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="p-2 text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="flex space-x-2 mb-4">
              {[
                { key: 'gentle', label: 'Gentle' },
                { key: 'scholarly', label: 'Scholarly' },
                { key: 'debate', label: 'Debate' }
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setSelectedMode(mode.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMode === mode.key
                      ? 'bg-[#3A404B] text-[#E0E0E0] border border-[#3A404B]'
                      : 'bg-[#1A1D24] text-[#9CA3AF] border border-[#2C303A] hover:bg-[#2C303A]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-center text-[#9CA3AF] text-sm">
              Shield AI may make mistakes.
            </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1D24] rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#E0E0E0]">
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </h2>
              <button
                onClick={() => setShowAuth(false)}
                className="text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {authMode === 'login' ? (
              <LoginForm
                onSuccess={() => setShowAuth(false)}
                onSwitchToSignUp={() => setAuthMode('signup')}
              />
            ) : (
              <SignUpForm
                onSwitchToLogin={() => setAuthMode('login')}
              />
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}
    </div>
  )
}