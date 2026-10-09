import React, { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, ChevronDown, Quote } from 'lucide-react'

export interface PassageInsight {
  explanation: string
  keyThemes: string[]
  crossReferences: Array<{ reference: string; text: string; relevance: string }>
  studyQuestions: Array<{ question: string; category: string; difficulty?: string } | string>
  historicalContext?: string
  theologicalMeaning?: string
  practicalApplication?: string
  denomination?: string
}

type Tab = 'overview' | 'context' | 'crossrefs' | 'questions'

interface PassageInsightCardProps {
  insight: PassageInsight | null
  loading: boolean
  failed: boolean
  onGenerate: () => void
  onOpenReference?: (reference: string) => void
}

export function PassageInsightCard({ insight, loading, failed, onGenerate, onOpenReference }: PassageInsightCardProps) {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => { setTab('overview') }, [insight])

  const hasContext = !!(insight?.historicalContext || insight?.theologicalMeaning || insight?.practicalApplication)
  const tabs: Array<{ id: Tab; label: string; show: boolean }> = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'context', label: 'Context', show: hasContext },
    { id: 'crossrefs', label: `Cross-refs${insight?.crossReferences?.length ? ` · ${insight.crossReferences.length}` : ''}`, show: !!insight?.crossReferences?.length },
    { id: 'questions', label: 'Reflect', show: !!insight?.studyQuestions?.length },
  ]

  return (
    <section className="relative mb-10 overflow-hidden rounded-2xl border border-shield-brand/20 bg-gradient-to-br from-shield-brand/[0.09] via-shield-panel/40 to-shield-accent/[0.04] shadow-shield-card">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-shield-brand/10 blur-3xl" />

      <header className="relative flex items-center gap-3 px-5 py-3.5">
        <button onClick={() => setOpen(o => !o)} className="flex flex-1 items-center gap-2.5 text-left">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-shield-brand/15 ring-1 ring-shield-brand/30">
            <Sparkles className={`h-3.5 w-3.5 text-shield-brand ${loading ? 'animate-pulse' : ''}`} />
          </span>
          <span>
            <span className="block text-[13px] font-semibold text-shield-fg">Passage Insight</span>
            <span className="block text-[11px] text-shield-muted">
              {loading ? 'Reading the passage…' : insight?.denomination ? `${insight.denomination} perspective` : 'AI-assisted study companion'}
            </span>
          </span>
          <ChevronDown className={`ml-auto h-4 w-4 text-shield-muted transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
        {!loading && (
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 rounded-lg border border-shield-brand/25 bg-shield-brand/10 px-2.5 py-1.5 text-[11px] font-medium text-shield-brand transition-colors hover:bg-shield-brand/20"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">{insight ? 'Regenerate' : 'Generate'}</span>
          </button>
        )}
      </header>

      {open && (
        <div className="relative border-t border-white/[0.06] px-5 pb-5 pt-4">
          {loading && (
            <div className="space-y-2.5">
              {['w-full', 'w-11/12', 'w-4/5', 'w-2/3'].map(w => (
                <div key={w} className={`h-2.5 animate-pulse rounded-full bg-gradient-to-r from-shield-brand/20 to-shield-muted/10 ${w}`} />
              ))}
            </div>
          )}

          {!loading && !insight && (
            <p className="text-sm text-shield-muted">
              {failed ? 'Couldn’t generate an insight for this passage. Try again.' : 'Generate an AI study insight for this chapter.'}
            </p>
          )}

          {!loading && insight && (
            <>
              {tabs.filter(t => t.show).length > 1 && (
                <div className="mb-4 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {tabs.filter(t => t.show).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                        tab === t.id ? 'bg-shield-fg text-shield-void' : 'text-shield-muted hover:bg-white/[0.06] hover:text-shield-fg'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'overview' && (
                <div className="space-y-4">
                  <p className="text-[14px] leading-relaxed text-shield-fg/90">{insight.explanation}</p>
                  {insight.keyThemes?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {insight.keyThemes.map(t => (
                        <span key={t} className="rounded-full border border-shield-accent/25 bg-shield-accent/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-shield-accent">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'context' && (
                <dl className="space-y-4">
                  {[
                    ['Historical context', insight.historicalContext],
                    ['Theological meaning', insight.theologicalMeaning],
                    ['Living it out', insight.practicalApplication],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="border-l-2 border-shield-brand/40 pl-3">
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-shield-muted">{label}</dt>
                      <dd className="text-[13.5px] leading-relaxed text-shield-fg/85">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {tab === 'crossrefs' && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {insight.crossReferences.map((cr, i) => (
                    <button
                      key={i}
                      onClick={() => onOpenReference?.(cr.reference)}
                      className="group rounded-xl border border-white/[0.07] bg-shield-void/30 p-3.5 text-left transition-colors hover:border-shield-brand/40 hover:bg-shield-brand/[0.06]"
                    >
                      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-shield-brand">
                        <Quote className="h-3 w-3" />{cr.reference}
                        <span className="ml-auto text-[10px] font-normal text-shield-muted opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
                      </p>
                      <p className="font-scripture text-[13px] italic leading-relaxed text-shield-fg/80">“{cr.text}”</p>
                      {cr.relevance && <p className="mt-1.5 text-[11.5px] leading-relaxed text-shield-muted">{cr.relevance}</p>}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'questions' && (
                <ol className="space-y-2.5">
                  {insight.studyQuestions.map((q, i) => (
                    <li key={i} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 text-[13.5px] leading-relaxed text-shield-fg/85">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-shield-accent/15 text-[11px] font-semibold text-shield-accent">{i + 1}</span>
                      <span>{typeof q === 'string' ? q : q.question}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
