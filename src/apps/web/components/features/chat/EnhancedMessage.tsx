import React, { useState } from 'react'
import { useMessageInteractions } from '../../../hooks/useConversationTracking'
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import { Markdown } from './Markdown'
import { ShieldMark } from './ShieldMark'

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
    }
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

  // Assistant message — unboxed serif prose; the mark pulses while streaming
  // and the actions row stays visible on the latest reply, hover-only above it.
  return (
    <div className="chat-message-in group mb-8">
      <div className={isStreaming ? 'chat-streaming' : undefined}>
        <Markdown content={message.content} />
      </div>

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
