import Link from 'next/link'
import { ArrowRight, BookOpen, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Exchange {
  question: string
  answer: string
  refs: string[]
  mode: 'Gentle' | 'Scholarly' | 'Debate'
}

const EXCHANGES: Exchange[] = [
  {
    question: 'What evidence supports the resurrection of Jesus?',
    answer:
      'Historians across the spectrum grant several facts: Jesus died by crucifixion, his tomb was found empty, and his followers sincerely believed they saw him alive. Paul preserves an early creed naming over five hundred eyewitnesses — most still living when he wrote.',
    refs: ['1 Corinthians 15:3–8', 'Luke 24:36–43'],
    mode: 'Scholarly',
  },
  {
    question: 'How do I respond to the problem of evil and suffering?',
    answer:
      "Scripture never minimizes suffering — it meets it. At the cross, God entered evil's worst rather than watching from a distance. Romans holds both truths together: present suffering is real, and it is not the final word.",
    refs: ['Romans 8:18', 'Genesis 50:20'],
    mode: 'Gentle',
  },
  {
    question: 'Is the Bible historically reliable?',
    answer:
      'The New Testament is the best-attested text from the ancient world — thousands of early manuscripts, quoted extensively by writers within living memory, with archaeology repeatedly confirming its places, rulers, and customs.',
    refs: ['Luke 1:1–4', '2 Peter 1:16'],
    mode: 'Scholarly',
  },
]

const PLACEHOLDER_QUESTIONS = [
  'How can I explain the Trinity to non-Christians?',
  'What are the strongest arguments for Christianity?',
  "How do I respond to 'God of the gaps' criticisms?",
  'How can I defend the moral argument for God?',
  "What's the best way to approach atheist friends?",
]

type Phase = 'asking' | 'thinking' | 'answering' | 'done'

const MODE_STYLES: Record<Exchange['mode'], string> = {
  Gentle: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  Scholarly: 'border-shield-brand/30 bg-shield-brand/10 text-shield-brand',
  Debate: 'border-shield-accent/30 bg-shield-accent/10 text-shield-accent',
}

/**
 * Self-playing mock conversation. Starts when scrolled into view and loops
 * through EXCHANGES. With prefers-reduced-motion it renders the first
 * exchange fully, with no animation.
 */
export function LiveChatDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [wordCount, setWordCount] = useState(0)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const exchange = EXCHANGES[index]
    const words = exchange.answer.split(' ')
    let timer: ReturnType<typeof setTimeout>

    if (phase === 'asking') {
      timer = setTimeout(() => setPhase('thinking'), 1000)
    } else if (phase === 'thinking') {
      timer = setTimeout(() => setPhase('answering'), 1200)
    } else if (phase === 'answering') {
      if (wordCount < words.length) {
        timer = setTimeout(() => setWordCount((c) => c + 1), 30)
      } else {
        timer = setTimeout(() => setPhase('done'), 300)
      }
    } else {
      timer = setTimeout(() => {
        setIndex((i) => (i + 1) % EXCHANGES.length)
        setWordCount(0)
        setPhase('asking')
      }, 4600)
    }

    return () => clearTimeout(timer)
  }, [started, phase, wordCount, index])

  useEffect(() => {
    if (reducedMotion) return
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_QUESTIONS.length)
    }, 3200)
    return () => clearInterval(interval)
  }, [reducedMotion])

  const exchange = EXCHANGES[index]
  const effectivePhase: Phase = reducedMotion ? 'done' : phase
  const answerText = reducedMotion
    ? exchange.answer
    : exchange.answer.split(' ').slice(0, wordCount).join(' ')
  const showAnswer = effectivePhase === 'answering' || effectivePhase === 'done'

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl">
      <div
        className="pointer-events-none absolute -inset-8 rounded-[32px] bg-shield-brand/10 blur-3xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-shield-deep/80 shadow-shield-card backdrop-blur-xl">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-shield-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-shield-brand" />
            Shield AI — live preview
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${MODE_STYLES[exchange.mode]}`}
          >
            {exchange.mode} mode
          </span>
        </div>

        {/* Conversation */}
        <div className="flex h-[340px] flex-col gap-4 overflow-hidden px-4 py-5 sm:px-6 md:h-[320px]">
          <div key={`q-${index}`} className="flex justify-end demo-message">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-r from-shield-brand to-shield-brand-dim px-4 py-2.5 text-left text-sm font-medium text-white shadow-shield-glow-sm">
              {exchange.question}
            </div>
          </div>

          {effectivePhase === 'thinking' && (
            <div className="flex justify-start demo-message">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/[0.06] bg-shield-panel/70 px-4 py-3">
                <span className="demo-dot" />
                <span className="demo-dot" style={{ animationDelay: '0.15s' }} />
                <span className="demo-dot" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}

          {showAnswer && (
            <div className="flex justify-start demo-message">
              <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-white/[0.06] bg-shield-panel/70 px-4 py-3 text-left">
                <p className="text-sm leading-relaxed text-shield-fg/95">
                  {answerText}
                  {effectivePhase === 'answering' && <span className="demo-caret" aria-hidden />}
                </p>
                {effectivePhase === 'done' && (
                  <div className="mt-3 flex flex-wrap gap-1.5 demo-message">
                    {exchange.refs.map((ref) => (
                      <span
                        key={ref}
                        className="inline-flex items-center gap-1 rounded-full border border-shield-accent/25 bg-shield-accent/[0.08] px-2.5 py-1 text-[11px] font-medium text-shield-accent"
                      >
                        <BookOpen className="h-3 w-3 shrink-0" />
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mock input */}
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-shield-edge/70 bg-shield-panel/60 px-4 py-2.5">
            <p
              key={placeholderIndex}
              className="flex-1 truncate text-left text-sm text-shield-muted/70 animate-fade-in"
            >
              {PLACEHOLDER_QUESTIONS[placeholderIndex]}
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-shield-brand to-shield-brand-dim">
              <Send className="h-3.5 w-3.5 text-white" />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Link
          href="/chat"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-shield-brand transition-colors hover:text-shield-fg"
        >
          Try it yourself
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
