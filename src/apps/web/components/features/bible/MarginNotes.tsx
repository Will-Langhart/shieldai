import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Sparkles, Check, PenLine } from 'lucide-react'

interface NoteSlot {
  id?: string
  note: string
  saving: boolean
  saved: boolean
  dirty: boolean
}

interface MarginNotesProps {
  book: string
  chapter: number
  activeVerseNumber: number | null
  userId: string | null
  session: { access_token: string } | null
  verseInsight: string | null
  verseInsightLoading: boolean
}

export function MarginNotes({
  book,
  chapter,
  activeVerseNumber,
  userId,
  session,
  verseInsight,
  verseInsightLoading,
}: MarginNotesProps) {
  // noteSlots: keyed by verse number
  const [noteSlots, setNoteSlots] = useState<Record<number, NoteSlot>>({})
  const [loadingNotes, setLoadingNotes] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)

  // Load all notes for this chapter when book/chapter changes
  useEffect(() => {
    if (!userId) return
    loadChapterNotes()
  }, [book, chapter, userId])

  // Scroll active verse slot into view
  useEffect(() => {
    if (activeVerseNumber !== null && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeVerseNumber])

  const loadChapterNotes = async () => {
    if (!userId) return
    setLoadingNotes(true)
    try {
      const res = await fetch(
        `/api/bible/notes?userId=${encodeURIComponent(userId)}&book=${encodeURIComponent(book)}&chapter=${chapter}`
      )
      if (!res.ok) return
      const data = await res.json()
      const slots: Record<number, NoteSlot> = {}
      for (const n of data.notes || []) {
        // reference is like "Genesis 1:3" — extract verse number
        const match = n.reference.match(/:(\d+)$/)
        if (match) {
          const verseNum = parseInt(match[1])
          slots[verseNum] = { id: n.id, note: n.note || '', saving: false, saved: true, dirty: false }
        }
      }
      setNoteSlots(slots)
    } catch {
      // silently fail — notes are supplemental
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleNoteChange = (verseNum: number, value: string) => {
    setNoteSlots(prev => ({
      ...prev,
      [verseNum]: { ...(prev[verseNum] || { saving: false, saved: false }), note: value, dirty: true, saved: false },
    }))
  }

  const saveNote = useCallback(async (verseNum: number) => {
    if (!userId) return
    const slot = noteSlots[verseNum]
    if (!slot || !slot.dirty) return

    const reference = `${book} ${chapter}:${verseNum}`
    const noteText = slot.note.trim()

    setNoteSlots(prev => ({ ...prev, [verseNum]: { ...prev[verseNum], saving: true } }))

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      if (slot.id) {
        // Update existing note
        await fetch('/api/bible/notes', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: slot.id, reference, note: noteText, userId }),
        })
      } else if (noteText) {
        // Create new note
        const res = await fetch('/api/bible/notes', {
          method: 'POST',
          headers,
          body: JSON.stringify({ reference, note: noteText, userId }),
        })
        if (res.ok) {
          const created = await res.json()
          setNoteSlots(prev => ({
            ...prev,
            [verseNum]: { ...prev[verseNum], id: created.id, saving: false, saved: true, dirty: false },
          }))
          return
        }
      }

      setNoteSlots(prev => ({
        ...prev,
        [verseNum]: { ...prev[verseNum], saving: false, saved: true, dirty: false },
      }))
    } catch {
      setNoteSlots(prev => ({ ...prev, [verseNum]: { ...prev[verseNum], saving: false } }))
    }
  }, [noteSlots, userId, session, book, chapter])

  // All verse numbers that have notes or are active
  const visibleVerses = new Set<number>([
    ...Object.keys(noteSlots).map(Number),
    ...(activeVerseNumber !== null ? [activeVerseNumber] : []),
  ])
  const sortedVerses = Array.from(visibleVerses).sort((a, b) => a - b)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-shield-edge/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <PenLine className="h-3.5 w-3.5 text-shield-accent" />
          <span className="text-[10px] font-semibold text-shield-accent/90 uppercase tracking-[0.16em]">Study Notes</span>
        </div>
        <p className="mt-1 font-scripture text-lg font-semibold text-shield-fg">{book} {chapter}</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loadingNotes && (
          <div className="flex items-center gap-2 text-xs text-shield-muted py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading notes…
          </div>
        )}

        {!loadingNotes && sortedVerses.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-shield-edge px-5 py-8 text-center">
            <PenLine className="mx-auto mb-3 h-5 w-5 text-shield-muted/60" />
            <p className="text-[13px] text-shield-fg/80">No notes in this chapter yet</p>
            <p className="mt-1 text-xs text-shield-muted leading-relaxed">Tap any verse to write a margin note and see an AI insight for it.</p>
          </div>
        )}

        {sortedVerses.map(verseNum => {
          const isActive = verseNum === activeVerseNumber
          const slot = noteSlots[verseNum] || { note: '', saving: false, saved: false, dirty: false }

          return (
            <div
              key={verseNum}
              ref={isActive ? activeRef : undefined}
              className={`rounded-xl border transition-all duration-200 ${
                isActive
                  ? 'border-shield-accent/35 bg-shield-accent/[0.06] shadow-shield-card'
                  : 'border-shield-edge/60 bg-shield-fg/[0.02]'
              }`}
            >
              {/* Verse reference */}
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <span className="font-scripture text-[13px] font-semibold text-shield-fg">
                  {book} {chapter}:{verseNum}
                </span>
                {slot.saving && <Loader2 className="h-3 w-3 animate-spin text-shield-muted" />}
                {slot.saved && !slot.dirty && !slot.saving && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600/90">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                )}
              </div>

              {/* AI verse insight (only for active verse) */}
              {isActive && (verseInsightLoading || verseInsight) && (
                <div className="mx-3 mb-2 rounded-md bg-shield-brand/8 border border-shield-brand/20 px-2.5 py-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-shield-brand" />
                    <span className="text-[10px] font-semibold text-shield-brand uppercase tracking-wider">AI Insight</span>
                  </div>
                  {verseInsightLoading ? (
                    <div className="space-y-1.5">
                      <div className="h-2 rounded bg-shield-muted/20 animate-pulse w-full" />
                      <div className="h-2 rounded bg-shield-muted/20 animate-pulse w-4/5" />
                    </div>
                  ) : (
                    <p className="text-xs text-shield-fg/85 leading-relaxed">{verseInsight}</p>
                  )}
                </div>
              )}

              {/* Note textarea */}
              <div className="px-3 pb-3">
                <textarea
                  value={slot.note}
                  onChange={e => handleNoteChange(verseNum, e.target.value)}
                  onBlur={() => saveNote(verseNum)}
                  placeholder="Write a note…"
                  rows={isActive ? 4 : 2}
                  className="w-full bg-transparent text-[13px] text-shield-fg placeholder-shield-muted/50 resize-none focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
