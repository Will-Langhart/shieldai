import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  BookOpen, Search, ChevronLeft, ChevronRight, Loader2,
  AlertCircle, X, PanelLeft, PanelRight, Columns, Headphones,
  Type, Copy, Check, PenLine, ArrowLeft, Minus, Plus,
} from 'lucide-react'
import { DenominationSelector } from '../../ui/DenominationSelector'
import { MarginNotes } from './MarginNotes'
import { AudioPlayer } from './AudioPlayer'
import { BibleLibrary } from './BibleLibrary'
import { PassageInsightCard, PassageInsight } from './PassageInsightCard'
import { getBookMeta, TESTAMENT_LABEL } from './bookCatalog'
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

interface ReaderSettings {
  size: number                       // index into FONT_SIZES
  leading: 'compact' | 'relaxed' | 'airy'
  font: 'serif' | 'sans'
  layout: 'paragraph' | 'verse'
  showNumbers: boolean
}

const DENOMINATION_VERSION_HINTS: Record<string, string[]> = {
  'Protestant':        ['English Standard', 'New International', 'King James'],
  'Catholic':          ['Good News', 'New American Bible', 'Douay'],
  'Oriental Orthodox': ['King James', 'New King James'],
  'Eastern Orthodox':  ['New King James', 'King James'],
}

const FONT_SIZES = [15, 17, 19, 21, 24]
const LEADING = { compact: 1.65, relaxed: 1.9, airy: 2.15 }
const DEFAULT_SETTINGS: ReaderSettings = { size: 2, leading: 'relaxed', font: 'serif', layout: 'paragraph', showNumbers: true }
const SETTINGS_KEY = 'shield.bible.reader'

// ── Helpers ────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractVersesFromPassage(passage: any, bookName: string, chapter: number): BibleVerse[] {
  const html: string = passage.content || passage.text || ''
  if (!html) return []

  const verses: BibleVerse[] = []
  const makeVerse = (num: number, text: string): BibleVerse => ({
    id: `${bookName}.${chapter}.${num}`,
    text: text.trim(),
    reference: `${bookName} ${chapter}:${num}`,
    verseNumber: num,
    chapterNumber: chapter,
    bookName,
  })

  // Strategy 1: <span data-number="N" ...> with verse spans (include-verse-spans=true)
  // Collects ALL text between consecutive verse-number spans
  const spanRegex = /<span[^>]*data-number="(\d+)"[^>]*>/g
  const spanMatches: Array<{ num: number; index: number }> = []
  let m: RegExpExecArray | null
  while ((m = spanRegex.exec(html)) !== null) {
    const num = parseInt(m[1], 10)
    if (num > 0) spanMatches.push({ num, index: m.index })
  }

  if (spanMatches.length > 0) {
    for (let i = 0; i < spanMatches.length; i++) {
      const start = spanMatches[i].index
      const end = i + 1 < spanMatches.length ? spanMatches[i + 1].index : html.length
      const chunk = html.slice(start, end)
      // Strip all tags and leading verse-number digits
      const text = stripHtml(chunk).replace(/^\d+\s*/, '').trim()
      if (text) verses.push(makeVerse(spanMatches[i].num, text))
    }
    if (verses.length > 0) return verses
  }

  // Strategy 2: plain numbered text — "1 In the beginning..." (text content-type)
  const lines = stripHtml(html).split(/(?=\b\d+\s+\p{Lu})/u)
  for (const line of lines) {
    const lm = line.match(/^(\d+)\s+(.+)/)
    if (lm) {
      const num = parseInt(lm[1], 10)
      if (num > 0 && num < 200) verses.push(makeVerse(num, lm[2].trim()))
    }
  }
  if (verses.length > 0) return verses

  // Strategy 3: full text as a single block
  const fullText = stripHtml(html)
  if (fullText) return [makeVerse(1, fullText)]
  return []
}

// "1 John 3:16-18" → { book: '1 John', chapter: 3, verse: 16 }
function parseReference(ref: string): { book: string; chapter: number; verse?: number } | null {
  const m = ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+))?/)
  if (!m) return null
  return { book: m[1], chapter: parseInt(m[2], 10), verse: m[3] ? parseInt(m[3], 10) : undefined }
}

function highlight(text: string, query: string) {
  const q = query.trim()
  if (!q) return text
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="rounded bg-shield-accent/25 px-0.5 text-shield-fg">{p}</mark>
      : <React.Fragment key={i}>{p}</React.Fragment>
  )
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
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Verse interaction / margin notes
  const [activeVerseNumber, setActiveVerseNumber] = useState<number | null>(null)
  const [verseInsight, setVerseInsight] = useState<string | null>(null)
  const [verseInsightLoading, setVerseInsightLoading] = useState(false)
  const verseInsightCache = useRef<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const pendingVerseFocus = useRef<number | null>(null)

  // Ambient AI insight
  const [ambientInsight, setAmbientInsight] = useState<PassageInsight | null>(null)
  const [ambientLoading, setAmbientLoading] = useState(false)
  const [insightFailed, setInsightFailed] = useState(false)

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

  // Layout
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [notesCollapsed, setNotesCollapsed] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Reading progress
  const [progressLoaded, setProgressLoaded] = useState(false)

  // ── Boot ──────────────────────────────────────────────────────────────────

  useEffect(() => { loadVersions() }, [])
  useEffect(() => { loadProgress() }, [user])
  useEffect(() => { if (progressLoaded) loadBooks() }, [selectedVersion, progressLoaded])
  useEffect(() => { loadAudioBibles() }, [])

  // Side panels become overlay drawers below the lg breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const apply = () => {
      setIsNarrow(mq.matches)
      setNavCollapsed(mq.matches); setNotesCollapsed(mq.matches)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
    } catch { }
  }, [])

  const updateSettings = (patch: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) } catch { }
      return next
    })
  }

  useEffect(() => {
    if (!settingsOpen) return
    const close = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [settingsOpen])

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

  const loadChapters = useCallback(async (bookId: string, versionId: string): Promise<BibleChapter[]> => {
    const key = `${versionId}-${bookId}`
    if (chaptersCache.current[key]) { setChapters(chaptersCache.current[key]); return chaptersCache.current[key] }
    try {
      const res = await fetch(`/api/bible/book-chapters?versionId=${versionId}&bookId=${bookId}`)
      const d = await res.json()
      if (d.chapters) {
        chaptersCache.current[key] = d.chapters
        setChapters(d.chapters)
        return d.chapters
      }
    } catch { }
    return []
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
    setActiveVerseNumber(null); setVerseInsight(null); setAmbientInsight(null); setInsightFailed(false)

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
      scrollRef.current?.scrollTo({ top: 0 })
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
    setInsightFailed(false)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/bible/ai-insights', {
        method: 'POST',
        headers,
        body: JSON.stringify({ passage, version: selectedVersion, denomination }),
      })
      if (!res.ok) { setInsightFailed(true); return }

      const d = await res.json()
      let ins = d.insights || d

      // Sometimes the server returns the raw JSON string in explanation when its own
      // JSON.parse fails — detect and re-parse
      if (ins.explanation && typeof ins.explanation === 'string' && ins.explanation.trim().startsWith('{')) {
        try { ins = { ...ins, ...JSON.parse(ins.explanation) } } catch { /* keep as-is */ }
      }

      if (!ins.explanation) { setInsightFailed(true); return }

      const insight: PassageInsight = {
        explanation: ins.explanation,
        keyThemes: ins.keyThemes || [],
        crossReferences: ins.crossReferences || [],
        studyQuestions: ins.studyQuestions || [],
        historicalContext: ins.historicalContext,
        theologicalMeaning: ins.theologicalMeaning,
        practicalApplication: ins.practicalApplication,
        denomination: ins.denomination,
      }
      setAmbientInsight(insight)

      // Save to insights history (non-blocking)
      if (session?.access_token && user?.id) {
        fetch('/api/ai-insights/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({
            passage_reference: passage.reference,
            passage_text: passage.text,
            bible_version: passage.version?.name || selectedVersion,
            explanation: insight.explanation,
            key_themes: insight.keyThemes,
            cross_references: insight.crossReferences,
            study_questions: insight.studyQuestions,
            historical_context: insight.historicalContext || '',
            theological_meaning: insight.theologicalMeaning || '',
            practical_application: insight.practicalApplication || '',
            prayer_points: ins.prayerPoints || [],
            denomination: insight.denomination || denomination || null,
            tags: insight.keyThemes?.slice(0, 5) || [],
          }),
        }).catch(() => { /* save failure is non-critical */ })
      }
    } catch { setInsightFailed(true) }
    finally { setAmbientLoading(false) }
  }, [selectedVersion, denomination, session, user])

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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/bible/ai-insights', {
        method: 'POST', headers,
        body: JSON.stringify({ passage: versePassage, version: selectedVersion, denomination }),
      })
      if (res.ok) {
        const d = await res.json()
        let ins = d.insights || d
        // Re-parse if explanation contains raw JSON
        if (ins.explanation?.trim().startsWith('{')) {
          try { ins = { ...ins, ...JSON.parse(ins.explanation) } } catch { /* keep */ }
        }
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

  // Jump to any book/chapter; 'last' resolves once that book's chapters load.
  const goTo = async (bookId: string, chapter: number | 'last', focusVerse?: number) => {
    const book = books.find(b => b.id === bookId)
    if (!book) return
    const chs = await loadChapters(book.id, selectedVersion)
    const nums = chs.map(c => parseInt(c.number, 10)).filter(n => !isNaN(n))
    const ch = chapter === 'last' ? (nums[nums.length - 1] || 1) : chapter
    setSelectedBook(book.name); setSelectedBookId(book.id)
    setSelectedChapter(ch); setSelectedVerse(focusVerse || 1)
    if (isNarrow) setNavCollapsed(true)
    pendingVerseFocus.current = focusVerse ?? null
    loadPassage(book.name, book.id, ch)
  }

  const handleBookChange = (bookId: string) => goTo(bookId, 1)

  const handleChapterChange = (chapterNum: number) => {
    setSelectedChapter(chapterNum); setSelectedVerse(1)
    if (isNarrow) setNavCollapsed(true)
    loadPassage(selectedBook, selectedBookId, chapterNum)
  }

  const handleVersionChange = async (versionId: string) => {
    setSelectedVersion(versionId)
    chaptersCache.current = {} // clear chapters cache — different version may have different IDs
    // Books will reload via useEffect on selectedVersion
  }

  const openReference = (reference: string) => {
    const parsed = parseReference(reference)
    if (!parsed) return
    const name = parsed.book.toLowerCase()
    const book = books.find(b => b.name.toLowerCase() === name)
      || books.find(b => b.nameLong?.toLowerCase().includes(name))
      || books.find(b => b.name.toLowerCase().startsWith(name) || name.startsWith(b.name.toLowerCase()))
    if (book) goTo(book.id, parsed.chapter, parsed.verse)
  }

  // Scroll to (and select) a verse requested by a cross-reference or search hit
  useEffect(() => {
    const v = pendingVerseFocus.current
    if (!currentPassage || v == null) return
    pendingVerseFocus.current = null
    setActiveVerseNumber(v)
    requestAnimationFrame(() => document.getElementById(`verse-${v}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }, [currentPassage])

  // Prev / next chapter, crossing book boundaries
  const chapterNums = useMemo(() => chapters.map(c => parseInt(c.number, 10)).filter(n => !isNaN(n)), [chapters])
  const lastChapter = chapterNums.length ? chapterNums[chapterNums.length - 1] : 1
  const bookIndex = books.findIndex(b => b.id === selectedBookId)
  const prevTarget = selectedChapter > 1
    ? { bookId: selectedBookId, label: `${selectedBook} ${selectedChapter - 1}`, chapter: selectedChapter - 1 as number | 'last' }
    : bookIndex > 0 ? { bookId: books[bookIndex - 1].id, label: books[bookIndex - 1].name, chapter: 'last' as const } : null
  const nextTarget = selectedChapter < lastChapter
    ? { bookId: selectedBookId, label: `${selectedBook} ${selectedChapter + 1}`, chapter: selectedChapter + 1 as number | 'last' }
    : bookIndex >= 0 && bookIndex < books.length - 1 ? { bookId: books[bookIndex + 1].id, label: `${books[bookIndex + 1].name} 1`, chapter: 1 } : null

  const goPrev = () => {
    if (!prevTarget) return
    if (prevTarget.bookId === selectedBookId && typeof prevTarget.chapter === 'number') handleChapterChange(prevTarget.chapter)
    else goTo(prevTarget.bookId, prevTarget.chapter)
  }
  const goNext = () => {
    if (!nextTarget) return
    if (nextTarget.bookId === selectedBookId && typeof nextTarget.chapter === 'number') handleChapterChange(nextTarget.chapter)
    else goTo(nextTarget.bookId, nextTarget.chapter)
  }
  const navRef = useRef({ goPrev, goNext })
  navRef.current = { goPrev, goNext }

  // Keyboard shortcuts: ⌘←/→ chapters, / search, Esc clears selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); navRef.current.goPrev() }
        if (e.key === 'ArrowRight') { e.preventDefault(); navRef.current.goNext() }
        return
      }
      if (typing) return
      if (e.key === '/') { e.preventDefault(); searchInputRef.current?.focus() }
      if (e.key === 'Escape') setActiveVerseNumber(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setSearching(true); setError(null)
    try {
      const res = await fetch(`/api/bible/search?query=${encodeURIComponent(searchTerm)}&versionId=${selectedVersion}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Search failed')
      setSearchResults(d); setShowSearchResults(true)
      scrollRef.current?.scrollTo({ top: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally { setSearching(false) }
  }

  // ── Verse click ───────────────────────────────────────────────────────────

  const handleVerseClick = (num: number, text: string) => {
    if (activeVerseNumber === num) { setActiveVerseNumber(null); return }
    setActiveVerseNumber(num)
    setCopied(false)
    loadVerseInsight(num, text)
  }

  const activeVerse = currentPassage?.verses.find(v => v.verseNumber === activeVerseNumber) || null

  const copyActiveVerse = async () => {
    if (!activeVerse) return
    try {
      await navigator.clipboard.writeText(`“${activeVerse.text}” — ${activeVerse.reference} (${currentPassage?.version.name})`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { }
  }

  // ── Section heading lookup ────────────────────────────────────────────────

  const getSectionBefore = (verseNum: number): string | null => {
    const s = sections.find(s => s.firstVerseNum === verseNum)
    return s ? s.title : null
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    setScrollProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const meta = getBookMeta(selectedBookId)
  const readingStyle: React.CSSProperties = {
    fontSize: FONT_SIZES[settings.size],
    lineHeight: LEADING[settings.leading],
  }
  const fontClass = settings.font === 'serif' ? 'font-scripture' : 'font-sans'
  const wordCount = currentPassage ? currentPassage.text.split(/\s+/).length : 0

  const SectionHeading = ({ title }: { title: string }) => (
    <h3 className="mb-3 mt-9 flex items-center gap-3 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-shield-accent/80 first:mt-0">
      <span className="h-px w-6 bg-shield-accent/40" />{title}
    </h3>
  )

  const verseTone = (num: number) =>
    activeVerseNumber === num
      ? 'bg-shield-accent/[0.16] text-shield-fg ring-1 ring-shield-accent/30'
      : 'hover:bg-white/[0.045]'

  // Flowing paragraph layout with superscript numbers and a drop-cap chapter numeral
  const renderParagraphs = (verses: BibleVerse[]) => {
    const blocks: Array<{ heading: string | null; verses: BibleVerse[] }> = []
    for (const v of verses) {
      const heading = getSectionBefore(v.verseNumber)
      if (heading || blocks.length === 0) blocks.push({ heading, verses: [] })
      blocks[blocks.length - 1].verses.push(v)
    }
    return blocks.map((block, bi) => (
      <div key={bi}>
        {block.heading && <SectionHeading title={block.heading} />}
        <p className="mb-5 text-shield-fg/[0.88]">
          {block.verses.map(v => {
            const dropCap = v.verseNumber === 1 && bi === 0 && verses[0]?.verseNumber === 1
            return (
              <span
                key={v.id}
                id={`verse-${v.verseNumber}`}
                onClick={() => handleVerseClick(v.verseNumber, v.text)}
                className={`cursor-pointer rounded-md px-0.5 transition-colors [box-decoration-break:clone] ${verseTone(v.verseNumber)}`}
              >
                {dropCap ? (
                  <span className="float-left mr-3 mt-1 font-scripture text-[3.6em] font-semibold leading-[0.8] text-shield-accent">
                    {selectedChapter}
                  </span>
                ) : settings.showNumbers && (
                  <sup className="mr-1 select-none font-sans text-[0.6em] font-semibold text-shield-brand/80">{v.verseNumber}</sup>
                )}
                {v.text}{' '}
              </span>
            )
          })}
        </p>
      </div>
    ))
  }

  // One verse per line with a gutter of verse numbers
  const renderVerseLines = (verses: BibleVerse[], interactive = true) => (
    <div className="space-y-1">
      {verses.map(v => {
        const heading = interactive ? getSectionBefore(v.verseNumber) : null
        return (
          <React.Fragment key={v.id}>
            {heading && <SectionHeading title={heading} />}
            <div
              id={interactive ? `verse-${v.verseNumber}` : undefined}
              onClick={interactive ? () => handleVerseClick(v.verseNumber, v.text) : undefined}
              className={`flex gap-4 rounded-lg px-3 py-1.5 transition-colors ${interactive ? `cursor-pointer ${verseTone(v.verseNumber)}` : ''}`}
            >
              {settings.showNumbers && (
                <span className="w-6 flex-shrink-0 select-none pt-[0.35em] text-right font-sans text-[0.65em] font-semibold tabular-nums text-shield-brand/70">
                  {v.verseNumber}
                </span>
              )}
              <span className="text-shield-fg/[0.88]">{v.text}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )

  // Parallel columns aligned verse-by-verse
  const renderCompare = (primary: BiblePassage, secondary: BiblePassage) => {
    const byNum = new Map(secondary.verses.map(v => [v.verseNumber, v]))
    return (
      <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
        <div className="grid grid-cols-2 border-b border-white/[0.07] bg-shield-void/40 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-shield-muted">
          <div className="px-4 py-2.5">{primary.version.name}</div>
          <div className="border-l border-white/[0.07] px-4 py-2.5 text-shield-accent/80">{secondary.version.name}</div>
        </div>
        {primary.verses.map(v => (
          <div
            key={v.id}
            id={`verse-${v.verseNumber}`}
            onClick={() => handleVerseClick(v.verseNumber, v.text)}
            className={`grid cursor-pointer grid-cols-2 border-b border-white/[0.04] last:border-0 transition-colors ${
              activeVerseNumber === v.verseNumber ? 'bg-shield-accent/[0.12]' : 'hover:bg-white/[0.03]'
            }`}
            style={{ fontSize: '0.88em' }}
          >
            <p className="px-4 py-2.5 text-shield-fg/[0.88]">
              <sup className="mr-1 font-sans text-[0.65em] font-semibold text-shield-brand/80">{v.verseNumber}</sup>{v.text}
            </p>
            <p className="border-l border-white/[0.06] px-4 py-2.5 text-shield-fg/75">
              {byNum.get(v.verseNumber)?.text || <span className="text-shield-muted/50">—</span>}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const renderSearchResults = (results: BibleSearchResult) => (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => setShowSearchResults(false)}
        className="mb-6 flex items-center gap-1.5 text-xs font-medium text-shield-muted transition-colors hover:text-shield-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {selectedBook} {selectedChapter}
      </button>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-shield-accent/80">Search</p>
      <h2 className="mb-1 font-scripture text-3xl font-semibold text-shield-fg">“{results.query}”</h2>
      <p className="mb-8 text-sm text-shield-muted">{results.total ?? results.passages.length} results</p>

      {results.passages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-sm text-shield-muted">
          No passages found. Try a different word or phrase.
        </div>
      )}

      <div className="space-y-3">
        {results.passages.map(p => (
          <button
            key={p.id}
            onClick={() => openReference(p.reference)}
            className="group block w-full rounded-2xl border border-white/[0.07] bg-shield-panel/30 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-shield-brand/35 hover:bg-shield-panel/50 hover:shadow-shield-card"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-shield-brand">{p.reference}</span>
              <span className="text-[11px] text-shield-muted opacity-0 transition-opacity group-hover:opacity-100">Read in context →</span>
            </div>
            <p className="font-scripture text-[16px] leading-relaxed text-shield-fg/85">{highlight(p.text, results.query)}</p>
          </button>
        ))}
      </div>
    </div>
  )

  const renderSkeleton = () => (
    <div className="mx-auto max-w-[42rem] animate-pulse pt-4">
      <div className="mb-3 h-3 w-40 rounded-full bg-white/[0.06]" />
      <div className="mb-4 h-12 w-64 rounded-xl bg-white/[0.08]" />
      <div className="mb-12 h-3 w-56 rounded-full bg-white/[0.05]" />
      <div className="mb-10 h-24 rounded-2xl bg-shield-brand/[0.06]" />
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="mb-3 h-3.5 rounded-full bg-white/[0.05]" style={{ width: `${70 + ((i * 37) % 30)}%` }} />
      ))}
    </div>
  )

  const renderContent = () => {
    if (isLoading) return renderSkeleton()
    if (showSearchResults && searchResults) return renderSearchResults(searchResults)

    if (currentPassage) return (
      <article className={`mx-auto ${showCompare && comparePassage ? 'max-w-5xl' : 'max-w-[42rem]'}`}>
        {/* Chapter title */}
        <header className="mb-10 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-shield-accent/80">
            {TESTAMENT_LABEL[meta.testament]} <span className="text-shield-muted/50">·</span> {meta.group}
          </p>
          <h1 className="font-scripture text-4xl font-semibold tracking-tight text-shield-fg sm:text-5xl">{selectedBook}</h1>
          <p className="mt-2 font-scripture text-lg italic text-shield-muted">Chapter {selectedChapter}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-shield-muted">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">{currentPassage.version.name}</span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">{currentPassage.verses.length} verses</span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">~{Math.max(1, Math.round(wordCount / 230))} min read</span>
          </div>
        </header>

        <div className="mx-auto max-w-[42rem]">
          <PassageInsightCard
            insight={ambientInsight}
            loading={ambientLoading}
            failed={insightFailed}
            onGenerate={() => currentPassage && loadAmbientInsight(currentPassage)}
            onOpenReference={openReference}
          />
        </div>

        {/* Compare chooser */}
        {showCompare && (
          <div className="mx-auto mb-8 flex max-w-[42rem] flex-wrap items-center gap-3 rounded-2xl border border-white/[0.07] bg-shield-panel/30 px-4 py-3">
            <Columns className="h-4 w-4 text-shield-accent" />
            <span className="text-sm text-shield-fg/85">Read alongside</span>
            <select
              value={compareVersion}
              onChange={e => setCompareVersion(e.target.value)}
              className="shield-input ml-auto max-w-[16rem] flex-1 py-1.5 text-sm"
            >
              <option value="">Choose a translation…</option>
              {availableVersions.filter(v => v.id !== selectedVersion).map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {compareLoading && <Loader2 className="h-4 w-4 animate-spin text-shield-muted" />}
          </div>
        )}

        {/* Scripture */}
        <div className={fontClass} style={readingStyle}>
          {currentPassage.verses.length === 0 ? (
            <p className="py-10 text-center font-sans text-sm text-shield-muted">No verses found for this passage.</p>
          ) : showCompare && comparePassage && !compareLoading ? (
            renderCompare(currentPassage, comparePassage)
          ) : settings.layout === 'paragraph' ? (
            renderParagraphs(currentPassage.verses)
          ) : (
            renderVerseLines(currentPassage.verses)
          )}
        </div>

        {/* Chapter footer navigation */}
        <nav className="mx-auto mt-16 grid max-w-[42rem] grid-cols-2 gap-3 border-t border-white/[0.06] pt-8">
          {prevTarget ? (
            <button onClick={goPrev} className="group rounded-2xl border border-white/[0.07] bg-shield-panel/25 p-4 text-left transition-all hover:border-shield-brand/30 hover:bg-shield-panel/50">
              <span className="flex items-center gap-1 text-[11px] text-shield-muted"><ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />Previous</span>
              <span className="mt-1 block truncate font-scripture text-base text-shield-fg">{prevTarget.label}</span>
            </button>
          ) : <span />}
          {nextTarget ? (
            <button onClick={goNext} className="group rounded-2xl border border-white/[0.07] bg-shield-panel/25 p-4 text-right transition-all hover:border-shield-brand/30 hover:bg-shield-panel/50">
              <span className="flex items-center justify-end gap-1 text-[11px] text-shield-muted">Next<ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              <span className="mt-1 block truncate font-scripture text-base text-shield-fg">{nextTarget.label}</span>
            </button>
          ) : <span />}
        </nav>
        <p className="mt-6 pb-4 text-center text-[11px] text-shield-muted/60">⌘ ← / → to turn chapters · / to search · click a verse to study it</p>
      </article>
    )

    return (
      <div className="py-24 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-shield-muted" />
        <p className="text-sm text-shield-muted">Select a passage to begin reading</p>
      </div>
    )
  }

  const iconBtn = (active: boolean) =>
    `flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
      active ? 'bg-shield-brand/15 text-shield-brand' : 'text-shield-muted hover:bg-white/[0.06] hover:text-shield-fg'
    }`

  // ── Layout ────────────────────────────────────────────────────────────────

  if (error && !currentPassage) return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center text-white">
      <div className="max-w-sm rounded-2xl border border-white/[0.08] bg-shield-panel/50 p-8 text-center shadow-shield-card">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
        <h1 className="mb-1 text-lg font-bold">Couldn’t load Scripture</h1>
        <p className="mb-5 text-sm text-shield-muted">{error}</p>
        <button onClick={() => window.location.reload()} className="shield-btn-primary px-5 py-2 text-sm">Try again</button>
      </div>
    </div>
  )

  const drawer = isNarrow ? 'fixed bottom-0 top-16 z-40 shadow-2xl' : 'relative'

  return (
    <div className="relative flex text-white" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Drawer backdrop on small screens */}
      {isNarrow && (!navCollapsed || !notesCollapsed) && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/50 backdrop-blur-sm" onClick={() => { setNavCollapsed(true); setNotesCollapsed(true) }} />
      )}

      {/* ── Library ────────────────────────────────────────────────────────── */}
      <aside className={`${drawer} left-0 flex-shrink-0 overflow-hidden border-r border-white/[0.07] bg-shield-deep/95 backdrop-blur-xl transition-all duration-300 ${
        navCollapsed ? (isNarrow ? '-translate-x-full w-72' : 'w-0 border-r-0') : 'w-72 translate-x-0'
      }`}>
        <div className="flex h-full w-72 flex-col">
          <div className="flex-1 overflow-hidden">
            <BibleLibrary
              books={books}
              chapters={chapters}
              booksLoading={booksLoading}
              selectedBookId={selectedBookId}
              selectedChapter={selectedChapter}
              onSelectBook={handleBookChange}
              onSelectChapter={handleChapterChange}
            />
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <DenominationSelector variant="sidebar" onDenominationChange={handleDenominationChange} />
          </div>
        </div>
      </aside>

      {/* ── Reader ─────────────────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="relative z-20 flex-shrink-0 border-b border-white/[0.06] bg-shield-void/50 backdrop-blur-xl">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <button onClick={() => setNavCollapsed(c => !c)} className={iconBtn(!navCollapsed)} title={navCollapsed ? 'Show library' : 'Hide library'}>
              <PanelLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setNavCollapsed(false)}
              className="flex min-w-0 items-center gap-1 rounded-lg px-2 py-1.5 font-scripture text-[15px] font-semibold text-shield-fg transition-colors hover:bg-white/[0.06]"
            >
              <span className="truncate">{selectedBook} {selectedChapter}</span>
            </button>

            <div className="hidden items-center sm:flex">
              <button onClick={goPrev} disabled={!prevTarget} className={`${iconBtn(false)} disabled:opacity-30`} title="Previous chapter (⌘←)"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={goNext} disabled={!nextTarget} className={`${iconBtn(false)} disabled:opacity-30`} title="Next chapter (⌘→)"><ChevronRight className="h-4 w-4" /></button>
            </div>

            <form
              onSubmit={e => { e.preventDefault(); handleSearch() }}
              className="relative mx-1 min-w-0 flex-1 sm:mx-3 sm:max-w-md md:ml-auto"
            >
              {searching
                ? <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-shield-brand" />
                : <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-shield-muted/70" />}
              <input
                ref={searchInputRef}
                type="text" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search scripture…"
                className="w-full rounded-lg border border-white/[0.07] bg-white/[0.04] py-1.5 pl-9 pr-10 text-sm text-shield-fg placeholder:text-shield-muted/60 transition-colors focus:border-shield-brand/50 focus:bg-white/[0.06] focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 px-1.5 text-[10px] text-shield-muted sm:block">/</kbd>
            </form>

            <select
              value={selectedVersion}
              onChange={e => handleVersionChange(e.target.value)}
              title="Translation"
              className="hidden max-w-[10rem] cursor-pointer truncate rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 py-1.5 text-xs text-shield-fg focus:border-shield-brand/50 focus:outline-none md:block"
            >
              {availableVersions.length > 0
                ? availableVersions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)
                : <option value="de4e12af7f28f599-01">King James Version</option>}
            </select>

            {audioBibles.length > 0 && (
              <button onClick={() => setShowAudio(a => !a)} className={iconBtn(showAudio)} title={showAudio ? 'Hide audio' : 'Listen'}>
                <Headphones className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setShowCompare(c => !c)} className={`${iconBtn(showCompare)} hidden sm:flex`} title="Compare translations">
              <Columns className="h-4 w-4" />
            </button>

            {/* Reading settings */}
            <div className="relative" ref={settingsRef}>
              <button onClick={() => setSettingsOpen(o => !o)} className={iconBtn(settingsOpen)} title="Reading settings">
                <Type className="h-4 w-4" />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-10 w-72 space-y-4 rounded-2xl border border-white/[0.08] bg-shield-layer/95 p-4 shadow-2xl backdrop-blur-xl">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-shield-muted">Text size</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateSettings({ size: Math.max(0, settings.size - 1) })} disabled={settings.size === 0} className={`${iconBtn(false)} border border-white/[0.08] disabled:opacity-30`}><Minus className="h-3.5 w-3.5" /></button>
                      <div className="flex flex-1 justify-between px-1">
                        {FONT_SIZES.map((_, i) => (
                          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= settings.size ? 'bg-shield-brand' : 'bg-white/15'}`} />
                        ))}
                      </div>
                      <button onClick={() => updateSettings({ size: Math.min(FONT_SIZES.length - 1, settings.size + 1) })} disabled={settings.size === FONT_SIZES.length - 1} className={`${iconBtn(false)} border border-white/[0.08] disabled:opacity-30`}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {([
                    ['Typeface', 'font', [['serif', 'Serif'], ['sans', 'Sans']]],
                    ['Layout', 'layout', [['paragraph', 'Paragraph'], ['verse', 'Verse by verse']]],
                    ['Spacing', 'leading', [['compact', 'Snug'], ['relaxed', 'Relaxed'], ['airy', 'Airy']]],
                  ] as Array<[string, keyof ReaderSettings, Array<[string, string]>]>).map(([label, key, opts]) => (
                    <div key={key}>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-shield-muted">{label}</p>
                      <div className="flex rounded-xl border border-white/[0.06] bg-shield-void/40 p-1">
                        {opts.map(([value, text]) => (
                          <button
                            key={value}
                            onClick={() => updateSettings({ [key]: value } as Partial<ReaderSettings>)}
                            className={`flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-all ${
                              settings[key] === value ? 'bg-shield-elevated text-shield-fg' : 'text-shield-muted hover:text-shield-fg'
                            } ${key === 'font' && value === 'serif' ? 'font-scripture' : ''}`}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <label className="flex cursor-pointer items-center justify-between text-[13px] text-shield-fg/85">
                    Verse numbers
                    <button
                      onClick={() => updateSettings({ showNumbers: !settings.showNumbers })}
                      className={`relative h-5 w-9 rounded-full transition-colors ${settings.showNumbers ? 'bg-shield-brand' : 'bg-white/15'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${settings.showNumbers ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </label>
                  <div className="md:hidden">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-shield-muted">Translation</p>
                    <select value={selectedVersion} onChange={e => handleVersionChange(e.target.value)} className="shield-input w-full py-1.5 text-sm">
                      {availableVersions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setNotesCollapsed(c => !c)} className={iconBtn(!notesCollapsed)} title={notesCollapsed ? 'Show study notes' : 'Hide study notes'}>
              <PanelRight className="h-4 w-4" />
            </button>
          </div>

          {/* Reading progress */}
          <div className="absolute inset-x-0 -bottom-px h-[2px] bg-transparent">
            <div className="h-full bg-gradient-to-r from-shield-brand to-shield-accent transition-[width] duration-150" style={{ width: `${scrollProgress * 100}%` }} />
          </div>
        </div>

        {/* Version recommendation banner */}
        {versionRecommendation && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-shield-accent/15 bg-shield-accent/[0.07] px-4 py-2 text-xs">
            <span className="text-shield-fg/80">
              The <span className="font-medium text-shield-accent">{denomination}</span> tradition typically reads the <span className="font-medium">{versionRecommendation.name}</span>.
            </span>
            <div className="ml-4 flex flex-shrink-0 items-center gap-3">
              <button onClick={() => { handleVersionChange(versionRecommendation.id); setVersionRecommendation(null) }} className="font-medium text-shield-accent hover:underline">Switch</button>
              <button onClick={() => setVersionRecommendation(null)} className="text-shield-muted hover:text-shield-fg"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}

        {/* Audio player bar */}
        {showAudio && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-white/[0.06] bg-shield-panel/30 px-5 py-2.5">
            <div className="min-w-0 flex-1">
              {audioLoading && (
                <div className="flex items-center gap-2 py-1 text-xs text-shield-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading audio…
                </div>
              )}
              {audioUrl && !audioLoading && <AudioPlayer src={audioUrl} label={currentPassage?.reference} />}
              {!audioUrl && !audioLoading && (
                <p className="py-1 text-xs text-shield-muted">Audio isn’t available for this chapter in the selected recording.</p>
              )}
            </div>
            {audioBibles.length > 1 && (
              <select
                value={selectedAudioId || ''}
                onChange={e => setSelectedAudioId(e.target.value)}
                className="max-w-[12rem] truncate rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-xs text-shield-fg focus:outline-none"
              >
                {audioBibles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Scrollable passage body */}
        <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto px-5 py-10 sm:px-8 sm:py-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-shield-radial-soft opacity-60" />
          <div className="relative">{renderContent()}</div>
        </div>

        {/* Selected-verse action bar */}
        {activeVerse && !showSearchResults && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
            <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-full border border-white/[0.1] bg-shield-layer/95 py-1.5 pl-4 pr-1.5 shadow-2xl backdrop-blur-xl">
              <span className="mr-2 truncate font-scripture text-sm font-semibold text-shield-fg">{activeVerse.reference}</span>
              <button onClick={copyActiveVerse} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-shield-fg/85 transition-colors hover:bg-white/[0.08]">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={() => setNotesCollapsed(false)} className="flex items-center gap-1.5 rounded-full bg-shield-brand/15 px-3 py-1.5 text-xs font-medium text-shield-brand transition-colors hover:bg-shield-brand/25">
                <PenLine className="h-3.5 w-3.5" /> Note & insight
              </button>
              <button onClick={() => setActiveVerseNumber(null)} className="rounded-full p-1.5 text-shield-muted transition-colors hover:bg-white/[0.08] hover:text-shield-fg" title="Clear (Esc)">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Margin notes ───────────────────────────────────────────────────── */}
      <aside className={`${drawer} right-0 flex-shrink-0 overflow-hidden border-l border-white/[0.07] bg-shield-deep/95 backdrop-blur-xl transition-all duration-300 ${
        notesCollapsed ? (isNarrow ? 'translate-x-full w-80' : 'w-0 border-l-0') : 'w-80 translate-x-0'
      }`}>
        <div className="flex h-full w-80 flex-col">
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
      </aside>
    </div>
  )
}
