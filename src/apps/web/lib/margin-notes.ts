export interface NoteSlot {
  id?: string
  note: string
  saving: boolean
  saved: boolean
  dirty: boolean
}

export interface ChapterNote {
  id?: string
  reference?: string | null
  note?: string | null
}

/**
 * Turns the `notes` array from `/api/bible/notes` into slots keyed by verse
 * number. The verse comes from the end of `reference` ("Genesis 1:3" -> 3);
 * notes without a `:<number>` ending are skipped.
 */
export function notesToSlots(notes: ChapterNote[] | null | undefined): Record<number, NoteSlot> {
  const slots: Record<number, NoteSlot> = {}
  for (const n of notes || []) {
    if (typeof n?.reference !== 'string') continue
    const match = n.reference.match(/:(\d+)$/)
    if (!match) continue
    const verseNum = parseInt(match[1], 10)
    slots[verseNum] = { id: n.id, note: n.note || '', saving: false, saved: true, dirty: false }
  }
  return slots
}
