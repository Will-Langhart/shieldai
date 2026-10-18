import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { chatService } from '../../../services/chatService'
import { useRouter } from 'next/router'
import { navItems, isActivePath } from '../../layout/navItems'
import { EnhancedMessage } from './EnhancedMessage'
import { ShieldMark } from './ShieldMark'
import { DenominationSelector } from '../../ui/DenominationSelector'
import { UserButton } from '../../auth/UserButton'
import { AuthModal } from '../../auth/AuthModal'
import { useWarmTheme } from '../../../hooks/useWarmTheme'
import {
  Plus,
  Search,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Check,
  Feather,
  GraduationCap,
  Swords,
  Star,
  StarOff,
  Pencil,
  Trash2,
  MoreHorizontal,
  X,
  Sun,
  Moon,
  Monitor
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

// Holds a signed-out user's message while they authenticate. sessionStorage
// (not state) so it survives the full-page OAuth redirect.
const PENDING_MESSAGE_KEY = 'shieldai-pending-message'
const SIDEBAR_KEY = 'shieldai-sidebar-collapsed'

type ChatMode = 'gentle' | 'scholarly' | 'debate'

// Plan gating is enforced server-side (lib/chat-access.ts); `plan` is just a hint.
const MODES: { value: ChatMode; label: string; description: string; plan?: string; icon: typeof Feather }[] = [
  { value: 'gentle', label: 'Gentle', description: 'Warm, pastoral answers', icon: Feather },
  { value: 'scholarly', label: 'Scholarly', description: 'Deeper sources and argument', plan: 'Student', icon: GraduationCap },
  { value: 'debate', label: 'Debate', description: 'Steel-man objections, then respond', plan: 'Scholar', icon: Swords },
]

function timeOfDayGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Peace be with you'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// Buckets conversations Claude-style by last activity. Input is assumed to be
// sorted newest-first (as chatService returns it); order is preserved within
// each bucket.
function groupByRecency<T extends { updated_at: string }>(items: T[]) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const day = 24 * 60 * 60 * 1000
  const groups: { label: string; items: T[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Previous 30 days', items: [] },
    { label: 'Older', items: [] },
  ]
  for (const item of items) {
    const t = new Date(item.updated_at).getTime()
    const idx =
      t >= startOfToday.getTime() ? 0
      : t >= startOfToday.getTime() - day ? 1
      : t >= startOfToday.getTime() - 7 * day ? 2
      : t >= startOfToday.getTime() - 30 * day ? 3
      : 4
    groups[idx].items.push(item)
  }
  return groups.filter(g => g.items.length > 0)
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export function Chat() {
  const { user, session, loading: authLoading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<ChatMode>('gentle')
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [greeting, setGreeting] = useState('Welcome')
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
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { pref: themePref, cycle: cycleTheme, themeAttr } = useWarmTheme()
  const authSucceededRef = useRef(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)
  // Follow the stream only while the reader is already at the bottom.
  const stickToBottomRef = useRef(true)

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

  // Load pinned and sidebar preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shieldai-pinned')
      if (stored) setPinnedIds(JSON.parse(stored))
      setGreeting(timeOfDayGreeting())
      // The drawer always starts closed on phones; desktop remembers the rail state.
      if (window.innerWidth >= 768 && localStorage.getItem(SIDEBAR_KEY) === 'false') {
        setSidebarCollapsed(false)
      }
    } catch {}
  }, [])

  const setSidebar = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
    try {
      if (window.innerWidth >= 768) localStorage.setItem(SIDEBAR_KEY, String(collapsed))
    } catch {}
  }

  // On phones the sidebar is an overlay drawer, so close it after navigating.
  const closeDrawerOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarCollapsed(true)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
        setMenuPos(null)
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false)
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

  // Keep the latest message in view as the conversation grows — unless the
  // reader has scrolled up to re-read something.
  useEffect(() => {
    if (stickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: isLoading ? 'auto' : 'smooth', block: 'end' })
    }
  }, [messages, isLoading])

  const handleMessagesScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 80
    setShowScrollDown(distance > 240)
  }

  const scrollToBottom = () => {
    stickToBottomRef.current = true
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  // Pre-fill the composer from ?q= (set by the landing-page demo), then drop
  // the param so a refresh doesn't re-fill it. Not auto-sent, so it never
  // spends a free-tier message without the user pressing send.
  useEffect(() => {
    if (!router.isReady) return
    const q = router.query.q
    if (typeof q !== 'string' || !q.trim()) return
    setInputMessage(q.slice(0, 500))
    textareaRef.current?.focus()
    const { q: _q, ...rest } = router.query
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
  }, [router.isReady, router.query.q])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [session])

  const loadConversations = async () => {
    if (!session) {
      setConversations([])
      return
    }
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
              ? { ...msg, content: error.name === 'UpgradeRequired' ? error.message : 'Sorry, I encountered an error. Please try again.' }
              : msg
          ))
        },
        { regenerate: opts?.regenerate }
      )
    } catch (error) {
      console.error('❌ Error sending message:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: error instanceof Error && error.name === 'UpgradeRequired'
          ? error.message
          : 'Sorry, I encountered an error. Please try again.',
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

  const sendText = async (text: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: text,
      role: 'user',
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      metadata: {}
    }

    stickToBottomRef.current = true
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    await streamAssistantReply(text)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Signed-out users can compose, but must authenticate before sending.
    if (!user) {
      try { sessionStorage.setItem(PENDING_MESSAGE_KEY, inputMessage) } catch {}
      setShowAuthModal(true)
      return
    }

    await sendText(inputMessage)
  }

  // Once the user is signed in (via the modal or back from an OAuth redirect),
  // send the message they tried to send while signed out.
  useEffect(() => {
    if (authLoading || !user) return
    let pending: string | null = null
    try {
      pending = sessionStorage.getItem(PENDING_MESSAGE_KEY)
      sessionStorage.removeItem(PENDING_MESSAGE_KEY)
    } catch {}
    if (pending?.trim()) {
      setShowAuthModal(false)
      sendText(pending)
    }
  }, [user, authLoading])

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
    closeDrawerOnMobile()
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const openSearch = () => {
    setSidebar(false)
    setShowSearch(true)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const starredConversations = filteredConversations.filter(c => pinnedIds.includes(c.id))
  const recencyGroups = groupByRecency(filteredConversations.filter(c => !pinnedIds.includes(c.id)))
  const currentTitle = conversations.find(c => c.id === currentConversationId)?.title
  // The chat page itself is where the user already is; the rest are app links.
  const appLinks = navItems.filter(item => item.path !== '/chat')

  const ThemeIcon = themePref === 'light' ? Sun : themePref === 'dark' ? Moon : Monitor
  const themeLabel = themePref === 'light' ? 'Light' : themePref === 'dark' ? 'Dark' : 'System'

  const userInitial =
    (user?.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase()

  // Plain render function (not a component) so the rename input keeps focus
  // across parent re-renders instead of remounting.
  const renderConversation = (conv: Conversation) => {
    const isActive = currentConversationId === conv.id
    const isMenuOpen = menuOpenId === conv.id
    const isRenaming = renamingId === conv.id

    return (
      <div
        key={conv.id}
        className={`group relative flex items-center rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors ${
          isActive
            ? 'bg-shield-elevated text-shield-fg'
            : 'text-shield-fg/80 hover:bg-shield-elevated/70 hover:text-shield-fg'
        }`}
        onClick={() => {
          if (isRenaming) return
          loadConversation(conv.id)
          closeDrawerOnMobile()
        }}
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
            className="flex-1 rounded border border-shield-brand bg-shield-surface px-2 py-0.5 text-[13px] text-shield-fg focus:outline-none focus:ring-1 focus:ring-shield-brand"
          />
        ) : (
          <span className="flex-1 truncate pr-6 text-[13px]">{conv.title}</span>
        )}

        {!isRenaming && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
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
              className={`rounded p-1 transition-opacity ${
                isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } text-shield-muted hover:bg-shield-canvas hover:text-shield-fg`}
              title="More"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.trim().split(/\s+/)[0]
  const activeMode = MODES.find(m => m.value === selectedMode) ?? MODES[0]
  const ActiveModeIcon = activeMode.icon

  // Shared by the centered hero and the bottom-pinned layout.
  const renderComposer = (hero: boolean) => (
    <div className="rounded-2xl border border-shield-edge bg-shield-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_30px_-14px_rgba(0,0,0,0.18)] transition-colors focus-within:border-shield-edge-strong">
      <textarea
        ref={textareaRef}
        rows={hero ? 2 : 1}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
          }
        }}
        placeholder={hero ? apologeticsQuestions[currentPlaceholderIndex] : 'Reply to Shield AI…'}
        className={`block max-h-[200px] w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-6 text-shield-fg placeholder:text-shield-muted/80 focus:outline-none scrollbar-hide ${
          hero ? 'min-h-[60px]' : 'min-h-[28px]'
        }`}
      />
      <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-1.5">
        {/* Mode pill */}
        <div ref={modeMenuRef} className="relative">
          <button
            onClick={() => setModeMenuOpen(o => !o)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-shield-muted transition-colors hover:bg-shield-elevated hover:text-shield-fg"
            title="Response style"
          >
            <ActiveModeIcon className="h-3.5 w-3.5" />
            {activeMode.label}
            <ChevronDown className={`h-3 w-3 transition-transform ${modeMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {modeMenuOpen && (
            <div
              className={`absolute left-0 z-50 w-64 overflow-hidden rounded-xl border border-shield-edge bg-shield-surface py-1 shadow-xl ${
                hero ? 'top-full mt-2' : 'bottom-full mb-2'
              }`}
            >
              {MODES.map(mode => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.value}
                    onClick={() => { setSelectedMode(mode.value); setModeMenuOpen(false) }}
                    className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-shield-elevated"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-shield-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-shield-fg">
                        {mode.label}
                        {mode.plan && (
                          <span className="rounded border border-shield-edge px-1 py-px text-[10px] font-normal text-shield-muted">
                            {mode.plan}+
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-shield-muted">{mode.description}</span>
                    </span>
                    {selectedMode === mode.value && <Check className="mt-0.5 h-4 w-4 shrink-0 text-shield-brand" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DenominationSelector variant="pill" />

        <div className="flex-1" />

        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-shield-brand text-shield-on-brand transition-all hover:bg-shield-brand-dim disabled:cursor-not-allowed disabled:opacity-35"
          title="Send"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )

  const railButton = 'flex h-9 w-9 items-center justify-center rounded-lg text-shield-muted transition-colors hover:bg-shield-elevated hover:text-shield-fg'
  const expanded = !sidebarCollapsed

  return (
    <div
      className="warm-theme flex h-screen bg-shield-canvas text-shield-fg"
      {...themeAttr}
    >
      {/* Mobile drawer backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar — full panel when expanded, icon rail when collapsed (desktop),
          off-canvas drawer on phones. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-shrink-0 flex-col border-r border-shield-edge/70 bg-shield-panel transition-[width,transform] duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
          expanded ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:w-[52px]'
        }`}
      >
        {expanded ? (
          <>
            {/* Header: brand + collapse */}
            <div className="flex items-center justify-between px-3 pb-1 pt-3">
              <Link href="/" className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-opacity hover:opacity-80">
                <img src="/logo.png" alt="" className="h-7 w-7 rounded-lg" />
                <span className="font-serif text-[17px] font-semibold tracking-tight text-shield-fg">Shield AI</span>
              </Link>
              <button onClick={() => setSidebar(true)} className={railButton} title="Close sidebar">
                <SidebarToggleIcon />
              </button>
            </div>

            {/* New chat — the primary action */}
            <div className="px-2 pt-2">
              <button
                onClick={handleNewTopic}
                className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[14px] font-medium text-shield-brand transition-colors hover:bg-shield-elevated/70"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-shield-brand text-shield-on-brand transition-transform group-hover:scale-105">
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </span>
                New chat
              </button>
            </div>

            {/* Search + compact app links */}
            <nav aria-label="Primary" className="space-y-px px-2 pb-2 pt-1">
              {showSearch ? (
                <div className="relative py-0.5">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-shield-muted" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setShowSearch(false); setSearchQuery('') }
                    }}
                    placeholder="Search chats…"
                    className="w-full rounded-lg border border-shield-edge bg-shield-surface py-1.5 pl-8 pr-7 text-[13px] text-shield-fg placeholder:text-shield-muted focus:border-shield-brand/60 focus:outline-none"
                  />
                  <button
                    onClick={() => { setShowSearch(false); setSearchQuery('') }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-shield-muted hover:text-shield-fg"
                    title="Close search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-shield-fg/80 transition-colors hover:bg-shield-elevated/70 hover:text-shield-fg"
                >
                  <Search className="h-4 w-4 text-shield-muted" />
                  Search chats
                </button>
              )}
              {appLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-shield-fg/80 transition-colors hover:bg-shield-elevated/70 hover:text-shield-fg"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-shield-muted" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Conversation list */}
            <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-3 pt-2 scrollbar-hide">
              {starredConversations.length > 0 && (
                <section>
                  <h3 className="px-2.5 pb-1 text-[11px] font-medium text-shield-muted">Starred</h3>
                  <div className="space-y-px">{starredConversations.map(renderConversation)}</div>
                </section>
              )}

              {recencyGroups.map(group => (
                <section key={group.label}>
                  <h3 className="px-2.5 pb-1 text-[11px] font-medium text-shield-muted">{group.label}</h3>
                  <div className="space-y-px">{group.items.map(renderConversation)}</div>
                </section>
              ))}

              {conversations.length === 0 && (
                <p className="px-2.5 py-4 text-[12px] leading-relaxed text-shield-muted">
                  {user ? 'Your conversations will appear here.' : 'Sign in to keep your conversations.'}
                </p>
              )}
              {conversations.length > 0 && filteredConversations.length === 0 && (
                <p className="px-2.5 py-4 text-[12px] text-shield-muted">No chats match “{searchQuery}”.</p>
              )}
            </div>

            {/* Footer: account + theme */}
            <div className="border-t border-shield-edge/70 px-2 py-2">
              <div className="flex items-center gap-1">
                <div className="min-w-0 flex-1">
                  <UserButton placement="up" />
                </div>
                <button onClick={cycleTheme} className={railButton} title={`Theme: ${themeLabel}`}>
                  <ThemeIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Collapsed icon rail (desktop only) */
          <div className="flex h-full flex-col items-center gap-1 py-3">
            <button onClick={() => setSidebar(false)} className={railButton} title="Open sidebar">
              <SidebarToggleIcon />
            </button>
            <button
              onClick={handleNewTopic}
              className="my-1 flex h-8 w-8 items-center justify-center rounded-full bg-shield-brand text-shield-on-brand transition-transform hover:scale-105"
              title="New chat"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button onClick={openSearch} className={railButton} title="Search chats">
              <Search className="h-4 w-4" />
            </button>
            {appLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.path} href={item.path} className={railButton} title={item.label}>
                  <Icon className="h-4 w-4" />
                </Link>
              )
            })}
            <div className="flex-1" />
            <button onClick={cycleTheme} className={railButton} title={`Theme: ${themeLabel}`}>
              <ThemeIcon className="h-4 w-4" />
            </button>
            {user && (
              <button
                onClick={() => setSidebar(false)}
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-shield-fg text-[13px] font-semibold text-shield-canvas"
                title={user.email || 'Account'}
              >
                {userInitial}
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Fixed conversation context menu — rendered outside scroll container to avoid overflow clipping */}
      {menuOpenId && menuPos && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.y + 4, left: Math.max(8, menuPos.x - 168) }}
          className="z-[200] min-w-[168px] rounded-xl border border-shield-edge bg-shield-surface py-1 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => togglePin(menuOpenId)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-shield-fg transition-colors hover:bg-shield-elevated"
          >
            {pinnedIds.includes(menuOpenId) ? <StarOff className="h-3.5 w-3.5 text-shield-muted" /> : <Star className="h-3.5 w-3.5 text-shield-muted" />}
            {pinnedIds.includes(menuOpenId) ? 'Unstar' : 'Star'}
          </button>
          <button
            onClick={() => {
              const conv = conversations.find(c => c.id === menuOpenId)
              if (conv) startRename(conv)
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-shield-fg transition-colors hover:bg-shield-elevated"
          >
            <Pencil className="h-3.5 w-3.5 text-shield-muted" />
            Rename
          </button>
          <div className="my-1 border-t border-shield-edge" />
          <button
            onClick={() => handleDelete(menuOpenId)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-shield-canvas">
        {/* Top Bar */}
        <div className="flex h-12 items-center gap-2 px-3">
          <button
            onClick={() => setSidebar(false)}
            className={`${railButton} md:hidden`}
            title="Open sidebar"
          >
            <SidebarToggleIcon />
          </button>
          {currentTitle ? (
            <h1 className="flex min-w-0 items-center gap-1 truncate rounded-lg px-2 py-1 text-[14px] text-shield-fg">
              <span className="truncate">{currentTitle}</span>
            </h1>
          ) : (
            <Link href="/" className="font-serif text-[16px] font-semibold text-shield-fg md:hidden">
              Shield AI
            </Link>
          )}
        </div>

        {messages.length === 0 ? (
          /* Empty state — greeting hero with the composer centered under it */
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-4">
            <div className="flex w-full max-w-2xl flex-1 flex-col justify-center pb-[10vh] pt-6">
              <h2 className="chat-message-in mb-7 flex items-center justify-center gap-3 text-center font-serif text-[1.9rem] font-normal leading-tight tracking-tight text-shield-fg sm:text-[2.4rem]">
                <ShieldMark className="h-9 w-9 shrink-0 text-shield-brand sm:h-10 sm:w-10" />
                <span>
                  {greeting}
                  {firstName ? `, ${firstName}` : ''}
                </span>
              </h2>
              {renderComposer(true)}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {apologeticsQuestions.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInputMessage(q)
                      textareaRef.current?.focus()
                    }}
                    className="rounded-lg border border-shield-edge px-3 py-1.5 text-[13px] text-shield-muted transition-colors hover:border-shield-edge-strong hover:bg-shield-elevated/60 hover:text-shield-fg"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="relative min-h-0 flex-1">
              <div ref={scrollRef} onScroll={handleMessagesScroll} className="h-full overflow-y-auto">
                <div className="mx-auto max-w-3xl px-4 pb-4 pt-4 sm:px-6">
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
                        isStreaming={isLastAssistant && isLoading}
                      />
                    )
                  })}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="chat-message-in mb-8 flex items-center gap-2.5">
                      <ShieldMark className="chat-mark-pulse h-5 w-5 text-shield-brand" />
                      <span key={thinkingIdx} className="chat-shimmer chat-message-in font-serif text-[15px] italic">
                        {thinkingPhrases[thinkingIdx]}
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {showScrollDown && (
                <button
                  onClick={scrollToBottom}
                  className="chat-message-in absolute bottom-3 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-shield-edge bg-shield-surface text-shield-muted shadow-md transition-colors hover:text-shield-fg"
                  title="Scroll to latest"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Composer — pinned to the bottom once a conversation starts */}
            <div className="px-4 pb-3 pt-1 sm:px-6">
              <div className="mx-auto max-w-3xl">
                {renderComposer(false)}
                <p className="mt-2 text-center text-[11px] text-shield-muted/80">
                  Shield AI can make mistakes. Verify important claims against Scripture.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          initialView="signup"
          // AuthModal calls onSuccess then onClose; keep the pending message on
          // success so the signed-in effect can send it.
          onSuccess={() => { authSucceededRef.current = true }}
          onClose={() => {
            setShowAuthModal(false)
            if (!authSucceededRef.current) {
              try { sessionStorage.removeItem(PENDING_MESSAGE_KEY) } catch {}
            }
          }}
        />
      )}
    </div>
  )
}
