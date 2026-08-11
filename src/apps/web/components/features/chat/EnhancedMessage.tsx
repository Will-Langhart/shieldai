import React, { useState } from 'react'
import { useMessageInteractions } from '../../../hooks/useConversationTracking'
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import { Markdown } from './Markdown'

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
}

export function EnhancedMessage({ message, onRetry, isLast }: EnhancedMessageProps) {
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

  // User message — right-aligned brand bubble, no tail
  if (isUserMessage) {
    return (
      <div className="mb-6 flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-shield-brand px-4 py-2.5 text-[15px] leading-[1.6] text-white shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  // Assistant message — full width, markdown, minimal hover toolbar
  return (
    <div className="group mb-6">
      <Markdown content={message.content} />

      <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
        <button
          onClick={handleCopy}
          disabled={isTracking}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-shield-muted transition-colors hover:bg-shield-elevated hover:text-shield-fg"
          title="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-shield-brand" /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          onClick={() => handleReaction('helpful')}
          disabled={isTracking}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-shield-elevated hover:text-shield-fg ${
            reaction === 'helpful' ? 'text-shield-brand' : 'text-shield-muted'
          }`}
          title="Good response"
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleReaction('not_helpful')}
          disabled={isTracking}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-shield-elevated hover:text-shield-fg ${
            reaction === 'not_helpful' ? 'text-red-400' : 'text-shield-muted'
          }`}
          title="Bad response"
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
        {isLast && onRetry && (
          <button
            onClick={onRetry}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-shield-muted transition-colors hover:bg-shield-elevated hover:text-shield-fg"
            title="Regenerate"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
