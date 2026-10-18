import React, { useState } from 'react'
import { BookOpen, Check, ChevronDown, Columns, Copy, Languages, Link2, Search } from 'lucide-react'
import type { Passage, VerseHit } from '../../../../lib/scripture/types'
import type { Widget, WidgetEnvelope } from '../../../../lib/scripture/widgets'

/**
 * Cards for the Scripture agent's tool results. Each widget type from
 * lib/scripture/widgets.ts maps to one card; unknown types render nothing so
 * an older client never breaks on a newer server.
 */

const card = 'rounded-xl border border-shield-edge bg-shield-surface/60'
const label = 'flex items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-wide text-shield-muted'

function CardHeader({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-shield-edge/70 px-4 py-2.5">
      <span className={label}><Icon className="h-3.5 w-3.5" />{title}</span>
      {children}
    </div>
  )
}

function Verses({ passage }: { passage: Passage }) {
  return (
    <p className="font-scripture text-[15.5px] leading-[1.75] text-shield-fg">
      {passage.verses.map(v => (
        <span key={v.num}>
          <sup className="mr-0.5 font-sans text-[10px] font-semibold text-shield-brand">{v.num}</sup>
          {v.text}{' '}
        </span>
      ))}
    </p>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
      }}
      className="rounded-md p-1 text-shield-muted transition-colors hover:bg-shield-elevated hover:text-shield-fg"
      title="Copy passage"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-shield-brand" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

const passageCopyText = (p: Passage) => `${p.verses.map(v => v.text).join(' ')} (${p.reference}, ${p.translation})`

function PassageCard({ data }: { data: Extract<Widget, { type: 'passage' }>['data'] }) {
  const [passage, setPassage] = useState<Passage>(data)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const switchTo = async (translation: string) => {
    if (translation === passage.translation) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/scripture/passage?${new URLSearchParams({ reference: data.reference, translation })}`)
      if (!res.ok) throw new Error()
      setPassage((await res.json()).passage)
    } catch {
      setError(`${translation} isn't available for this passage.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={card}>
      <CardHeader icon={BookOpen} title={passage.reference}>
        <div className="flex items-center gap-1">
          {data.available.length > 1 && (
            <div className="flex rounded-lg border border-shield-edge p-0.5">
              {data.available.map(t => (
                <button
                  key={t.code}
                  onClick={() => switchTo(t.code)}
                  disabled={loading}
                  title={t.name}
                  className={`rounded-md px-2 py-0.5 font-sans text-[11px] font-medium transition-colors ${
                    passage.translation === t.code ? 'bg-shield-elevated text-shield-fg' : 'text-shield-muted hover:text-shield-fg'
                  }`}
                >
                  {t.code}
                </button>
              ))}
            </div>
          )}
          <CopyButton text={passageCopyText(passage)} />
        </div>
      </CardHeader>
      <div className={`px-4 py-3 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <Verses passage={passage} />
        {error && <p className="mt-2 font-sans text-xs text-shield-muted">{error}</p>}
        {passage.copyright && <p className="mt-2 font-sans text-[10.5px] leading-snug text-shield-muted/80">{passage.copyright}</p>}
      </div>
    </div>
  )
}

function TranslationCompare({ data }: { data: Extract<Widget, { type: 'translation_compare' }>['data'] }) {
  return (
    <div className={card}>
      <CardHeader icon={Columns} title={`${data.reference} · ${data.passages.length} translations`} />
      <div className={`grid gap-px bg-shield-edge/70 sm:grid-cols-2 ${data.passages.length > 2 ? 'lg:grid-cols-3' : ''}`}>
        {data.passages.map(p => (
          <div key={p.translation} className="bg-shield-surface px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-shield-brand">{p.translation}</span>
              <CopyButton text={passageCopyText(p)} />
            </div>
            <Verses passage={p} />
          </div>
        ))}
      </div>
      {data.passages.some(p => p.copyright) && (
        <p className="border-t border-shield-edge/70 px-4 py-2 font-sans text-[10.5px] leading-snug text-shield-muted/80">
          {data.passages.filter(p => p.copyright).map(p => p.copyright).join(' ')}
        </p>
      )}
    </div>
  )
}

function WordStudy({ data }: { data: Extract<Widget, { type: 'word_study' }>['data'] }) {
  const focusCodes = new Set(data.focus.map(f => f.strongs))
  const [open, setOpen] = useState<string | null>(data.focus[0]?.strongs ?? null)
  const openEntry = data.focus.find(f => f.strongs === open)

  return (
    <div className={card}>
      <CardHeader icon={Languages} title={`${data.reference} · ${data.language}`} />
      <div className="space-y-3 px-4 py-3">
        {data.verses.map(v => (
          <div key={v.verse}>
            {data.verses.length > 1 && <div className="mb-1 font-sans text-[10px] font-semibold text-shield-brand">v{v.verse}</div>}
            <div className={`flex flex-wrap gap-1.5 ${data.language === 'Hebrew' ? 'flex-row-reverse' : ''}`}>
              {v.words.map((w, i) => {
                const highlighted = focusCodes.has(w.strongs)
                return (
                  <button
                    key={`${w.strongs}-${i}`}
                    onClick={() => highlighted && setOpen(w.strongs)}
                    title={`${w.strongs} · ${w.morph}${w.lemma ? ` · lemma ${w.lemma}` : ''}`}
                    className={`rounded-lg border px-2 py-1 text-left transition-colors ${
                      highlighted ? 'border-shield-brand/60 bg-shield-brand/10' : 'border-shield-edge/70 bg-shield-canvas/40'
                    } ${highlighted ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="font-scripture text-[16px] leading-tight text-shield-fg" dir="auto">{w.surface}</div>
                    <div className="font-sans text-[10.5px] italic text-shield-muted">{w.translit}</div>
                    <div className="font-sans text-[11px] text-shield-fg/80">{w.gloss}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {openEntry && (
          <div className="rounded-lg border border-shield-edge/70 bg-shield-canvas/40 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2 font-sans">
              <span className="font-scripture text-[17px] text-shield-fg" dir="auto">{openEntry.lemma}</span>
              <span className="text-[12px] italic text-shield-muted">{openEntry.translit}</span>
              <span className="text-[11px] font-semibold text-shield-brand">{openEntry.strongs}</span>
              <span className="text-[11px] text-shield-muted">{openEntry.pos}</span>
            </div>
            <div className="mt-1 font-sans text-[12.5px] font-medium text-shield-fg">“{openEntry.gloss}”</div>
            <p className="mt-1 line-clamp-6 font-sans text-[12.5px] leading-relaxed text-shield-fg/80">{openEntry.definition}</p>
          </div>
        )}
        <p className="font-sans text-[10.5px] text-shield-muted/80">{data.attribution}</p>
      </div>
    </div>
  )
}

function HitList({ hits }: { hits: VerseHit[] }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? hits : hits.slice(0, 3)
  return (
    <>
      <ul className="divide-y divide-shield-edge/60">
        {shown.map(h => (
          <li key={`${h.reference}-${h.translation}`} className="px-4 py-2.5">
            <div className="font-sans text-[11.5px] font-semibold text-shield-brand">
              {h.reference} <span className="font-normal text-shield-muted">{h.translation}</span>
            </div>
            <p className="font-scripture text-[14.5px] leading-relaxed text-shield-fg/90">{h.text}</p>
          </li>
        ))}
      </ul>
      {hits.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex w-full items-center justify-center gap-1 border-t border-shield-edge/70 py-1.5 font-sans text-[11.5px] text-shield-muted hover:text-shield-fg"
        >
          {expanded ? 'Show fewer' : `Show ${hits.length - 3} more`}
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </>
  )
}

function CrossRefs({ data }: { data: Extract<Widget, { type: 'cross_refs' }>['data'] }) {
  return (
    <div className={card}>
      <CardHeader icon={Link2} title={`Related to ${data.reference}`} />
      <HitList hits={data.related} />
    </div>
  )
}

function VerseList({ data }: { data: Extract<Widget, { type: 'verse_list' }>['data'] }) {
  return (
    <div className={card}>
      <CardHeader icon={Search} title={`Scripture for “${data.query.length > 60 ? `${data.query.slice(0, 60)}…` : data.query}”`} />
      <HitList hits={data.hits} />
    </div>
  )
}

export function ScriptureWidget({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'passage': return <PassageCard data={widget.data} />
    case 'translation_compare': return <TranslationCompare data={widget.data} />
    case 'word_study': return <WordStudy data={widget.data} />
    case 'cross_refs': return <CrossRefs data={widget.data} />
    case 'verse_list': return <VerseList data={widget.data} />
    default: return null
  }
}

/**
 * The widgets of one reply. Search results only show when they're the only
 * evidence, since a passage or word study the model chose is more specific.
 */
export function ScriptureWidgets({ widgets }: { widgets: WidgetEnvelope[] }) {
  const specific = widgets.filter(w => w.widget.type !== 'verse_list')
  const shown = specific.length ? specific : widgets.slice(0, 1)
  if (!shown.length) return null
  return (
    <div className="mt-4 space-y-3">
      {shown.map(w => <ScriptureWidget key={w.toolCallId} widget={w.widget} />)}
    </div>
  )
}
