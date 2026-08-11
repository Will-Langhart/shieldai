import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { chatService } from '../../../services/chatService'
import { useRouter } from 'next/router'
import { navItems, isActivePath } from '../../layout/navItems'
import { EnhancedMessage } from './EnhancedMessage'
import { DenominationSelector } from '../../ui/DenominationSelector'
import { UserButton } from '../../auth/UserButton'
import {
  Plus,
  Search,
  ChevronDown,
  Send,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  MoreHorizontal,
  X
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0)
  const [thinkingIdx, setThinkingIdx] = useState(0)
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Rotating labels shown while the multi-agent graph works before the first
  // token (retrieval + specialists run first, ~a few seconds), so the wait reads
  // as purposeful rather than slow.
  const thinkingPhrases = [
    'Searching Scripture…',
    'Consulting the specialists…',
    'Weighing the arguments…',
    'Grounding the response…',
  ]

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

  // Sidebar toggle SVG matching Claude's layout icon style
  const SidebarToggleIcon = ({ className = '' }: { className?: string }) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="1.5" y="2" width="15" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
      <line x1="6.5" y1="2.5" x2="6.5" y2="15.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  )

  // Load pinned from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shieldai-pinned')
      if (stored) setPinnedIds(JSON.parse(stored))
    } catch {}
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
        setMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Focus rename input when it opens
  useEffect(() => {
    if (renamingId && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [renamingId])

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      localStorage.setItem('shieldai-pinned', JSON.stringify(next))
      return next
    })
    setMenuOpenId(null)
    setMenuPos(null)
  }

  const startRename = (conv: Conversation) => {
    setRenameValue(conv.title)
    setRenamingId(conv.id)
    setMenuOpenId(null)
    setMenuPos(null)
  }

  const commitRename = async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return }
    try {
      await chatService.updateConversationTitle(renamingId, renameValue.trim())
      await loadConversations()
    } catch {}
    setRenamingId(null)
  }

  const handleDelete = async (id: string) => {
    setMenuOpenId(null)
    setMenuPos(null)
    try {
      await chatService.deleteConversation(id)
      if (currentConversationId === id) {
        setCurrentConversationId(null)
        setMessages([])
      }
      setPinnedIds(prev => prev.filter(p => p !== id))
      await loadConversations()
    } catch {}
  }

  // Cycle through apologetics questions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % apologeticsQuestions.length)
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [])

  // Rotate the "thinking" label while awaiting the assistant's first token.
  useEffect(() => {
    if (!isLoading) { setThinkingIdx(0); return }
    const interval = setInterval(() => {
      setThinkingIdx((prev) => (prev + 1) % thinkingPhrases.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [isLoading])

  // Auto-grow the composer textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [inputMessage])

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

  // Core streaming call — shared by send and regenerate.
  const streamAssistantReply = async (text: string, opts?: { regenerate?: boolean }) => {
    setIsLoading(true)
    try {
      const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      let assistantMessageAdded = false

      await chatService.sendStreamingMessage(
        text,
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
        },
        { regenerate: opts?.regenerate }
      )
    } catch (error) {
      console.error('❌ Error sending message:', error)
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const text = inputMessage
    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: text,
      role: 'user',
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      metadata: {}
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    await streamAssistantReply(text)
  }

  // Regenerate the last assistant reply from the most recent user message.
  // When the conversation is persisted we ask the server for a true
  // regeneration (delete the old reply, regenerate off the same user turn);
  // otherwise we just re-send the last user message.
  const handleRetry = async () => {
    if (isLoading) return
    const lastUserIndex = messages.map(m => m.role).lastIndexOf('user')
    if (lastUserIndex === -1) return
    const lastUserText = messages[lastUserIndex].content
    setMessages(prev => prev.slice(0, lastUserIndex + 1))
    await streamAssistantReply(lastUserText, { regenerate: !!currentConversationId })
  }

  const handleNewTopic = () => {
    setMessages([])
    setCurrentConversationId(null)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedConversations = filteredConversations.filter(c => pinnedIds.includes(c.id))
  const recentConversations = filteredConversations.filter(c => !pinnedIds.includes(c.id))

  const ConversationItem = ({ conv }: { conv: Conversation }) => {
    const isActive = currentConversationId === conv.id
    const isPinned = pinnedIds.includes(conv.id)
    const isMenuOpen = menuOpenId === conv.id
    const isRenaming = renamingId === conv.id

    return (
      <div
        className={`group relative flex items-center rounded-lg px-3 py-2 cursor-pointer transition-colors ${
          isActive
            ? 'bg-shield-elevated text-shield-fg'
            : 'text-shield-muted hover:bg-shield-elevated hover:text-shield-fg'
        }`}
        onClick={() => !isRenaming && loadConversation(conv.id)}
      >
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setRenamingId(null)
            }}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-shield-canvas border border-shield-brand rounded px-2 py-0.5 text-sm text-shield-fg focus:outline-none focus:ring-1 focus:ring-shield-brand"
          />
        ) : (
          <span className="flex-1 text-sm truncate pr-6">{conv.title}</span>
        )}

        {/* "..." menu button — visible on hover or when menu is open */}
        {!isRenaming && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={e => {
                e.stopPropagation()
                if (isMenuOpen) {
                  setMenuOpenId(null)
                  setMenuPos(null)
                } else {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setMenuPos({ x: rect.right, y: rect.bottom })
                  setMenuOpenId(conv.id)
                }
              }}
              className={`p-1 rounded transition-opacity ${
                isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } hover:bg-shield-panel text-shield-muted hover:text-shield-fg`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="shield-page-bg flex h-screen text-shield-fg">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} transition-all duration-300 overflow-hidden border-r border-white/[0.08] bg-shield-panel/75 backdrop-blur-xl flex flex-col flex-shrink-0`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1.5 rounded-md hover:bg-shield-elevated transition-colors text-shield-muted hover:text-shield-fg"
            title="Collapse sidebar"
          >
            <SidebarToggleIcon />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowSearch(s => !s); setSearchQuery('') }}
              className="p-1.5 rounded-md hover:bg-shield-elevated transition-colors text-shield-muted hover:text-shield-fg"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={handleNewTopic}
              className="p-1.5 rounded-md hover:bg-shield-elevated transition-colors text-shield-muted hover:text-shield-fg"
              title="New chat"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search bar (expandable) */}
        {showSearch && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-shield-muted pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search your chats..."
                className="shield-input w-full py-1.5 pl-8 pr-3 text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-shield-muted hover:text-shield-fg">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* New chat row */}
        <button
          onClick={handleNewTopic}
          className="flex items-center gap-2.5 px-3 py-2 mx-2 mb-1 rounded-lg text-sm text-shield-muted hover:bg-shield-elevated hover:text-shield-fg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>

        {/* App navigation */}
        <nav aria-label="Primary" className="px-2 pb-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActivePath(router.pathname, item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-shield-elevated text-shield-fg'
                    : 'text-shield-muted hover:bg-shield-elevated hover:text-shield-fg'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mx-3 my-1 border-t border-shield-edge" />

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-hide space-y-4">
          {/* Pinned section */}
          {pinnedConversations.length > 0 && (
            <div>
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-shield-muted">Pinned</p>
              <div className="space-y-0.5">
                {pinnedConversations.map(conv => <ConversationItem key={conv.id} conv={conv} />)}
              </div>
            </div>
          )}

          {/* Recents section */}
          {recentConversations.length > 0 && (
            <div>
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-shield-muted">Recents</p>
              <div className="space-y-0.5">
                {recentConversations.map(conv => <ConversationItem key={conv.id} conv={conv} />)}
              </div>
            </div>
          )}

          {conversations.length === 0 && (
            <p className="px-3 py-4 text-xs text-shield-muted text-center">No conversations yet</p>
          )}
        </div>

        {/* Bottom: denomination + user */}
        <div className="border-t border-shield-edge px-2 py-3 space-y-2">
          <DenominationSelector variant="sidebar" />
          <UserButton placement="up" />
        </div>
      </div>

      {/* Fixed conversation context menu — rendered outside scroll container to avoid overflow clipping */}
      {menuOpenId && menuPos && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.y + 4, left: menuPos.x - 168 }}
          className="z-[200] w-42 min-w-[168px] rounded-lg border border-shield-edge bg-shield-panel shadow-xl py-1"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => togglePin(menuOpenId)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-shield-fg hover:bg-shield-elevated transition-colors"
          >
            {pinnedIds.includes(menuOpenId) ? <PinOff className="h-3.5 w-3.5 text-shield-muted" /> : <Pin className="h-3.5 w-3.5 text-shield-muted" />}
            {pinnedIds.includes(menuOpenId) ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={() => {
              const conv = conversations.find(c => c.id === menuOpenId)
              if (conv) startRename(conv)
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-shield-fg hover:bg-shield-elevated transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-shield-muted" />
            Rename
          </button>
          <div className="my-1 border-t border-shield-edge" />
          <button
            onClick={() => handleDelete(menuOpenId)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-shield-canvas/90 via-shield-canvas to-shield-panel/70 min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-shield-panel/25 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 rounded-md hover:bg-shield-elevated transition-colors text-shield-muted hover:text-shield-fg"
                title="Open sidebar"
              >
                <SidebarToggleIcon />
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <h1
                className="cursor-pointer bg-gradient-to-r from-shield-brand via-sky-300 to-shield-brand-dim bg-clip-text text-lg font-semibold text-transparent transition-all duration-200 hover:brightness-125"
                onClick={() => router.push('/')}
              >
                Shield AI
              </h1>
              <ChevronDown className="h-4 w-4 text-shield-muted" />
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="w-full max-w-3xl text-center">
                <img src="/logo.png" alt="Shield AI" className="mx-auto mb-5 h-14 w-14 object-contain drop-shadow-[0_0_16px_rgba(70,161,226,0.35)]" />
                <h2 className="mb-2 text-2xl font-semibold text-shield-fg">What can I help with?</h2>
                <p className="text-sm text-shield-muted">Ask a theological question, explore scripture, or test an argument.</p>
                <div className="mx-auto mt-7 flex max-w-xl flex-wrap justify-center gap-2">
                  {apologeticsQuestions.slice(0, 4).map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInputMessage(q)
                        textareaRef.current?.focus()
                      }}
                      className="rounded-full border border-white/[0.08] bg-shield-panel/60 px-4 py-2 text-sm text-shield-muted transition-colors hover:border-shield-brand/40 hover:bg-shield-elevated hover:text-shield-fg"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6">
              {messages.map((message, index) => {
                const isLastAssistant =
                  message.role === 'assistant' && index === messages.length - 1
                return (
                  <EnhancedMessage
                    key={message.id}
                    message={{
                      ...message,
                      created_at: message.created_at || message.timestamp || new Date().toISOString()
                    }}
                    onRetry={handleRetry}
                    isLast={isLastAssistant && !isLoading}
                  />
                )
              })}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="mb-6 flex items-center gap-2.5 py-1">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-shield-muted"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-shield-muted" style={{ animationDelay: '0.15s' }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-shield-muted" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <span className="text-sm text-shield-muted transition-opacity duration-300">{thinkingPhrases[thinkingIdx]}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area — always pinned to bottom */}
        <div className="px-4 pb-4 pt-2">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-3xl border border-white/[0.1] bg-shield-panel/85 px-3 py-2.5 shadow-shield-card backdrop-blur-md transition-colors focus-within:border-shield-brand/45">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={apologeticsQuestions[currentPlaceholderIndex]}
                disabled={isLoading}
                className="max-h-[200px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[15px] leading-6 text-shield-fg placeholder:text-shield-muted focus:outline-none scrollbar-hide"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-shield-brand to-shield-brand-dim text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-shield-muted/70">
              Shield AI can make mistakes. Verify important claims against Scripture.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
