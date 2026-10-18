import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  PenTool,
  Eye,
  Bold,
  Italic,
  List,
  Check,
  Loader2,
  AlertCircle,
  Save,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface JournalNoteEditorProps {
  insightId: string
  initialNote?: string
  onSave?: (note: string) => void
}

// Minimal markdown → HTML renderer (no dependencies)
function renderMarkdown(text: string): string {
  if (!text) return ''
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-shield-brand/50 pl-3 text-shield-muted italic my-1">$1</blockquote>')

  const bulletLineRe = /^- (.+)$/gm
  html = html.replace(bulletLineRe, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(/(<li[\s\S]+?<\/li>\n?)+/g, (match) => `<ul class="space-y-0.5 my-1">${match}</ul>`)

  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<(ul|blockquote)/.test(block.trim())) return block
      return `<p class="leading-relaxed">${block.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')

  return html
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after = '',
  placeholder = ''
): string {
  const { selectionStart: start, selectionEnd: end, value } = textarea
  const selected = value.slice(start, end) || placeholder
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end)
  const newStart = start + before.length
  const newEnd = newStart + selected.length
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(newStart, newEnd)
  }, 0)
  return newValue
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

async function callUpdateApi(insightId: string, notes: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Not signed in — please refresh and try again.')

  const res = await fetch('/api/ai-insights/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: insightId, notes }),
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) detail = body.error
      if (body?.detail) detail += `: ${body.detail}`
    } catch { /* ignore JSON parse failures */ }
    throw new Error(detail)
  }
}

export function JournalNoteEditor({ insightId, initialNote = '', onSave }: JournalNoteEditorProps) {
  const [note, setNote] = useState(initialNote)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(initialNote)

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [note])

  const persist = useCallback(async (value: string, isRetry = false) => {
    if (value === lastSavedRef.current) return
    setStatus('saving')
    setErrorMsg(null)
    try {
      await callUpdateApi(insightId, value)
      lastSavedRef.current = value
      setStatus('saved')
      onSave?.(value)
    } catch (err: any) {
      if (!isRetry) {
        // One automatic retry after 2 seconds
        setTimeout(() => persist(value, true), 2000)
      } else {
        setStatus('error')
        setErrorMsg(err?.message ?? 'Unknown error')
      }
    }
  }, [insightId, onSave])

  const handleChange = (value: string) => {
    setNote(value)
    setStatus('idle')
    setErrorMsg(null)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(value), 1500)
  }

  const handleManualSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    persist(note)
  }

  const handleRetry = () => persist(note)

  const handleToolbar = (type: 'bold' | 'italic' | 'bullet') => {
    const el = textareaRef.current
    if (!el) return
    let next = note
    if (type === 'bold') next = insertAtCursor(el, '**', '**', 'bold text')
    if (type === 'italic') next = insertAtCursor(el, '*', '*', 'italic text')
    if (type === 'bullet') {
      const { selectionStart: s, value } = el
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      next = value.slice(0, lineStart) + '- ' + value.slice(lineStart)
      setTimeout(() => {
        el.focus()
        el.setSelectionRange(lineStart + 2, lineStart + 2)
      }, 0)
    }
    handleChange(next)
  }

  return (
    <div className="rounded-lg border border-shield-panel bg-shield-surface overflow-hidden">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-shield-panel bg-shield-layer/50">
        <div className="flex items-center gap-1">
          <PenTool className="h-4 w-4 text-shield-brand mr-1.5 shrink-0" />
          <span className="text-sm font-medium text-shield-fg">Journal Note</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Save status */}
          {status === 'saving' && (
            <span className="flex items-center gap-1 text-shield-muted text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />Saving…
            </span>
          )}
          {status === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-600 text-xs">
              <Check className="h-3 w-3" />Saved
            </span>
          )}
          {status === 'error' && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 text-red-500 text-xs hover:text-red-600 transition-colors"
              title={errorMsg ?? 'Save failed'}
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}

          {/* Manual save */}
          {mode === 'edit' && note !== lastSavedRef.current && status !== 'saving' && (
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-shield-brand/15 text-shield-brand hover:bg-shield-brand/25 transition-colors border border-shield-brand/25"
            >
              <Save className="h-3 w-3" />
              Save
            </button>
          )}

          {/* Edit / Preview toggle */}
          <div className="flex items-center rounded-md border border-shield-edge overflow-hidden">
            <button
              onClick={() => setMode('edit')}
              className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                mode === 'edit'
                  ? 'bg-shield-brand/20 text-shield-brand'
                  : 'text-shield-muted hover:text-shield-fg hover:bg-shield-panel'
              }`}
            >
              <PenTool className="h-3 w-3" />Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                mode === 'preview'
                  ? 'bg-shield-brand/20 text-shield-brand'
                  : 'text-shield-muted hover:text-shield-fg hover:bg-shield-panel'
              }`}
            >
              <Eye className="h-3 w-3" />Preview
            </button>
          </div>
        </div>
      </div>

      {/* Format buttons — edit mode only */}
      {mode === 'edit' && (
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-shield-panel/50 bg-shield-layer/30">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleToolbar('bold') }}
            title="Bold (**text**)"
            className="p-1.5 rounded text-shield-muted hover:text-shield-fg hover:bg-shield-panel transition-colors"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleToolbar('italic') }}
            title="Italic (*text*)"
            className="p-1.5 rounded text-shield-muted hover:text-shield-fg hover:bg-shield-panel transition-colors"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleToolbar('bullet') }}
            title="Bullet list (- item)"
            className="p-1.5 rounded text-shield-muted hover:text-shield-fg hover:bg-shield-panel transition-colors"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <span className="ml-2 text-[10px] text-shield-muted/50 select-none">
            **bold** &nbsp;·&nbsp; *italic* &nbsp;·&nbsp; - bullet
          </span>
        </div>
      )}

      {/* Error banner */}
      {status === 'error' && errorMsg && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Save failed: {errorMsg}</span>
        </div>
      )}

      {/* Editor / Preview area */}
      <div className="p-3">
        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your personal reflections, prayers, or study notes here…"
            className="w-full min-h-[120px] bg-transparent text-shield-fg text-sm leading-relaxed placeholder:text-shield-muted/40 resize-none focus:outline-none"
            spellCheck
          />
        ) : (
          <div
            className="min-h-[120px] text-shield-fg text-sm"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: note.trim()
                ? renderMarkdown(note)
                : '<p class="text-shield-muted/40 italic">Nothing written yet.</p>',
            }}
          />
        )}
      </div>
    </div>
  )
}
