import { useState, useRef, useEffect } from 'react'
import { Plus, Clock, Settings, Mic, Send, ChevronRight, Menu, X } from 'lucide-react'
import { chatService } from '../services/chatService'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatTopic {
  id: string
  title: string
  timestamp: Date
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'basic' | 'medium' | 'advanced'>('medium')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatTopics] = useState<ChatTopic[]>([
    { id: '1', title: 'hi', timestamp: new Date() }
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

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

    try {
      // Use the RAG-enabled chat service
      const assistantMessage = await chatService.sendMessage(
        currentMessage,
        undefined, // conversationId - will be created if needed
        selectedMode,
        false // stream - set to true for streaming responses
      )

      setMessages(prev => [...prev, assistantMessage])
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
  }

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

        {/* Previous Topics */}
        <div className="flex-1 px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-4 h-4 text-[#E0E0E0]" />
              <h3 className="text-[#E0E0E0] font-medium">Previous Topics</h3>
            </div>
          )}
          <div className="space-y-2">
            {chatTopics.map((topic) => (
              <button
                key={topic.id}
                className={`w-full text-left ${sidebarCollapsed ? 'px-2' : 'px-3'} py-2 text-[#E0E0E0] hover:bg-[#2C303A] rounded-lg transition-colors`}
                title={sidebarCollapsed ? topic.title : undefined}
              >
                {sidebarCollapsed ? (
                  <div className="w-6 h-6 bg-[#2C303A] rounded flex items-center justify-center">
                    <span className="text-xs font-medium">{topic.title.charAt(0).toUpperCase()}</span>
                  </div>
                ) : (
                  topic.title
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-[#2C303A]">
          <button 
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 bg-[#1A1D24] border border-[#2C303A] rounded-lg hover:bg-[#2C303A] transition-colors`}
            title={sidebarCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-5 h-5 text-[#E0E0E0]" />
            {!sidebarCollapsed && (
              <span className="text-[#E0E0E0] font-medium">Settings</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#1A1D24]">
        {/* Breadcrumbs */}
        <div className="p-4 border-b border-[#2C303A]">
          <div className="flex items-center space-x-2 text-[#E0E0E0] text-sm">
            <span>Chat</span>
            <ChevronRight className="w-4 h-4" />
            <span>New Chat</span>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Central Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-4xl">S</span>
            </div>
          </div>

          {/* Messages Area */}
          {messages.length > 0 && (
            <div className="w-full max-w-4xl mb-8 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2C303A] text-[#E0E0E0]'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#2C303A] text-[#E0E0E0] px-4 py-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#E0E0E0] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#E0E0E0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#E0E0E0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Section */}
          <div className="w-full max-w-4xl">
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
                { key: 'basic', label: 'Basic' },
                { key: 'medium', label: 'Medium' },
                { key: 'advanced', label: 'Advanced' }
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
  )
}