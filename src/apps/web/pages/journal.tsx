import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { Header } from '../components/Header'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { JournalNoteEditor } from '../components/features/bible/JournalNoteEditor'
import {
  BookOpen,
  PenTool,
  ChevronDown,
  ChevronUp,
  Search,
  Star,
  Tag,
  Loader2,
  AlertTriangle,
  BookMarked,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Insight {
  id: string
  passage_reference: string
  passage_text: string
  bible_version: string
  explanation: string
  key_themes: string[]
  tags: string[]
  notes?: string
  is_favorite: boolean
  created_at: string
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function dateBucket(isoString: string): string {
  const now = new Date()
  const d = new Date(isoString)
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 6) return 'This week'
  if (diffDays <= 29) return 'This month'

  return d.toLocaleString('default', { month: 'long', year: 'numeric' })
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function groupByBucket(insights: Insight[]): Array<{ label: string; items: Insight[] }> {
  const map = new Map<string, Insight[]>()
  const order: string[] = []

  for (const insight of insights) {
    const label = dateBucket(insight.created_at)
    if (!map.has(label)) {
      map.set(label, [])
      order.push(label)
    }
    map.get(label)!.push(insight)
  }

  return order.map((label) => ({ label, items: map.get(label)! }))
}

// ── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({
  insight,
  onNoteUpdate,
}: {
  insight: Insight
  onNoteUpdate: (id: string, note: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasNote = Boolean(insight.notes?.trim())

  return (
    <div className="rounded-xl border border-shield-panel bg-shield-surface/60 overflow-hidden transition-all duration-200 hover:border-shield-edge-strong">
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start gap-4 group"
      >
        {/* Icon */}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-shield-brand/10 group-hover:bg-shield-brand/15 transition-colors">
          <BookOpen className="h-4 w-4 text-shield-brand" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-shield-fg text-sm">{insight.passage_reference}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-shield-muted/60 border border-shield-edge rounded px-1.5 py-0.5">
              {insight.bible_version}
            </span>
            {insight.is_favorite && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
          </div>

          <p className="text-shield-muted text-xs line-clamp-2 leading-relaxed mb-2">
            {insight.passage_text}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {insight.key_themes?.slice(0, 4).map((theme) => (
              <span
                key={theme}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-shield-brand/10 text-shield-brand border border-shield-brand/20"
              >
                <Sparkles className="h-2.5 w-2.5" />
                {theme}
              </span>
            ))}
            {insight.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-shield-panel text-shield-muted border border-shield-edge"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Note indicator + chevron */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className={`flex items-center gap-1 text-[10px] font-medium rounded px-2 py-0.5 border ${
            hasNote
              ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
              : 'border-shield-edge bg-transparent text-shield-muted/50'
          }`}>
            <PenTool className="h-2.5 w-2.5" />
            {hasNote ? 'Has note' : 'No note'}
          </div>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-shield-muted" />
            : <ChevronDown className="h-4 w-4 text-shield-muted" />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-shield-panel space-y-4 pt-4">
          {/* Explanation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-shield-muted mb-2">AI Insight</p>
            <p className="text-shield-fg text-sm leading-relaxed">{insight.explanation}</p>
          </div>

          {/* Journal note editor */}
          <JournalNoteEditor
            insightId={insight.id}
            initialNote={insight.notes ?? ''}
            onSave={(note) => onNoteUpdate(insight.id, note)}
          />
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [filterHasNotes, setFilterHasNotes] = useState(false)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Please sign in to view your journal.')
        return
      }

      const params = new URLSearchParams({
        limit: '200',
        sort_by: 'created_at',
        sort_order: 'desc',
      })

      const res = await fetch(`/api/ai-insights/history?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Failed to load insights')
      const data = await res.json()
      setInsights(data.insights ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInsights() }, [fetchInsights])

  const handleNoteUpdate = (id: string, note: string) => {
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, notes: note } : i))
    )
  }

  // Apply local filters
  const filtered = insights.filter((i) => {
    if (filterFavorites && !i.is_favorite) return false
    if (filterHasNotes && !i.notes?.trim()) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        i.passage_reference.toLowerCase().includes(q) ||
        i.passage_text.toLowerCase().includes(q) ||
        i.explanation.toLowerCase().includes(q) ||
        i.key_themes?.some((t) => t.toLowerCase().includes(q)) ||
        i.tags?.some((t) => t.toLowerCase().includes(q)) ||
        (i.notes ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const groups = groupByBucket(filtered)

  const stats = {
    total: insights.length,
    withNotes: insights.filter((i) => i.notes?.trim()).length,
    favorites: insights.filter((i) => i.is_favorite).length,
  }

  return (
    <ProtectedRoute>
    <>
      <Head>
        <title>Study Journal – Shield AI</title>
        <meta name="description" content="Your personal Bible study journal with AI insights and reflections" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-shield-canvas">
        <Header />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                <BookMarked className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-shield-fg">Study Journal</h1>
            </div>
            <p className="text-shield-muted ml-[52px]">
              Your personal record of scripture insights and reflections
            </p>
          </div>

          {/* Stats row */}
          {!loading && !error && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Insights', value: stats.total, color: 'text-shield-brand' },
                { label: 'With notes', value: stats.withNotes, color: 'text-purple-400' },
                { label: 'Favorites', value: stats.favorites, color: 'text-yellow-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-shield-panel bg-shield-surface/50 px-4 py-3 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-shield-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-shield-muted" />
              <input
                type="text"
                placeholder="Search passages, themes, notes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-shield-panel bg-shield-surface text-shield-fg text-sm placeholder:text-shield-muted/50 focus:outline-none focus:border-shield-brand/50 focus:ring-1 focus:ring-shield-brand/30 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <FilterChip
                active={filterFavorites}
                onClick={() => setFilterFavorites((v) => !v)}
                icon={<Star className="h-3.5 w-3.5" />}
                label="Favorites"
              />
              <FilterChip
                active={filterHasNotes}
                onClick={() => setFilterHasNotes((v) => !v)}
                icon={<PenTool className="h-3.5 w-3.5" />}
                label="Has notes"
              />
            </div>
          </div>

          {/* Content */}
          {loading && (
            <div className="flex items-center justify-center py-24 text-shield-muted">
              <Loader2 className="h-6 w-6 animate-spin mr-3" />
              Loading your journal…
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-24">
              <BookMarked className="h-12 w-12 text-shield-muted/30 mx-auto mb-4" />
              <p className="text-shield-fg font-medium mb-1">
                {insights.length === 0 ? 'No insights yet' : 'No results'}
              </p>
              <p className="text-shield-muted text-sm">
                {insights.length === 0
                  ? 'Generate insights from the Bible reader and they will appear here.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          )}

          {!loading && !error && groups.map(({ label, items }) => (
            <section key={label} className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-shield-muted mb-3 pl-1">
                {label}
              </h2>
              <div className="space-y-3">
                {items.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onNoteUpdate={handleNoteUpdate}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </>
    </ProtectedRoute>
  )
}

function FilterChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
        active
          ? 'border-shield-brand/40 bg-shield-brand/10 text-shield-brand'
          : 'border-shield-panel bg-shield-surface text-shield-muted hover:text-shield-fg hover:border-shield-edge'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
