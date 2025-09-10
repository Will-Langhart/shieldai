import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { chatService } from '../../../services/chatService'
import { useRouter } from 'next/router'
import { 
  Plus, 
  Search, 
  BookOpen, 
  ChevronDown, 
  Mic, 
  Square, 
  X,
  MessageSquare,
  User
} from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export function Chat() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'gentle' | 'scholarly' | 'debate'>('gentle')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0)

  const apologeticsQuestions = [
    "How can we know God exists?",
    "What evidence supports the resurrection?",
    "How do you explain the problem of evil?",
    "Is the Bible historically reliable?",
    "What about other religions?",
    "How can God be three in one?",
    "Why does God allow suffering?",
    "What about evolution vs creation?",
    "How do we know Jesus was divine?",
    "What about the reliability of miracles?",
    "How can we trust the Bible?",
    "What about the problem of hell?",
    "How do you explain the Trinity?",
    "What about the age of the earth?",
    "How can we know truth exists?",
    "What about the problem of pain?",
    "How do we know God is good?",
    "What about biblical contradictions?",
    "How can we prove God's existence?",
    "What about the problem of evil?"
  ]

  // Custom sidebar toggle icon component
  const SidebarToggleIcon = () => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 20 20" 
      fill="none" 
      className="text-[#9CA3AF]"
    >
      <rect 
        x="2" 
        y="3" 
        width="6" 
        height="14" 
        rx="2" 
        fill="currentColor"
      />
      <rect 
        x="10" 
        y="3" 
        width="8" 
        height="14" 
        rx="2" 
        fill="currentColor"
      />
    </svg>
  )

  // Cycle through apologetics questions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % apologeticsQuestions.length)
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [session])

  const loadConversations = async () => {
    try {
      console.log('📋 Loading conversations...')
      const conversationsList = await chatService.getConversations(session)
      console.log('📋 Loaded conversations:', conversationsList)
      // Convert conversations to match component interface
      const convertedConversations = conversationsList.map(conv => ({
        ...conv,
        created_at: typeof conv.created_at === 'string' ? conv.created_at : conv.created_at.toISOString(),
        updated_at: typeof conv.updated_at === 'string' ? conv.updated_at : conv.updated_at.toISOString()
      }))
      setConversations(convertedConversations)
    } catch (error) {
      console.error('❌ Error loading conversations:', error)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      console.log('🔍 Loading conversation:', conversationId)
      setIsLoading(true)
      const conversationData = await chatService.getConversation(conversationId, session)
      console.log('🔍 Received conversation data:', conversationData)
      
      if (conversationData && Array.isArray(conversationData)) {
        // Convert messages to match component interface
        const convertedMessages = conversationData.map(msg => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp.toISOString()
        }))
        setMessages(convertedMessages)
        setCurrentConversationId(conversationId)
        console.log('✅ Messages loaded:', convertedMessages.length)
      } else {
        console.warn('⚠️ No messages found in conversation')
        setMessages([])
      }
    } catch (error) {
      console.error('❌ Error loading conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      console.log('💬 Sending streaming message:', inputMessage)
      
      // Create a placeholder for the assistant's response
      const assistantMessageId = Date.now().toString()
      let assistantMessageAdded = false
      
      // Use streaming message
      await chatService.sendStreamingMessage(
        inputMessage,
        currentConversationId || undefined,
        selectedMode,
        // onChunk: Update the assistant message as chunks arrive
        (chunk: string) => {
          if (!assistantMessageAdded) {
            // Add the assistant message only when we receive the first chunk
            const assistantMessage: Message = {
              id: assistantMessageId,
              content: chunk,
              role: 'assistant',
              timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, assistantMessage])
            assistantMessageAdded = true
          } else {
            // Update the existing message
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: msg.content + chunk }
                : msg
            ))
          }
        },
        // onComplete: Handle completion
        (fullMessage: any) => {
          console.log('💬 Streaming completed:', fullMessage)
          if (fullMessage.conversationId) {
            setCurrentConversationId(fullMessage.conversationId)
            loadConversations() // Refresh conversations list
          }
        },
        // onError: Handle errors
        (error: Error) => {
          console.error('❌ Error in streaming:', error)
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
              : msg
          ))
        }
      )
    } catch (error) {
      console.error('❌ Error sending message:', error)
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewTopic = () => {
    setMessages([])
    setCurrentConversationId(null)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-[#1A1D24] text-[#E0E0E0]">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 overflow-hidden bg-[#2C303A] border-r border-[#3A404B] flex flex-col`}>
        <div className="p-4 space-y-4">
          {/* New Chat Button */}
          <button
            onClick={handleNewTopic}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="h-5 w-5" />
            <span>New chat</span>
          </button>

          {/* Search Chats */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-[#1A1D24] border border-[#3A404B] text-[#E0E0E0] placeholder-[#9CA3AF] pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Library Link */}
          <div className="flex items-center space-x-3 px-4 py-2 text-[#9CA3AF] hover:text-[#E0E0E0] cursor-pointer transition-colors rounded-lg hover:bg-[#3A404B]">
            <BookOpen className="h-5 w-5" />
            <span>Library</span>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-4 scrollbar-hide">
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => loadConversation(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-600/20 border border-blue-500/30 text-[#E0E0E0] shadow-lg shadow-blue-500/10'
                    : 'hover:bg-[#3A404B] text-[#9CA3AF] hover:text-[#E0E0E0] border border-transparent hover:border-[#4A505B]'
                }`}
              >
                <div className="font-medium text-sm truncate">{conversation.title}</div>
                <div className="text-xs text-[#9CA3AF] mt-1">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#3A404B]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Shield AI</div>
              <div className="text-xs text-[#9CA3AF]">Plus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#1A1D24] to-[#2C303A]">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#3A404B] bg-gradient-to-br from-[#1A1D24] to-[#2C303A]">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-[#3A404B] rounded-lg transition-colors"
            >
              <SidebarToggleIcon />
            </button>
            <div className="flex items-center space-x-2">
              <h1 
                className="text-lg font-semibold cursor-pointer bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-500 transition-all duration-200"
                onClick={() => router.push('/')}
              >
                Shield AI
              </h1>
              <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
            </div>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-center w-full">
                <h2 className="text-2xl font-semibold mb-8 text-[#E0E0E0]">What can I help with?</h2>
                <div className="relative w-full max-w-3xl mx-auto">
                  <div className="flex items-center bg-[#2C303A] rounded-2xl px-4 py-3 shadow-lg border border-[#3A404B]">
                    <button className="p-2 hover:bg-[#3A404B] rounded-lg transition-colors mr-2">
                      <Plus className="h-5 w-5 text-white" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="w-full bg-transparent text-[#E0E0E0] placeholder-transparent focus:outline-none text-base"
                        disabled={isLoading}
                      />
                      <div className="absolute inset-0 pointer-events-none">
                        <span className="text-[#9CA3AF] text-base animate-pulse">
                          {apologeticsQuestions[currentPlaceholderIndex]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <button className="p-2 hover:bg-[#3A404B] rounded-lg transition-colors">
                        <Mic className="h-5 w-5 text-white" />
                      </button>
                      <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        <Square className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-start space-x-3">
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className={`${message.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' : 'bg-transparent text-[#E0E0E0]'} rounded-2xl p-4`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-transparent rounded-2xl p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area - Only show when there are messages */}
        {messages.length > 0 && (
          <div className="p-4 border-t border-[#3A404B] bg-gradient-to-br from-[#1A1D24] to-[#2C303A]">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center bg-[#1A1D24] rounded-2xl px-4 py-3 shadow-lg border border-[#3A404B]">
                <button className="p-2 hover:bg-[#3A404B] rounded-lg transition-colors mr-2">
                  <Plus className="h-5 w-5 text-white" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="w-full bg-transparent text-[#E0E0E0] placeholder-transparent focus:outline-none text-base"
                    disabled={isLoading}
                  />
                  {!inputMessage && (
                    <div className="absolute inset-0 pointer-events-none">
                      <span className="text-[#9CA3AF] text-base animate-pulse">
                        {apologeticsQuestions[currentPlaceholderIndex]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <button className="p-2 hover:bg-[#3A404B] rounded-lg transition-colors">
                    <Mic className="h-5 w-5 text-white" />
                  </button>
                  <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    <Square className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
