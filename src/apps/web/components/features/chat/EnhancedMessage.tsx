import React, { useState } from 'react'
import { useMessageInteractions } from '../../../hooks/useConversationTracking'
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, Loader2 } from 'lucide-react'
import { Markdown } from './Markdown'
import { ShieldMark } from './ShieldMark'
import { ScriptureWidgets } from './widgets/ScriptureWidgets'
import type { WidgetEnvelope } from '../../../lib/scripture/widgets'

export interface ToolActivity {
  id: string
  name: string
  status: string
  done: boolean
}

/** Live and saved state of a Scripture-agent reply. */
export interface AgentState {
  tools: ToolActivity[]
  widgets: WidgetEnvelope[]
  /** A non-tool step in progress, e.g. "Checking Scripture references". */
  activity?: string | null
}

interface EnhancedMessageProps {
  message: {
    id: string
    content: string
    role: 'user' | 'assistant'
    created_at: string
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
      widgets?: WidgetEnvelope[]
    }
    agent?: AgentState
  }
  onFeedback?: (messageId: string, feedback: string) => void
  onRetry?: () => void
  isLast?: boolean
  /** True while this reply is still streaming in. */
  isStreaming?: boolean
}

export function EnhancedMessage({ message, onRetry, isLast, isStreaming }: EnhancedMessageProps) {
  const [copied, setCopied] = useState(false)

  const { copyMessage, reactToMessage, isTracking } = useMessageInteractions(message.id)

  const isUserMessage = message.role === 'user'
  const interactions = message.metadata?.user_interactions
  const reaction = interactions?.reaction

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      await copyMessage()
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  const handleReaction = async (next: 'helpful' | 'not_helpful') => {
    await reactToMessage(next)
  }

  const actionButton =
    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-shield-elevated hover:text-shield-fg disabled:opacity-50'

  // User message — soft right-aligned bubble in the UI sans
  if (isUserMessage) {
    return (
      <div className="chat-message-in mb-8 flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-shield-elevated px-4 py-2.5 text-[15px] leading-[1.6] text-shield-fg sm:max-w-[75%]">
          {message.content}
        </div>
      </div>
    )
  }

  // Widgets arrive live on `agent`; a reloaded conversation has them in metadata.
  const widgets = message.agent?.widgets ?? message.metadata?.widgets ?? []
  const tools = message.agent?.tools ?? []
  const activity = message.agent?.activity

  // Assistant message — unboxed serif prose; the mark pulses while streaming
  // and the actions row stays visible on the latest reply, hover-only above it.
  return (
    <div className="chat-message-in group mb-8">
      {tools.length > 0 && <ToolActivityRow tools={tools} />}
      <div className={isStreaming ? 'chat-streaming' : undefined}>
        <AnswerBody content={message.content} />
      </div>
      {activity && (
        <div className="mt-2 flex items-center gap-1.5 font-sans text-[12.5px] text-shield-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />{activity}…
        </div>
      )}
      <ScriptureWidgets widgets={widgets} />

      <div className="mt-3 flex h-8 items-center gap-0.5">
        <ShieldMark
          className={`mr-1.5 h-5 w-5 text-shield-brand ${isStreaming ? 'chat-mark-pulse' : ''}`}
        />
        {!isStreaming && (
          <div
            className={`flex items-center gap-0.5 transition-opacity duration-150 ${
              isLast ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            }`}
          >
            <button
              onClick={handleCopy}
              disabled={isTracking}
              className={`${actionButton} text-shield-muted`}
              title="Copy"
            >
              {copied ? <Check className="h-4 w-4 text-shield-brand" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={() => handleReaction('helpful')}
              disabled={isTracking}
              className={`${actionButton} ${reaction === 'helpful' ? 'text-shield-brand' : 'text-shield-muted'}`}
              title="Good response"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleReaction('not_helpful')}
              disabled={isTracking}
              className={`${actionButton} ${reaction === 'not_helpful' ? 'text-red-500' : 'text-shield-muted'}`}
              title="Bad response"
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
            {isLast && onRetry && (
              <button
                onClick={onRetry}
                className={`${actionButton} text-shield-muted`}
                title="Regenerate"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** What the agent looked up, one quiet line per tool call. */
function ToolActivityRow({ tools }: { tools: ToolActivity[] }) {
  return (
    <div className="mb-3 space-y-1">
      {tools.map(t => (
        <div key={t.id} className="flex items-center gap-1.5 font-sans text-[12.5px] text-shield-muted">
          {t.done ? <Check className="h-3.5 w-3.5 text-shield-brand" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span className="truncate">{t.status}</span>
        </div>
      ))}
    </div>
  )
}

const OBJECTION = /^##\s*Objection\s*$/im
const RESPONSE = /^##\s*Response\s*$/im

/**
 * Debate answers that use "## Objection" / "## Response" headings render as two
 * columns on wide screens; everything else is plain markdown.
 */
function AnswerBody({ content }: { content: string }) {
  const o = content.search(OBJECTION)
  const r = content.search(RESPONSE)
  if (o === -1 || r === -1 || r < o) return <Markdown content={content} />

  const intro = content.slice(0, o).trim()
  const objection = content.slice(o, r).replace(OBJECTION, '').trim()
  const response = content.slice(r).replace(RESPONSE, '').trim()
  return (
    <>
      {intro && <Markdown content={intro} />}
      <div className="my-3 grid gap-3 lg:grid-cols-[2fr_3fr]">
        <section className="rounded-xl border border-shield-edge bg-shield-surface/60 px-4 py-3">
          <h3 className="mb-1 font-sans text-[11px] font-medium uppercase tracking-wide text-shield-muted">The objection, at its strongest</h3>
          <Markdown content={objection} />
        </section>
        <section className="rounded-xl border border-shield-brand/30 bg-shield-brand/[0.04] px-4 py-3">
          <h3 className="mb-1 font-sans text-[11px] font-medium uppercase tracking-wide text-shield-brand">Response</h3>
          <Markdown content={response} />
        </section>
      </div>
    </>
  )
}
