import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { chatService } from '../../../services/chatService'
import { useRouter } from 'next/router'
import { EnhancedMessage } from './EnhancedMessage'
import { DenominationSelector } from '../../ui/DenominationSelector'
import { UserButton } from '../../auth/UserButton'
import {
  Plus,
  Search,
  BookOpen,
  ChevronDown,
  Mic,
  Square,
  Send,
  X,
  MessageSquare,
  Shield
} from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string // Changed from timestamp to created_at for enhanced storage compatibility
  timestamp?: string // Keep for backward compatibility
  metadata?: {
    user_interactions?: {
      was_copied?: boolean
      was_shared?: boolean
      was_bookmarked?: boolean
      was_rated?: boolean
      rating?: number
      feedback?: string
      reaction?: string
    }
  }
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
      className="text-shield-muted"
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
      const conversationsList = await chatService.getConversations(session)
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
      setIsLoading(true)
      const conversationData = await chatService.getConversation(conversationId, session)
      
      if (conversationData && Array.isArray(conversationData)) {
        // Convert messages to match component interface with enhanced storage compatibility
        const convertedMessages: Message[] = conversationData.map((msg: any) => {
          // Handle timestamp which might be Date, string, or undefined
          const timestampValue = msg.timestamp instanceof Date 
            ? msg.timestamp.toISOString() 
            : (typeof msg.timestamp === 'string' ? msg.timestamp : new Date().toISOString())
          
          // Handle created_at which might be string or undefined
          const createdAtValue = typeof msg.created_at === 'string' 
            ? msg.created_at 
            : (msg.created_at instanceof Date ? msg.created_at.toISOString() : timestampValue)
          
          return {
            id: msg.id,
            content: msg.content,
            role: msg.role,
            created_at: createdAtValue,
            timestamp: timestampValue,
            metadata: msg.metadata || {}
          }
        })
        setMessages(convertedMessages)
        setCurrentConversationId(conversationId)
      } else {
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

    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const userMessage: Message = {
      id: userMessageId,
      content: inputMessage,
      role: 'user',
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      metadata: {}
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Create a placeholder for the assistant's response
      const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      let assistantMessageAdded = false
      
      await chatService.sendStreamingMessage(
        inputMessage,
        currentConversationId || undefined,
        selectedMode,
        // onChunk: Update the assistant message as chunks arrive
        (chunk: string) => {
          if (!assistantMessageAdded) {
            const assistantMessage: Message = {
              id: assistantMessageId,
              content: chunk,
              role: 'assistant',
              created_at: new Date().toISOString(),
              timestamp: new Date().toISOString(),
              metadata: {}
            }
            setMessages(prev => [...prev, assistantMessage])
            assistantMessageAdded = true
          } else {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            ))
          }
        },
        (fullMessage: any) => {
          if (fullMessage.conversationId) {
            setCurrentConversationId(fullMessage.conversationId)
          }
          loadConversations() // Always refresh sidebar after a message completes
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
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        metadata: {}
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
    <div className="flex h-screen bg-shield-canvas text-shield-fg">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 overflow-hidden bg-shield-panel border-r border-shield-edge flex flex-col`}>
        <div className="p-4 space-y-4">
          {/* New Chat Button */}
          <button
            onClick={handleNewTopic}
            className="flex w-full transform items-center space-x-3 rounded-xl bg-gradient-to-r from-shield-brand to-shield-brand-dim px-4 py-3 text-white shadow-shield-glow-sm transition-all duration-200 hover:scale-[1.02] hover:brightness-110 hover:shadow-shield-glow"
          >
            <Plus className="h-5 w-5" />
            <span>New chat</span>
          </button>

          {/* Search Chats */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-shield-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full rounded-lg border border-shield-edge bg-shield-canvas py-2 pl-10 pr-4 text-shield-fg placeholder-shield-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-shield-brand"
            />
          </div>

          {/* Library Link */}
          <div className="flex items-center space-x-3 px-4 py-2 text-shield-muted hover:text-shield-fg cursor-pointer transition-colors rounded-lg hover:bg-shield-elevated">
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
                    ? 'border border-shield-brand/35 bg-shield-brand/15 text-shield-fg shadow-lg shadow-shield-brand/10'
                    : 'hover:bg-shield-elevated text-shield-muted hover:text-shield-fg border border-transparent hover:border-shield-edge-strong'
                }`}
              >
                <div className="font-medium text-sm truncate">{conversation.title}</div>
                <div className="text-xs text-shield-muted mt-1">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Denomination + User Profile */}
        <div className="p-4 border-t border-shield-edge space-y-3">
          <DenominationSelector variant="sidebar" />
          <UserButton />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-shield-canvas to-shield-panel">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-shield-edge bg-gradient-to-br from-shield-canvas to-shield-panel">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-shield-elevated rounded-lg transition-colors"
            >
              <SidebarToggleIcon />
            </button>
            <div className="flex items-center space-x-2">
              <h1 
                className="cursor-pointer bg-gradient-to-r from-shield-brand via-sky-300 to-shield-brand-dim bg-clip-text text-lg font-semibold text-transparent transition-all duration-200 hover:brightness-125"
                onClick={() => router.push('/')}
              >
                Shield AI
              </h1>
              <ChevronDown className="h-4 w-4 text-shield-muted" />
            </div>
          </div>
          <UserButton />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-center w-full">
                <h2 className="text-2xl font-semibold mb-8 text-shield-fg">What can I help with?</h2>
                <div className="relative w-full max-w-3xl mx-auto">
                  <div className="flex items-center bg-shield-panel rounded-2xl px-4 py-3 shadow-lg border border-shield-edge">
                    <button className="p-2 hover:bg-shield-elevated rounded-lg transition-colors mr-2">
                      <Plus className="h-5 w-5 text-white" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="w-full bg-transparent text-shield-fg placeholder-transparent focus:outline-none text-base"
                        disabled={isLoading}
                      />
                      {!inputMessage && (
                        <div className="absolute inset-0 pointer-events-none">
                          <span className="text-shield-muted text-base animate-pulse">
                            {apologeticsQuestions[currentPlaceholderIndex]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <button 
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                        className="p-2 hover:bg-shield-elevated rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mic className="h-5 w-5 text-white" />
                      </button>
                      <button 
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                        className="rounded-lg bg-shield-brand p-2 transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto px-4 py-6">
              <div className="space-y-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="w-full"
                  >
                    <EnhancedMessage
                      message={{
                        ...message,
                        created_at: message.created_at || message.timestamp || new Date().toISOString()
                      }}
                      onFeedback={(_messageId, _feedback) => {}}
                    />
                  </div>
                ))}
                {isLoading && (
                  <div className="w-full flex justify-start">
                    <div className="enhanced-message-wrapper assistant">
                      <div className="message-icon">
                        <div className="ai-icon-circle">
                          <Shield className="h-4 w-4 text-shield-brand" />
                        </div>
                      </div>
                      <div className="message-bubble assistant-bubble">
                        <div className="flex space-x-1.5 py-1">
                          <div className="w-1.5 h-1.5 bg-shield-muted rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-shield-muted rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-1.5 h-1.5 bg-shield-muted rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Only show when there are messages */}
        {messages.length > 0 && (
          <div className="p-4 border-t border-shield-edge bg-gradient-to-br from-shield-canvas to-shield-panel">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center bg-shield-canvas rounded-2xl px-4 py-3 shadow-lg border border-shield-edge">
                <button className="p-2 hover:bg-shield-elevated rounded-lg transition-colors mr-2">
                  <Plus className="h-5 w-5 text-white" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="w-full bg-transparent text-shield-fg placeholder-transparent focus:outline-none text-base"
                    disabled={isLoading}
                  />
                  {!inputMessage && (
                    <div className="absolute inset-0 pointer-events-none">
                      <span className="text-shield-muted text-base animate-pulse">
                        {apologeticsQuestions[currentPlaceholderIndex]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="p-2 hover:bg-shield-elevated rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mic className="h-5 w-5 text-white" />
                  </button>
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="rounded-lg bg-shield-brand p-2 transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-5 w-5 text-white" />
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
