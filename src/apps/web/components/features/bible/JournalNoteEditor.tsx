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
    // Bold before italic to avoid overlap
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote lines starting with >
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-shield-brand/50 pl-3 text-shield-muted italic my-1">$1</blockquote>')

  // Convert bullet list groups
  const bulletLineRe = /^- (.+)$/gm
  html = html.replace(bulletLineRe, '<li class="ml-4 list-disc">$1</li>')
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[\s\S]+?<\/li>\n?)+/g, (match) => `<ul class="space-y-0.5 my-1">${match}</ul>`)

  // Paragraph breaks on blank lines
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      // Don't wrap blocks that are already block elements
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
  // Restore selection inside the inserted syntax
  const newStart = start + before.length
  const newEnd = newStart + selected.length
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(newStart, newEnd)
  }, 0)
  return newValue
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function JournalNoteEditor({ insightId, initialNote = '', onSave }: JournalNoteEditorProps) {
  const [note, setNote] = useState(initialNote)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [status, setStatus] = useState<SaveStatus>('idle')
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

  const persist = useCallback(async (value: string) => {
    if (value === lastSavedRef.current) return
    setStatus('saving')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/ai-insights/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: insightId, notes: value }),
      })
      if (!res.ok) throw new Error('Save failed')
      lastSavedRef.current = value
      setStatus('saved')
      onSave?.(value)
    } catch {
      setStatus('error')
    }
  }, [insightId, onSave])

  const handleChange = (value: string) => {
    setNote(value)
    setStatus('idle')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(value), 1500)
  }

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

  const statusNode = () => {
    if (status === 'saving') return <span className="flex items-center gap-1 text-shield-muted text-xs"><Loader2 className="h-3 w-3 animate-spin" />Saving…</span>
    if (status === 'saved') return <span className="flex items-center gap-1 text-emerald-400 text-xs"><Check className="h-3 w-3" />Saved</span>
    if (status === 'error') return <span className="flex items-center gap-1 text-red-400 text-xs"><AlertCircle className="h-3 w-3" />Failed to save</span>
    return null
  }

  return (
    <div className="rounded-lg border border-shield-panel bg-shield-surface overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-shield-panel bg-shield-layer/50">
        <div className="flex items-center gap-1">
          <PenTool className="h-4 w-4 text-purple-400 mr-1.5 shrink-0" />
          <span className="text-sm font-medium text-shield-fg">Journal Note</span>
        </div>

        <div className="flex items-center gap-2">
          {statusNode()}

          <div className="flex items-center rounded-md border border-shield-edge overflow-hidden">
            <button
              onClick={() => setMode('edit')}
              title="Edit"
              className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                mode === 'edit'
                  ? 'bg-shield-brand/20 text-shield-brand'
                  : 'text-shield-muted hover:text-shield-fg hover:bg-shield-panel'
              }`}
            >
              <PenTool className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              title="Preview"
              className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                mode === 'preview'
                  ? 'bg-shield-brand/20 text-shield-brand'
                  : 'text-shield-muted hover:text-shield-fg hover:bg-shield-panel'
              }`}
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Format buttons — only in edit mode */}
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
            className="min-h-[120px] text-shield-fg text-sm prose-sm prose-invert"
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
