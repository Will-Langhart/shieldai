import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  BookOpen, Search, ChevronLeft, ChevronRight, Loader2,
  AlertCircle, Sparkles, X, PanelLeft, PanelRight,
  Columns, Volume2, VolumeX,
} from 'lucide-react'
import { DenominationSelector } from '../../ui/DenominationSelector'
import { MarginNotes } from './MarginNotes'
import { AudioPlayer } from './AudioPlayer'
import { useAuth } from '../../../contexts/AuthContext'

// ── Types ──────────────────────────────────────────────────────────────────

interface BibleBook { id: string; name: string; nameLong: string }
interface BibleChapter { id: string; number: string }
interface BibleSection { title: string; firstVerseNum: number }
interface BibleVerse {
  id: string; text: string; reference: string
  verseNumber: number; chapterNumber: number; bookName: string
}
interface BiblePassage {
  id: string; reference: string; text: string
  verses: BibleVerse[]
  version: { id: string; name: string; description: string; language: { id: string; name: string }; type: string }
}
interface BibleSearchResult {
  query: string; total: number
  passages: Array<{ id: string; reference: string; text: string; version: { name: string } }>
}

const DENOMINATION_VERSION_HINTS: Record<string, string[]> = {
  'Protestant':        ['English Standard', 'New International', 'King James'],
  'Catholic':          ['Good News', 'New American Bible', 'Douay'],
  'Oriental Orthodox': ['King James', 'New King James'],
  'Eastern Orthodox':  ['New King James', 'King James'],
}

// ── Helpers ────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function extractVersesFromPassage(passage: any, bookName: string, chapter: number): BibleVerse[] {
  // Prefer JSON content (new path)
  if (passage.content && typeof passage.content !== 'string') {
    return extractFromJSON(passage.content, passage.bookId || bookName, chapter)
  }

  // Fall back: JSON stored as string
  if (passage.content && typeof passage.content === 'string') {
    try {
      const parsed = JSON.parse(passage.content)
      const verses = extractFromJSON(parsed, passage.bookId || bookName, chapter)
      if (verses.length > 0) return verses
    } catch { /* fall through to HTML */ }
  }

  // Last resort: HTML regex parsing
  const content = passage.content || passage.text || ''
  const verses: BibleVerse[] = []

  const regex = /<span[^>]*data-number="(\d+)"[^>]*class="v"[^>]*>\d+<\/span>([^<]*?)(?=<span[^>]*data-number="\d+"[^>]*class="v"|$)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const vNum = parseInt(match[1]); const vText = match[2].trim()
    if (vText) verses.push({ id: `${bookName}.${chapter}.${vNum}`, text: vText, reference: `${bookName} ${chapter}:${vNum}`, verseNumber: vNum, chapterNumber: chapter, bookName })
  }
  if (verses.length === 0) {
    const textContent = stripHtml(content)
    if (textContent) verses.push({ id: `${bookName}.${chapter}.1`, text: textContent, reference: `${bookName} ${chapter}`, verseNumber: 1, chapterNumber: chapter, bookName })
  }
  return verses
}

function extractFromJSON(content: any, bookId: string, chapter: number): BibleVerse[] {
  const verses: BibleVerse[] = []
  const getText = (node: any): string => {
    if (!node) return ''
    if (typeof node === 'string') return node
    if (node.text && typeof node.text === 'string') return node.text
    if (Array.isArray(node.items)) return node.items.map(getText).join('')
    if (Array.isArray(node)) return node.map(getText).join('')
    return ''
  }
  const walk = (node: any) => {
    if (!node) return
    const name = node.name || node.type || ''
    if ((name === 'verse' || (node.attrs && node.attrs.style === 'v')) && node.items) {
      const num = parseInt(node.attrs?.number || node.number || '0', 10)
      const text = getText(node).trim()
      if (num > 0 && text && !verses.find(v => v.verseNumber === num)) {
        verses.push({ id: `${bookId}.${chapter}.${num}`, text, reference: `${bookId} ${chapter}:${num}`, verseNumber: num, chapterNumber: chapter, bookName: bookId })
      }
    }
    if (Array.isArray(node.items)) node.items.forEach(walk)
    if (Array.isArray(node.content)) node.content.forEach(walk)
    if (Array.isArray(node)) node.forEach(walk)
  }
  if (Array.isArray(content)) content.forEach(walk); else walk(content)
  return verses.sort((a, b) => a.verseNumber - b.verseNumber)
}

// ── Component ──────────────────────────────────────────────────────────────

export function Bible() {
  const { user, session } = useAuth()

  // Navigation
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedBookId, setSelectedBookId] = useState('GEN')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [selectedChapterId, setSelectedChapterId] = useState('GEN.1')
  const [selectedVerse, setSelectedVerse] = useState(1)
  const [selectedVersion, setSelectedVersion] = useState('de4e12af7f28f599-01')
  const [availableVersions, setAvailableVersions] = useState<Array<{ id: string; name: string }>>([])

  // Dynamic book/chapter data
  const [books, setBooks] = useState<BibleBook[]>([])
  const [chapters, setChapters] = useState<BibleChapter[]>([])
  const [booksLoading, setBooksLoading] = useState(false)
  const chaptersCache = useRef<Record<string, BibleChapter[]>>({})
  const sectionsCache = useRef<Record<string, BibleSection[]>>({})

  // Passage
  const [currentPassage, setCurrentPassage] = useState<BiblePassage | null>(null)
  const [sections, setSections] = useState<BibleSection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<BibleSearchResult | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Verse interaction / margin notes
  const [activeVerseNumber, setActiveVerseNumber] = useState<number | null>(null)
  const [verseInsight, setVerseInsight] = useState<string | null>(null)
  const [verseInsightLoading, setVerseInsightLoading] = useState(false)
  const verseInsightCache = useRef<Record<string, string>>({})

  // Ambient AI insight
  const [ambientInsight, setAmbientInsight] = useState<string | null>(null)
  const [ambientLoading, setAmbientLoading] = useState(false)

  // Audio
  const [audioBibles, setAudioBibles] = useState<Array<{ id: string; name: string }>>([])
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [showAudio, setShowAudio] = useState(false)
  const audioCache = useRef<Record<string, string>>({})

  // Cross-translation compare
  const [showCompare, setShowCompare] = useState(false)
  const [compareVersion, setCompareVersion] = useState('')
  const [comparePassage, setComparePassage] = useState<BiblePassage | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)

  // Denomination recommendation
  const [denomination, setDenomination] = useState<string | null>(null)
  const [versionRecommendation, setVersionRecommendation] = useState<{ name: string; id: string } | null>(null)

  // Sidebar collapse
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [notesCollapsed, setNotesCollapsed] = useState(false)

  // Reading progress
  const [progressLoaded, setProgressLoaded] = useState(false)

  // ── Boot ──────────────────────────────────────────────────────────────────

  useEffect(() => { loadVersions() }, [])
  useEffect(() => { loadProgress() }, [user])
  useEffect(() => { if (progressLoaded) loadBooks() }, [selectedVersion, progressLoaded])
  useEffect(() => { loadAudioBibles() }, [])

  // ── Versions ──────────────────────────────────────────────────────────────

  const loadVersions = async () => {
    try {
      const res = await fetch('/api/bible/versions')
      const d = await res.json()
      if (d.versions) setAvailableVersions(d.versions)
    } catch { }
  }

  // ── Books (dynamic per version) ───────────────────────────────────────────

  const loadBooks = useCallback(async () => {
    setBooksLoading(true)
    try {
      const res = await fetch(`/api/bible/books?versionId=${selectedVersion}`)
      const d = await res.json()
      if (d.books && d.books.length > 0) {
        setBooks(d.books)
        // Check if selectedBook exists in new list; if not, pick the first
        const found = d.books.find((b: BibleBook) => b.name === selectedBook || b.id === selectedBookId)
        const book = found || d.books[0]
        if (!found) {
          setSelectedBook(book.name); setSelectedBookId(book.id)
          setSelectedChapter(1)
        }
        await loadChapters(book.id, selectedVersion)
      }
    } catch { }
    finally { setBooksLoading(false) }
  }, [selectedVersion, selectedBook, selectedBookId])

  // ── Chapters (dynamic per book) ───────────────────────────────────────────

  const loadChapters = useCallback(async (bookId: string, versionId: string) => {
    const key = `${versionId}-${bookId}`
    if (chaptersCache.current[key]) { setChapters(chaptersCache.current[key]); return }
    try {
      const res = await fetch(`/api/bible/book-chapters?versionId=${versionId}&bookId=${bookId}`)
      const d = await res.json()
      if (d.chapters) {
        chaptersCache.current[key] = d.chapters
        setChapters(d.chapters)
      }
    } catch { }
  }, [])

  // ── Sections ──────────────────────────────────────────────────────────────

  const loadSections = useCallback(async (versionId: string, chapterId: string) => {
    const key = `${versionId}-${chapterId}`
    if (sectionsCache.current[key] !== undefined) { setSections(sectionsCache.current[key]); return }
    try {
      const res = await fetch(`/api/bible/sections?versionId=${versionId}&chapterId=${chapterId}`)
      const d = await res.json()
      const s = d.sections || []
      sectionsCache.current[key] = s
      setSections(s)
    } catch { setSections([]) }
  }, [])

  // ── Audio ─────────────────────────────────────────────────────────────────

  const loadAudioBibles = async () => {
    try {
      const res = await fetch('/api/bible/audio?language=eng')
      const d = await res.json()
      if (d.audioBibles?.length > 0) {
        setAudioBibles(d.audioBibles)
        setSelectedAudioId(d.audioBibles[0].id)
      }
    } catch { }
  }

  const loadAudio = useCallback(async (audioBibleId: string, chapterId: string) => {
    const key = `${audioBibleId}-${chapterId}`
    if (audioCache.current[key]) { setAudioUrl(audioCache.current[key]); return }
    setAudioLoading(true); setAudioUrl(null)
    try {
      const res = await fetch(`/api/bible/audio?audioBibleId=${audioBibleId}&chapterId=${encodeURIComponent(chapterId)}`)
      if (res.ok) {
        const d = await res.json()
        if (d.url) { audioCache.current[key] = d.url; setAudioUrl(d.url) }
      }
    } catch { }
    finally { setAudioLoading(false) }
  }, [])

  useEffect(() => {
    if (showAudio && selectedAudioId && selectedChapterId) loadAudio(selectedAudioId, selectedChapterId)
  }, [showAudio, selectedAudioId, selectedChapterId])

  // ── Reading progress ──────────────────────────────────────────────────────

  const saveProgress = useCallback(async (book: string, chapter: number, verse: number) => {
    if (!user?.id) return
    try {
      await fetch(`/api/bible/preferences?userId=${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_book: book, last_chapter: chapter, last_verse: verse }),
      })
    } catch { }
  }, [user])

  const loadProgress = useCallback(async () => {
    if (!user?.id) { setProgressLoaded(true); return }
    try {
      const res = await fetch(`/api/bible/preferences?userId=${user.id}`)
      if (res.ok) {
        const d = await res.json()
        if (d?.last_book) {
          setSelectedBook(d.last_book); setSelectedChapter(d.last_chapter || 1); setSelectedVerse(d.last_verse || 1)
        }
      }
    } catch { }
    setProgressLoaded(true)
  }, [user])

  // Load passage after progress loads + books ready
  useEffect(() => {
    if (progressLoaded && books.length > 0) {
      const book = books.find(b => b.name === selectedBook) || books[0]
      if (book) {
        setSelectedBookId(book.id)
        loadPassage(book.name, book.id, selectedChapter)
      }
    }
  }, [progressLoaded, books]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Passage loading ───────────────────────────────────────────────────────

  const loadPassage = useCallback(async (bookName: string, bookId: string, chapter: number, verse?: number) => {
    setIsLoading(true); setError(null); setShowSearchResults(false)
    setActiveVerseNumber(null); setVerseInsight(null); setAmbientInsight(null)

    const chapterId = `${bookId}.${chapter}`
    setSelectedChapterId(chapterId)

    try {
      const ref = verse ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`
      const res = await fetch(`/api/bible/passage?reference=${encodeURIComponent(ref)}&versionId=${selectedVersion}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load passage')

      const raw = data.passage || data
      const verses = extractVersesFromPassage(raw, bookName, chapter)

      const versionInfo = availableVersions.find(v => v.id === selectedVersion)
      const passage: BiblePassage = {
        id: raw.id || `${bookId}.${chapter}`,
        reference: raw.reference || `${bookName} ${chapter}`,
        text: verses.map(v => v.text).join(' '),
        verses,
        version: {
          id: selectedVersion,
          name: versionInfo?.name || raw.version?.name || 'Unknown',
          description: '',
          language: raw.version?.language || { id: 'eng', name: 'English' },
          type: 'text',
        },
      }
      setCurrentPassage(passage)
      saveProgress(bookName, chapter, verse || 1)

      // Parallel: sections + ambient insight
      loadSections(selectedVersion, chapterId)
      loadAmbientInsight(passage)

      // Parallel: compare passage if compare is open
      if (showCompare && compareVersion) loadComparePassage(bookName, chapter, compareVersion)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passage')
    } finally {
      setIsLoading(false)
    }
  }, [selectedVersion, availableVersions, showCompare, compareVersion, loadSections])

  // ── Ambient AI insight ────────────────────────────────────────────────────

  const loadAmbientInsight = useCallback(async (passage: BiblePassage) => {
    if (!passage.verses.length) return
    setAmbientLoading(true)
    try {
      const res = await fetch('/api/bible/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage, version: selectedVersion, denomination, compact: true }),
      })
      if (res.ok) {
        const d = await res.json()
        const ins = d.insights || d
        const text = ins.explanation || ins.historicalContext || ins.theologicalMeaning || ''
        if (text) setAmbientInsight(text)
      }
    } catch { }
    finally { setAmbientLoading(false) }
  }, [selectedVersion, denomination])

  // ── Verse insight ─────────────────────────────────────────────────────────

  const loadVerseInsight = useCallback(async (verseNum: number, verseText: string) => {
    const key = `${selectedBookId}-${selectedChapter}-${verseNum}-${denomination || 'none'}`
    if (verseInsightCache.current[key]) { setVerseInsight(verseInsightCache.current[key]); return }
    setVerseInsightLoading(true); setVerseInsight(null)
    try {
      const versePassage: BiblePassage = {
        id: 'verse', reference: `${selectedBook} ${selectedChapter}:${verseNum}`, text: verseText,
        verses: [{ id: 'v', text: verseText, reference: `${selectedBook} ${selectedChapter}:${verseNum}`, verseNumber: verseNum, chapterNumber: selectedChapter, bookName: selectedBook }],
        version: { id: selectedVersion, name: '', description: '', language: { id: 'eng', name: 'English' }, type: 'text' },
      }
      const res = await fetch('/api/bible/ai-insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: versePassage, version: selectedVersion, denomination, compact: true }),
      })
      if (res.ok) {
        const d = await res.json()
        const ins = d.insights || d
        const text = ins.explanation || ins.theologicalMeaning || ''
        if (text) { verseInsightCache.current[key] = text; setVerseInsight(text) }
      }
    } catch { }
    finally { setVerseInsightLoading(false) }
  }, [selectedBook, selectedBookId, selectedChapter, selectedVersion, denomination])

  // ── Compare translation ───────────────────────────────────────────────────

  const loadComparePassage = useCallback(async (bookName: string, chapter: number, versionId: string) => {
    if (!versionId) return
    setCompareLoading(true); setComparePassage(null)
    try {
      const res = await fetch(`/api/bible/passage?reference=${encodeURIComponent(`${bookName} ${chapter}`)}&versionId=${versionId}`)
      const d = await res.json()
      if (res.ok) {
        const raw = d.passage || d
        const verses = extractVersesFromPassage(raw, bookName, chapter)
        const vInfo = availableVersions.find(v => v.id === versionId)
        setComparePassage({
          id: raw.id || '', reference: raw.reference || `${bookName} ${chapter}`,
          text: verses.map(v => v.text).join(' '), verses,
          version: { id: versionId, name: vInfo?.name || '', description: '', language: { id: 'eng', name: 'English' }, type: 'text' },
        })
      }
    } catch { }
    finally { setCompareLoading(false) }
  }, [availableVersions])

  useEffect(() => {
    if (showCompare && compareVersion && currentPassage) loadComparePassage(selectedBook, selectedChapter, compareVersion)
  }, [showCompare, compareVersion])

  // ── Denomination recommendation ───────────────────────────────────────────

  const handleDenominationChange = (newDen: string | null) => {
    setDenomination(newDen); setVersionRecommendation(null)
    if (!newDen) return
    const hints = DENOMINATION_VERSION_HINTS[newDen]
    if (!hints) return
    const curName = availableVersions.find(v => v.id === selectedVersion)?.name || ''
    if (hints.some(h => curName.toLowerCase().includes(h.toLowerCase()))) return
    for (const h of hints) {
      const m = availableVersions.find(v => v.name.toLowerCase().includes(h.toLowerCase()))
      if (m) { setVersionRecommendation({ name: m.name, id: m.id }); return }
    }
  }

  // ── Navigation handlers ───────────────────────────────────────────────────

  const handleBookChange = async (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    if (!book) return
    setSelectedBook(book.name); setSelectedBookId(book.id)
    setSelectedChapter(1); setSelectedVerse(1)
    await loadChapters(book.id, selectedVersion)
    loadPassage(book.name, book.id, 1)
  }

  const handleChapterChange = (chapterNum: number) => {
    setSelectedChapter(chapterNum); setSelectedVerse(1)
    loadPassage(selectedBook, selectedBookId, chapterNum)
  }

  const handleVersionChange = async (versionId: string) => {
    setSelectedVersion(versionId)
    chaptersCache.current = {} // clear chapters cache — different version may have different IDs
    // Books will reload via useEffect on selectedVersion
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowLeft' && selectedChapter > 1) { e.preventDefault(); handleChapterChange(selectedChapter - 1) }
        if (e.key === 'ArrowRight' && selectedChapter < chapters.length) { e.preventDefault(); handleChapterChange(selectedChapter + 1) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedChapter, chapters.length])

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setIsLoading(true); setError(null)
    try {
      const res = await fetch(`/api/bible/search?query=${encodeURIComponent(searchTerm)}&versionId=${selectedVersion}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Search failed')
      setSearchResults(d); setShowSearchResults(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally { setIsLoading(false) }
  }

  // ── Verse click ───────────────────────────────────────────────────────────

  const handleVerseClick = (num: number, text: string) => {
    setActiveVerseNumber(num)
    loadVerseInsight(num, text)
  }

  // ── Section heading lookup ────────────────────────────────────────────────

  const getSectionBefore = (verseNum: number): string | null => {
    const s = sections.find(s => s.firstVerseNum === verseNum)
    return s ? s.title : null
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderVerseList = (verses: BibleVerse[], clickable = true) => (
    <div className="space-y-0.5">
      {verses.map((verse, i) => {
        const heading = getSectionBefore(verse.verseNumber)
        return (
          <React.Fragment key={verse.id || i}>
            {heading && (
              <p className="text-xs font-semibold uppercase tracking-wider text-shield-muted/70 mt-5 mb-2 pl-2 border-l-2 border-shield-brand/30">
                {heading}
              </p>
            )}
            <p className={`text-sm leading-relaxed py-1 px-2 rounded transition-colors ${
              clickable && activeVerseNumber === verse.verseNumber
                ? 'bg-shield-brand/8 border-l-2 border-shield-brand/50'
                : 'hover:bg-shield-panel/40'
            }`}>
              {clickable ? (
                <span
                  className="text-blue-400 font-semibold mr-1.5 cursor-pointer hover:text-blue-300 select-none"
                  onClick={() => handleVerseClick(verse.verseNumber, verse.text)}
                  title="Click to annotate"
                >{verse.verseNumber}.</span>
              ) : (
                <span className="text-shield-muted/60 font-semibold mr-1.5 select-none">{verse.verseNumber}.</span>
              )}
              {verse.text}
            </p>
          </React.Fragment>
        )
      })}
    </div>
  )

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        <span className="ml-2 text-sm text-shield-muted">Loading scripture…</span>
      </div>
    )

    if (showSearchResults && searchResults) return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Results for "{searchResults.query}"</h3>
          <button onClick={() => setShowSearchResults(false)} className="text-sm text-blue-400 hover:text-blue-300">Back to passage</button>
        </div>
        {searchResults.passages.map(p => (
          <div key={p.id} className="p-3 bg-shield-canvas rounded-lg border border-shield-edge">
            <h4 className="text-sm font-semibold text-blue-400 mb-1">{p.reference}</h4>
            <p className="text-sm text-shield-fg leading-relaxed">{p.text}</p>
            <button
              onClick={() => {
                const parts = p.reference.split(' '); const cv = parts.pop()?.split(':') || ['1']
                const bookName = parts.join(' ')
                const bookObj = books.find(b => b.name === bookName)
                const bookId = bookObj?.id || 'GEN'
                setSelectedBook(bookName); setSelectedBookId(bookId)
                setSelectedChapter(parseInt(cv[0])); setSelectedVerse(parseInt(cv[1] || '1'))
                setShowSearchResults(false)
                loadPassage(bookName, bookId, parseInt(cv[0]), parseInt(cv[1] || '1'))
              }}
              className="mt-1.5 text-xs text-blue-400 hover:text-blue-300"
            >Go to passage</button>
          </div>
        ))}
      </div>
    )

    if (currentPassage) return (
      <div>
        {/* Ambient insight */}
        {(ambientLoading || ambientInsight) && (
          <div className="mb-5 rounded-lg border border-shield-brand/20 bg-shield-brand/5 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-shield-brand" />
              <span className="text-xs font-semibold text-shield-brand uppercase tracking-wider">Passage Overview</span>
            </div>
            {ambientLoading ? (
              <div className="space-y-1.5">
                <div className="h-2.5 rounded bg-shield-muted/20 animate-pulse w-full" />
                <div className="h-2.5 rounded bg-shield-muted/20 animate-pulse w-4/5" />
                <div className="h-2.5 rounded bg-shield-muted/20 animate-pulse w-3/5" />
              </div>
            ) : <p className="text-xs text-shield-fg/80 leading-relaxed">{ambientInsight}</p>}
          </div>
        )}

        {/* Main verses */}
        {currentPassage.verses.length > 0 ? renderVerseList(currentPassage.verses) : (
          <div className="text-center py-6">
            <p className="text-sm text-shield-muted">No verses found for this passage</p>
          </div>
        )}

        {/* Compare panel */}
        {showCompare && (
          <div className="mt-6 pt-5 border-t border-shield-edge">
            <div className="flex items-center gap-2 mb-3">
              <Columns className="h-3.5 w-3.5 text-shield-muted" />
              <span className="text-xs font-semibold text-shield-muted uppercase tracking-wider">Compare with</span>
              <select
                value={compareVersion}
                onChange={e => setCompareVersion(e.target.value)}
                className="ml-auto bg-shield-panel border border-shield-edge text-white px-2 py-1 text-xs rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Select version…</option>
                {availableVersions.filter(v => v.id !== selectedVersion).map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            {compareLoading && <div className="flex items-center gap-2 py-4 text-xs text-shield-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>}
            {comparePassage && !compareLoading && (
              <div className="rounded-lg border border-shield-edge bg-shield-canvas/40 px-4 py-3">
                <p className="text-[10px] font-semibold text-shield-muted uppercase tracking-wider mb-2">{comparePassage.version.name}</p>
                {renderVerseList(comparePassage.verses, false)}
              </div>
            )}
          </div>
        )}
      </div>
    )

    return (
      <div className="text-center py-10">
        <BookOpen className="h-10 w-10 text-shield-muted mx-auto mb-3" />
        <p className="text-sm text-shield-muted">Select a passage to begin reading</p>
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  if (error && !currentPassage) return (
    <div className="flex items-center justify-center h-[calc(100vh-48px)] bg-shield-canvas text-white">
      <div className="text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h1 className="text-lg font-bold mb-1">Error Loading Bible</h1>
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded">Reload</button>
      </div>
    </div>
  )

  return (
    <div className="flex bg-shield-canvas text-white" style={{ height: 'calc(100vh - 48px)' }}>

      {/* ── Left nav ───────────────────────────────────────────────────────── */}
      <div className={`${navCollapsed ? 'w-0' : 'w-52'} flex-shrink-0 border-r border-shield-edge bg-shield-panel overflow-y-auto flex flex-col transition-all duration-300`}>
        <div className="p-4 space-y-3 flex-1">
          <p className="text-xs font-semibold text-shield-fg uppercase tracking-wider">Navigation</p>
          <p className="text-[10px] text-shield-muted">⌘ + ← → to change chapter</p>

          {/* Book selector */}
          <div>
            <label className="block text-xs font-medium text-shield-muted mb-1">Book</label>
            {booksLoading ? (
              <div className="flex items-center gap-2 text-xs text-shield-muted py-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</div>
            ) : (
              <select
                value={selectedBookId}
                onChange={e => handleBookChange(e.target.value)}
                className="w-full bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
              >
                {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>

          {/* Chapter selector */}
          <div>
            <label className="block text-xs font-medium text-shield-muted mb-1">Chapter</label>
            <div className="flex items-center gap-1">
              <button onClick={() => selectedChapter > 1 && handleChapterChange(selectedChapter - 1)} disabled={selectedChapter <= 1} className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-600">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="number" value={selectedChapter} min="1" max={chapters.length || 999}
                onChange={e => handleChapterChange(parseInt(e.target.value) || 1)}
                className="flex-1 bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500 text-center"
              />
              <button onClick={() => selectedChapter < chapters.length && handleChapterChange(selectedChapter + 1)} disabled={selectedChapter >= chapters.length} className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-600">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Version selector */}
          <div>
            <label className="block text-xs font-medium text-shield-muted mb-1">Version</label>
            <select
              value={selectedVersion}
              onChange={e => handleVersionChange(e.target.value)}
              className="w-full bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
            >
              {availableVersions.length > 0
                ? availableVersions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)
                : <option value="de4e12af7f28f599-01">King James Version</option>}
            </select>
          </div>

          <button
            onClick={() => loadPassage(selectedBook, selectedBookId, selectedChapter, selectedVerse)}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-1.5 text-sm rounded transition-colors"
          >{isLoading ? 'Loading…' : 'Go to Passage'}</button>

          {/* Audio bible selector */}
          {audioBibles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-shield-muted mb-1">Audio</label>
              <select
                value={selectedAudioId || ''}
                onChange={e => setSelectedAudioId(e.target.value)}
                className="w-full bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
              >
                {audioBibles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="border-t border-shield-edge p-3">
          <DenominationSelector variant="panel" onDenominationChange={handleDenominationChange} />
        </div>
      </div>

      {/* ── Centre content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex-shrink-0 px-3 py-2.5 border-b border-shield-edge flex items-center gap-2">
          <button onClick={() => setNavCollapsed(c => !c)} className="p-1.5 rounded-md hover:bg-shield-elevated text-shield-muted hover:text-shield-fg transition-colors flex-shrink-0" title={navCollapsed ? 'Show navigation' : 'Hide navigation'}>
            <PanelLeft className="h-4 w-4" />
          </button>

          <input
            type="text" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search scripture…"
            className="flex-1 bg-shield-panel border border-shield-edge text-white px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleSearch} disabled={isLoading || !searchTerm.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors flex-shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>

          {/* Audio toggle */}
          {audioBibles.length > 0 && (
            <button onClick={() => setShowAudio(a => !a)} className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${showAudio ? 'bg-shield-brand/15 text-shield-brand' : 'hover:bg-shield-elevated text-shield-muted hover:text-shield-fg'}`} title={showAudio ? 'Hide audio player' : 'Play audio'}>
              {showAudio ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}

          {/* Compare toggle */}
          <button onClick={() => setShowCompare(c => !c)} className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${showCompare ? 'bg-shield-brand/15 text-shield-brand' : 'hover:bg-shield-elevated text-shield-muted hover:text-shield-fg'}`} title={showCompare ? 'Hide compare' : 'Compare translations'}>
            <Columns className="h-4 w-4" />
          </button>

          <button onClick={() => setNotesCollapsed(c => !c)} className="p-1.5 rounded-md hover:bg-shield-elevated text-shield-muted hover:text-shield-fg transition-colors flex-shrink-0" title={notesCollapsed ? 'Show study notes' : 'Hide study notes'}>
            <PanelRight className="h-4 w-4" />
          </button>
        </div>

        {/* Version recommendation banner */}
        {versionRecommendation && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-shield-brand/10 border-b border-shield-brand/20 text-xs">
            <span className="text-shield-fg/80">
              <span className="font-medium text-shield-brand">{denomination}</span> tradition typically reads the <span className="font-medium">{versionRecommendation.name}</span> — switch?
            </span>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <button onClick={() => { handleVersionChange(versionRecommendation.id); setVersionRecommendation(null) }} className="text-shield-brand font-medium hover:underline">Switch</button>
              <button onClick={() => setVersionRecommendation(null)} className="text-shield-muted hover:text-shield-fg"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}

        {/* Passage header */}
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-shield-edge flex items-center justify-between gap-3">
          <h2 className="text-base font-bold truncate">
            {currentPassage ? currentPassage.reference : `${selectedBook} ${selectedChapter}`}
          </h2>
          {currentPassage?.version?.name && (
            <span className="bg-shield-panel px-2 py-0.5 rounded text-[10px] text-shield-muted flex-shrink-0">{currentPassage.version.name}</span>
          )}
        </div>

        {/* Audio player bar */}
        {showAudio && (
          <div className="flex-shrink-0 px-5 py-2 border-b border-shield-edge">
            {audioLoading && (
              <div className="flex items-center gap-2 text-xs text-shield-muted py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading audio…
              </div>
            )}
            {audioUrl && !audioLoading && (
              <AudioPlayer src={audioUrl} label={currentPassage?.reference} />
            )}
            {!audioUrl && !audioLoading && (
              <p className="text-xs text-shield-muted py-1">Audio not available for this chapter in the selected audio Bible.</p>
            )}
          </div>
        )}

        {/* Scrollable passage body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {renderContent()}
        </div>
      </div>

      {/* ── Right margin notes ─────────────────────────────────────────────── */}
      <div className={`${notesCollapsed ? 'w-0' : 'w-72'} flex-shrink-0 border-l border-shield-edge bg-shield-panel/50 overflow-hidden flex flex-col transition-all duration-300`}>
        <MarginNotes
          book={selectedBook}
          chapter={selectedChapter}
          activeVerseNumber={activeVerseNumber}
          userId={user?.id || null}
          session={session}
          verseInsight={verseInsight}
          verseInsightLoading={verseInsightLoading}
        />
      </div>
    </div>
  )
}
