import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BookOpen, Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles, X, PanelLeft, PanelRight } from 'lucide-react'
import { DenominationSelector } from '../../ui/DenominationSelector'
import { MarginNotes } from './MarginNotes'
import { useAuth } from '../../../contexts/AuthContext'

// ── Types ──────────────────────────────────────────────────────────────────

interface BiblePassage {
  id: string
  reference: string
  text: string
  verses: Array<{
    id: string
    text: string
    reference: string
    verseNumber: number
    chapterNumber: number
    bookName: string
  }>
  version: {
    id: string
    name: string
    description: string
    language: { id: string; name: string }
    type: string
  }
}

interface BibleSearchResult {
  query: string
  total: number
  passages: Array<{ id: string; reference: string; text: string; version: { name: string } }>
}

// Denomination → preferred version name fragments (matched against loaded versions)
const DENOMINATION_VERSION_HINTS: Record<string, string[]> = {
  'Protestant':        ['English Standard', 'New International', 'King James'],
  'Catholic':          ['Good News', 'New American Bible', 'Douay'],
  'Oriental Orthodox': ['King James', 'New King James'],
  'Eastern Orthodox':  ['New King James', 'King James'],
}

// ── Component ──────────────────────────────────────────────────────────────

export function Bible() {
  const { user, session } = useAuth()

  // Navigation state
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState(1)
  const [selectedVersion, setSelectedVersion] = useState('de4e12af7f28f599-02')
  const [availableVersions, setAvailableVersions] = useState<Array<{ id: string; name: string }>>([])
  const [availableBooks] = useState<string[]>([
    'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
    '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
    'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Songs',
    'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
    'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah',
    'Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians',
    '2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
    '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
    'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
  ])
  const [availableChapters, setAvailableChapters] = useState<number[]>([])

  // Passage state
  const [currentPassage, setCurrentPassage] = useState<BiblePassage | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<BibleSearchResult | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Margin notes / verse interaction
  const [activeVerseNumber, setActiveVerseNumber] = useState<number | null>(null)
  const [verseInsight, setVerseInsight] = useState<string | null>(null)
  const [verseInsightLoading, setVerseInsightLoading] = useState(false)
  const verseInsightCache = useRef<Record<string, string>>({})

  // Ambient passage insight
  const [ambientInsight, setAmbientInsight] = useState<string | null>(null)
  const [ambientLoading, setAmbientLoading] = useState(false)

  // Denomination → version recommendation
  const [denomination, setDenomination] = useState<string | null>(null)
  const [versionRecommendation, setVersionRecommendation] = useState<{ name: string; id: string } | null>(null)

  // Sidebar collapse state
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [notesCollapsed, setNotesCollapsed] = useState(false)

  // Reading progress
  const [progressLoaded, setProgressLoaded] = useState(false)

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getMaxChapters = (book: string): number => {
    const counts: Record<string, number> = {
      Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,Joshua:24,Judges:21,
      Ruth:4,'1 Samuel':31,'2 Samuel':24,'1 Kings':22,'2 Kings':25,'1 Chronicles':29,
      '2 Chronicles':36,Ezra:10,Nehemiah:13,Esther:10,Job:42,Psalms:150,Proverbs:31,
      Ecclesiastes:12,'Song of Songs':8,Isaiah:66,Jeremiah:52,Lamentations:5,Ezekiel:48,
      Daniel:12,Hosea:14,Joel:3,Amos:9,Obadiah:1,Jonah:4,Micah:7,Nahum:3,Habakkuk:3,
      Zephaniah:3,Haggai:2,Zechariah:14,Malachi:4,Matthew:28,Mark:16,Luke:24,John:21,
      Acts:28,Romans:16,'1 Corinthians':16,'2 Corinthians':13,Galatians:6,Ephesians:6,
      Philippians:4,Colossians:4,'1 Thessalonians':5,'2 Thessalonians':3,'1 Timothy':6,
      '2 Timothy':4,Titus:3,Philemon:1,Hebrews:13,James:5,'1 Peter':5,'2 Peter':3,
      '1 John':5,'2 John':1,'3 John':1,Jude:1,Revelation:22,
    }
    return counts[book] || 1
  }

  // ── Reading progress ──────────────────────────────────────────────────────

  const saveProgress = useCallback(async (book: string, chapter: number, verse: number) => {
    if (!user?.id) return
    try {
      await fetch(`/api/bible/preferences?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_book: book, last_chapter: chapter, last_verse: verse }),
      })
    } catch { /* non-critical */ }
  }, [user])

  const loadProgress = useCallback(async () => {
    if (!user?.id) { setProgressLoaded(true); return }
    try {
      const res = await fetch(`/api/bible/preferences?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        const prefs = data // bibleService returns the prefs object directly
        if (prefs?.last_book) {
          setSelectedBook(prefs.last_book)
          setSelectedChapter(prefs.last_chapter || 1)
          setSelectedVerse(prefs.last_verse || 1)
          setProgressLoaded(true)
          return
        }
      }
    } catch { /* fall through */ }
    setProgressLoaded(true)
  }, [user])

  // ── Versions ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/bible/versions')
      .then(r => r.json())
      .then(d => { if (d.versions) setAvailableVersions(d.versions) })
      .catch(() => {})
  }, [])

  // ── Load progress on mount, then load passage ─────────────────────────────

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  useEffect(() => {
    if (progressLoaded) {
      loadPassage(selectedBook, selectedChapter)
    }
  }, [progressLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Passage loading ───────────────────────────────────────────────────────

  const loadPassage = useCallback(async (book: string, chapter: number, verse?: number) => {
    setIsLoading(true)
    setError(null)
    setShowSearchResults(false)
    setActiveVerseNumber(null)
    setVerseInsight(null)
    setAmbientInsight(null)

    const maxChapters = getMaxChapters(book)
    setAvailableChapters(Array.from({ length: maxChapters }, (_, i) => i + 1))

    try {
      const ref = verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`
      const res = await fetch(`/api/bible/passage?reference=${encodeURIComponent(ref)}&versionId=${selectedVersion}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load passage')

      const passage = data.passage || data
      const content = passage.content || passage.text || ''
      const textContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

      const verses: BiblePassage['verses'] = []
      if (content) {
        const regex = /<span[^>]*data-number="(\d+)"[^>]*class="v"[^>]*>(\d+)<\/span>([^<]*?)(?=<span[^>]*data-number="\d+"[^>]*class="v"|$)/g
        let match
        while ((match = regex.exec(content)) !== null) {
          const vNum = parseInt(match[1])
          const vText = match[3].trim()
          if (vText) verses.push({ id: `${passage.id}-${vNum}`, text: vText, reference: `${book} ${chapter}:${vNum}`, verseNumber: vNum, chapterNumber: chapter, bookName: book })
        }
        if (verses.length === 0) {
          const simple = content.match(/<span[^>]*data-number="(\d+)"[^>]*class="v"[^>]*>(\d+)<\/span>([^<]*)/g)
          if (simple) {
            simple.forEach((m: string, i: number) => {
              const numM = m.match(/data-number="(\d+)"/)
              const vNum = numM ? parseInt(numM[1]) : i + 1
              const txtM = m.match(/<\/span>([^<]*)/)
              const vText = txtM ? txtM[1].trim() : ''
              if (vText) verses.push({ id: `${passage.id}-${vNum}`, text: vText, reference: `${book} ${chapter}:${vNum}`, verseNumber: vNum, chapterNumber: chapter, bookName: book })
            })
          } else {
            verses.push({ id: passage.id, text: textContent, reference: passage.reference || `${book} ${chapter}${verse ? ':' + verse : ''}`, verseNumber: verse || 1, chapterNumber: chapter, bookName: book })
          }
        }
      }

      const processed: BiblePassage = {
        id: passage.id || 'unknown',
        reference: passage.reference || `${book} ${chapter}${verse ? ':' + verse : ''}`,
        text: textContent,
        verses,
        version: passage.version || { id: selectedVersion, name: 'King James Version', description: '', language: { id: 'eng', name: 'English' }, type: 'text' },
      }
      setCurrentPassage(processed)
      saveProgress(book, chapter, verse || 1)
      // Kick off ambient insight after passage loads
      loadAmbientInsight(processed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passage')
    } finally {
      setIsLoading(false)
    }
  }, [selectedVersion, saveProgress])

  // ── Ambient insight ───────────────────────────────────────────────────────

  const loadAmbientInsight = useCallback(async (passage: BiblePassage) => {
    if (!passage.text) return
    setAmbientLoading(true)
    try {
      const res = await fetch('/api/bible/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage, version: selectedVersion, denomination, compact: true }),
      })
      if (res.ok) {
        const data = await res.json()
        const insight = data.insights || data
        const summary = insight.explanation || insight.historicalContext || ''
        if (summary) setAmbientInsight(summary)
      }
    } catch { /* non-critical */ }
    finally { setAmbientLoading(false) }
  }, [selectedVersion, denomination])

  // ── Verse insight ─────────────────────────────────────────────────────────

  const loadVerseInsight = useCallback(async (verseNum: number, verseText: string) => {
    const cacheKey = `${selectedBook}-${selectedChapter}-${verseNum}-${denomination || 'none'}`
    if (verseInsightCache.current[cacheKey]) {
      setVerseInsight(verseInsightCache.current[cacheKey])
      return
    }
    setVerseInsightLoading(true)
    setVerseInsight(null)
    try {
      const res = await fetch('/api/bible/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: {
            id: 'verse',
            reference: `${selectedBook} ${selectedChapter}:${verseNum}`,
            text: verseText,
            verses: [{ id: 'v', text: verseText, reference: `${selectedBook} ${selectedChapter}:${verseNum}`, verseNumber: verseNum, chapterNumber: selectedChapter, bookName: selectedBook }],
            version: { id: selectedVersion, name: '', description: '', language: { id: 'eng', name: 'English' }, type: 'text' },
          },
          version: selectedVersion,
          denomination,
          compact: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const insight = data.insights || data
        const text = insight.explanation || insight.theologicalMeaning || ''
        if (text) {
          verseInsightCache.current[cacheKey] = text
          setVerseInsight(text)
        }
      }
    } catch { /* non-critical */ }
    finally { setVerseInsightLoading(false) }
  }, [selectedBook, selectedChapter, selectedVersion, denomination])

  // ── Verse click ───────────────────────────────────────────────────────────

  const handleVerseClick = (verseNum: number, verseText: string) => {
    setActiveVerseNumber(verseNum)
    loadVerseInsight(verseNum, verseText)
  }

  // ── Denomination change ───────────────────────────────────────────────────

  const handleDenominationChange = (newDenomination: string | null) => {
    setDenomination(newDenomination)
    setVersionRecommendation(null)
    if (!newDenomination) return
    const hints = DENOMINATION_VERSION_HINTS[newDenomination]
    if (!hints) return
    // Check if current version already matches
    const currentVersionName = availableVersions.find(v => v.id === selectedVersion)?.name || ''
    const alreadyMatches = hints.some(h => currentVersionName.toLowerCase().includes(h.toLowerCase()))
    if (alreadyMatches) return
    // Find best available match
    for (const hint of hints) {
      const match = availableVersions.find(v => v.name.toLowerCase().includes(hint.toLowerCase()))
      if (match) { setVersionRecommendation({ name: match.name, id: match.id }); return }
    }
  }

  const acceptVersionRecommendation = () => {
    if (!versionRecommendation) return
    setSelectedVersion(versionRecommendation.id)
    setVersionRecommendation(null)
    loadPassage(selectedBook, selectedChapter, selectedVerse)
  }

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bible/search?query=${encodeURIComponent(searchTerm)}&versionId=${selectedVersion}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setSearchResults(data)
      setShowSearchResults(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Navigation handlers ───────────────────────────────────────────────────

  const handleBookChange = (book: string) => {
    setSelectedBook(book); setSelectedChapter(1); setSelectedVerse(1)
    loadPassage(book, 1, 1)
  }
  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter); setSelectedVerse(1)
    loadPassage(selectedBook, chapter)
  }
  const handleVersionChange = (id: string) => {
    setSelectedVersion(id)
    loadPassage(selectedBook, selectedChapter, selectedVerse)
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowLeft' && selectedChapter > 1) { e.preventDefault(); handleChapterChange(selectedChapter - 1) }
        if (e.key === 'ArrowRight' && selectedChapter < availableChapters.length) { e.preventDefault(); handleChapterChange(selectedChapter + 1) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedChapter, availableChapters.length])

  // ── Render helpers ────────────────────────────────────────────────────────

  if (error && !currentPassage) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)] bg-shield-canvas text-white">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold mb-1">Error Loading Bible</h1>
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded">
            Reload
          </button>
        </div>
      </div>
    )
  }

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
          <button onClick={() => setShowSearchResults(false)} className="text-sm text-blue-400 hover:text-blue-300">Back to Passage</button>
        </div>
        {searchResults.passages.map(p => (
          <div key={p.id} className="p-3 bg-shield-canvas rounded-lg">
            <h4 className="text-sm font-semibold text-blue-400 mb-1">{p.reference}</h4>
            <p className="text-sm text-shield-fg leading-relaxed">{p.text}</p>
            <button
              onClick={() => {
                const parts = p.reference.split(' ')
                const cv = parts[parts.length - 1].split(':')
                const book = parts.slice(0, -1).join(' ')
                setSelectedBook(book); setSelectedChapter(parseInt(cv[0])); setSelectedVerse(parseInt(cv[1] || '1'))
                setShowSearchResults(false)
                loadPassage(book, parseInt(cv[0]), parseInt(cv[1] || '1'))
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
              <div className="space-y-2">
                <div className="h-2.5 rounded bg-shield-muted/20 animate-pulse w-full" />
                <div className="h-2.5 rounded bg-shield-muted/20 animate-pulse w-4/5" />
                <div className="h-2.5 rounded bg-shield-muted/20 animate-pulse w-3/5" />
              </div>
            ) : (
              <p className="text-xs text-shield-fg/80 leading-relaxed">{ambientInsight}</p>
            )}
          </div>
        )}

        {/* Verses */}
        <div className="space-y-1">
          {currentPassage.verses.length > 0 ? (
            currentPassage.verses.map((verse, i) => (
              <p
                key={verse.id || i}
                className={`text-sm leading-relaxed py-1 px-2 rounded transition-colors cursor-default ${
                  activeVerseNumber === verse.verseNumber
                    ? 'bg-shield-brand/8 border-l-2 border-shield-brand/50'
                    : 'hover:bg-shield-panel/40'
                }`}
              >
                <span
                  className="text-blue-400 font-semibold mr-1.5 cursor-pointer hover:text-blue-300 select-none"
                  onClick={() => handleVerseClick(verse.verseNumber, verse.text)}
                  title="Click to annotate this verse"
                >
                  {verse.verseNumber}.
                </span>
                {verse.text}
              </p>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-shield-muted">No verses found for this passage</p>
              <p className="text-xs text-shield-muted mt-1">Reference: {currentPassage.reference}</p>
            </div>
          )}
        </div>
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

  return (
    <div className="flex bg-shield-canvas text-white" style={{ height: 'calc(100vh - 48px)' }}>

      {/* ── Left nav column ─────────────────────────────────────────────── */}
      <div className={`${navCollapsed ? 'w-0' : 'w-52'} flex-shrink-0 border-r border-shield-edge bg-shield-panel overflow-y-auto flex flex-col transition-all duration-300`}>
        <div className="p-4 space-y-3 flex-1">
          <p className="text-xs font-semibold text-shield-fg uppercase tracking-wider">Navigation</p>
          <p className="text-[10px] text-shield-muted">⌘ + ← → to change chapter</p>

          {/* Book */}
          <div>
            <label className="block text-xs font-medium text-shield-muted mb-1">Book</label>
            <select
              value={selectedBook}
              onChange={e => handleBookChange(e.target.value)}
              className="w-full bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
            >
              {availableBooks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Chapter */}
          <div>
            <label className="block text-xs font-medium text-shield-muted mb-1">Chapter</label>
            <div className="flex items-center gap-1">
              <button onClick={() => selectedChapter > 1 && handleChapterChange(selectedChapter - 1)} disabled={selectedChapter <= 1} className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-600">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="number" value={selectedChapter} min="1" max={availableChapters.length}
                onChange={e => handleChapterChange(parseInt(e.target.value) || 1)}
                className="flex-1 bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500 text-center"
              />
              <button onClick={() => selectedChapter < availableChapters.length && handleChapterChange(selectedChapter + 1)} disabled={selectedChapter >= availableChapters.length} className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-600">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Version */}
          <div>
            <label className="block text-xs font-medium text-shield-muted mb-1">Version</label>
            <select
              value={selectedVersion}
              onChange={e => handleVersionChange(e.target.value)}
              className="w-full bg-shield-canvas border border-shield-edge text-white px-2 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
            >
              {availableVersions.length > 0
                ? availableVersions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)
                : <option value="de4e12af7f28f599-02">King James Version</option>}
            </select>
          </div>

          <button
            onClick={() => loadPassage(selectedBook, selectedChapter, selectedVerse)}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-1.5 text-sm rounded transition-colors"
          >
            {isLoading ? 'Loading…' : 'Go to Passage'}
          </button>
        </div>

        {/* Denomination selector */}
        <div className="border-t border-shield-edge p-3">
          <DenominationSelector variant="panel" onDenominationChange={handleDenominationChange} />
        </div>
      </div>

      {/* ── Centre content column ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Search bar + sidebar toggles */}
        <div className="flex-shrink-0 px-3 py-3 border-b border-shield-edge flex items-center gap-2">
          {/* Left sidebar toggle */}
          <button
            onClick={() => setNavCollapsed(c => !c)}
            className="p-1.5 rounded-md hover:bg-shield-elevated transition-colors text-shield-muted hover:text-shield-fg flex-shrink-0"
            title={navCollapsed ? 'Show navigation' : 'Hide navigation'}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <input
            type="text" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search scripture…"
            className="flex-1 bg-shield-panel border border-shield-edge text-white px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch} disabled={isLoading || !searchTerm.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
          {/* Right sidebar toggle */}
          <button
            onClick={() => setNotesCollapsed(c => !c)}
            className="p-1.5 rounded-md hover:bg-shield-elevated transition-colors text-shield-muted hover:text-shield-fg flex-shrink-0"
            title={notesCollapsed ? 'Show study notes' : 'Hide study notes'}
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>

        {/* Version recommendation banner */}
        {versionRecommendation && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 bg-shield-brand/10 border-b border-shield-brand/20 text-xs">
            <span className="text-shield-fg/80">
              <span className="font-medium text-shield-brand">{denomination}</span> tradition typically reads the <span className="font-medium">{versionRecommendation.name}</span> — switch?
            </span>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <button onClick={acceptVersionRecommendation} className="text-shield-brand font-medium hover:underline">Switch</button>
              <button onClick={() => setVersionRecommendation(null)} className="text-shield-muted hover:text-shield-fg">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Passage header */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-shield-edge flex items-center justify-between">
          <h2 className="text-base font-bold">
            {currentPassage ? currentPassage.reference : `${selectedBook} ${selectedChapter}`}
          </h2>
          <div className="flex items-center gap-2 text-xs text-shield-muted">
            {currentPassage?.version?.name && (
              <span className="bg-shield-panel px-2 py-0.5 rounded text-[10px]">{currentPassage.version.name}</span>
            )}
          </div>
        </div>

        {/* Scrollable passage body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {renderContent()}
        </div>
      </div>

      {/* ── Right margin notes column ────────────────────────────────────── */}
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
