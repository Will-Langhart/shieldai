import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Search, Loader2, ChevronDown } from 'lucide-react'
import { BOOK_GROUPS, getBookMeta, Testament, TESTAMENT_LABEL } from './bookCatalog'

interface LibraryBook { id: string; name: string }
interface LibraryChapter { id: string; number: string }

interface BibleLibraryProps {
  books: LibraryBook[]
  chapters: LibraryChapter[]
  booksLoading: boolean
  selectedBookId: string
  selectedChapter: number
  onSelectBook: (bookId: string) => void
  onSelectChapter: (chapter: number) => void
}

// Canon-ordered book browser: testament tabs, genre groups, and an inline
// chapter grid under the active book.
export function BibleLibrary({
  books, chapters, booksLoading, selectedBookId, selectedChapter, onSelectBook, onSelectChapter,
}: BibleLibraryProps) {
  const [filter, setFilter] = useState('')
  const [testament, setTestament] = useState<Testament>(() => getBookMeta(selectedBookId).testament)
  const activeRef = useRef<HTMLDivElement>(null)

  // Follow the reader when it moves into another testament
  useEffect(() => { setTestament(getBookMeta(selectedBookId).testament) }, [selectedBookId])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedBookId, testament])

  const hasDeutero = books.some(b => getBookMeta(b.id).testament === 'DC')

  const groups = useMemo(() => {
    const byId = new Map(books.map(b => [b.id, b]))
    const q = filter.trim().toLowerCase()
    const match = (b: LibraryBook) => !q || b.name.toLowerCase().includes(q)

    const known = BOOK_GROUPS
      .filter(g => q || g.testament === testament)
      .map(g => ({ label: g.label, testament: g.testament, books: g.ids.map(id => byId.get(id)).filter((b): b is LibraryBook => !!b && match(b)) }))
    const deutero = books.filter(b => getBookMeta(b.id).testament === 'DC' && match(b))
    if (deutero.length && (q || testament === 'DC')) known.push({ label: 'Deuterocanon', testament: 'DC', books: deutero })
    return known.filter(g => g.books.length > 0)
  }, [books, filter, testament])

  const tabs: Testament[] = hasDeutero ? ['OT', 'NT', 'DC'] : ['OT', 'NT']
  const chapterNums = chapters.map(c => parseInt(c.number, 10)).filter(n => !isNaN(n))

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-white/[0.06] p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-shield-muted/70" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Find a book…"
            className="shield-input w-full py-2 pl-9 pr-3 text-sm"
          />
        </div>
        {!filter && (
          <div className="flex rounded-xl border border-white/[0.06] bg-shield-void/40 p-1">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTestament(t)}
                className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold tracking-wide transition-all ${
                  testament === t ? 'bg-shield-elevated text-shield-fg shadow-shield-inset' : 'text-shield-muted hover:text-shield-fg'
                }`}
              >
                {t === 'DC' ? 'Deutero' : TESTAMENT_LABEL[t].replace(' Testament', '')}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {booksLoading && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-shield-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading books…
          </div>
        )}
        {!booksLoading && groups.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-shield-muted">No books match “{filter}”.</p>
        )}

        {groups.map(group => (
          <div key={`${group.testament}-${group.label}`} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-shield-accent/70">{group.label}</p>
            {group.books.map(book => {
              const active = book.id === selectedBookId
              return (
                <div key={book.id} ref={active ? activeRef : undefined}>
                  <button
                    onClick={() => !active && onSelectBook(book.id)}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors ${
                      active ? 'bg-shield-brand/12 font-semibold text-shield-fg' : 'text-shield-fg/75 hover:bg-white/[0.04] hover:text-shield-fg'
                    }`}
                  >
                    <span className="truncate">{book.name}</span>
                    {active && <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-shield-brand" />}
                  </button>
                  {active && chapterNums.length > 0 && (
                    <div className="grid grid-cols-6 gap-1 px-2 pb-3 pt-2">
                      {chapterNums.map(n => (
                        <button
                          key={n}
                          onClick={() => onSelectChapter(n)}
                          className={`aspect-square rounded-md text-[11px] font-medium tabular-nums transition-all ${
                            n === selectedChapter
                              ? 'bg-shield-brand text-white shadow-shield-glow-sm'
                              : 'bg-white/[0.03] text-shield-muted hover:bg-white/[0.08] hover:text-shield-fg'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
