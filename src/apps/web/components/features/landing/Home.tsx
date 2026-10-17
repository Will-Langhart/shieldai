import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Church,
  HeartHandshake,
  Languages,
  MessageCircle,
  Search,
  ShieldCheck,
  StickyNote,
  Sparkles,
  Sunrise,
  Zap,
} from 'lucide-react'
import { LiveChatDemo } from './LiveChatDemo'
import { Reveal } from './Reveal'
import { FAQ_ITEMS } from './faqData'

const STEPS = [
  {
    number: '01',
    title: 'Ask your question',
    description:
      'Bring the hard questions — skeptic challenges, doctrine, suffering. Start free in gentle mode, or step up to scholarly or debate mode on a paid plan.',
    icon: MessageCircle,
  },
  {
    number: '02',
    title: 'Get scripture-grounded answers',
    description:
      'Every response is rooted in the Bible, with citations and cross-references you can open and read in context — not vague spiritual platitudes.',
    icon: ShieldCheck,
  },
  {
    number: '03',
    title: 'Go deeper',
    description:
      'Save what you learn to study notes, keep reading in the Bible reader, and pick the conversation back up whenever you are ready.',
    icon: BookOpen,
  },
]

// `badge` marks features that aren't on the web yet, so the page never
// promises something a visitor can't find after signing up.
const MINI_FEATURES: {
  title: string
  description: string
  icon: typeof StickyNote
  badge?: string
}[] = [
  {
    title: 'Study notes',
    description: 'Capture insights in the margins as you read and revisit them anytime.',
    icon: StickyNote,
  },
  {
    title: 'Daily verse',
    description: 'Start each day anchored in scripture chosen for you.',
    icon: Sunrise,
    badge: 'Coming to iOS',
  },
  {
    title: 'Church finder',
    description: 'Find a congregation near you when study becomes community.',
    icon: Church,
    badge: 'Coming to iOS',
  },
]

const TRUST_POINTS = [
  {
    title: 'Scripture first',
    description:
      'Before answering, Shield AI searches the Bible for the passages most relevant to your question and builds its answer on them.',
    icon: BookOpen,
  },
  {
    title: 'Your translation',
    description:
      'Answers quote from the Bible version you choose, so what you read matches the Bible on your shelf.',
    icon: Languages,
  },
  {
    title: 'References you can check',
    description:
      'Every answer names its passages so you can read them in context and test the reasoning yourself.',
    icon: Search,
  },
  {
    title: 'Honest about its limits',
    description:
      'Shield AI is a study companion, not a pastor. AI can be wrong — weigh everything against Scripture and bring the big questions to your church.',
    icon: HeartHandshake,
  },
]

// Mirrors the options in components/ui/DenominationSelector.tsx.
const TRADITIONS = [
  { name: 'Protestant', description: 'Reformed, Baptist, Lutheran, evangelical' },
  { name: 'Catholic', description: 'Roman Catholic tradition & Magisterium' },
  { name: 'Eastern Orthodox', description: 'Greek, Russian, Antiochian' },
  { name: 'Oriental Orthodox', description: 'Coptic, Ethiopian, Armenian, Syriac' },
]

export function Home() {
  return (
    <div className="relative min-h-screen text-shield-fg">
      {/* Static layered background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgb(var(--sh-deep)) 0%, rgb(var(--sh-canvas)) 38%, rgb(var(--sh-canvas)) 70%, rgb(var(--sh-tier)) 100%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-shield-mesh opacity-90 animate-shield-float"
        aria-hidden
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-shield-brand/15 blur-[100px]"
          aria-hidden
        />
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.35'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-shield-brand/25 bg-shield-brand/10 px-3.5 py-1.5 text-xs font-medium text-shield-brand shadow-shield-inset backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Christian apologetics &amp; Bible study</span>
              </div>

              <h1 className="mx-auto mb-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-shield-fg sm:text-5xl md:text-6xl lg:text-7xl">
                Answers for the{' '}
                <span className="bg-gradient-to-r from-shield-brand via-shield-accent to-shield-brand-dim bg-clip-text text-transparent">
                  hardest questions
                </span>{' '}
                of faith
              </h1>

              <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-shield-muted md:text-lg">
                Shield AI helps you study scripture and defend what you believe — with
                answers grounded in the Bible and built for real conversations.
              </p>

              <div className="mb-3 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/chat"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-shield-brand to-shield-brand-dim px-7 py-3 text-sm font-semibold text-shield-on-brand shadow-shield-glow-sm transition-all duration-300 hover:brightness-110 hover:shadow-shield-glow"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>Start chatting free</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/bible"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg border border-shield-edge bg-shield-panel/70 px-7 py-3 text-sm font-semibold text-shield-fg shadow-shield-inset backdrop-blur-sm transition-all duration-300 hover:border-shield-edge-strong hover:bg-shield-elevated/90"
                >
                  <BookOpen className="h-4 w-4 shrink-0 text-shield-brand" />
                  <span>Explore the Bible</span>
                </Link>
              </div>
              {/* Keep in sync with the 'basic' row in subscription_limits. */}
              <p className="mb-14 text-xs text-shield-muted/80">
                Free plan: 5 conversations a day in Gentle mode. Scholarly and Debate
                modes come with paid plans.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <LiveChatDemo />
            </Reveal>

            <Reveal delay={60}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-medium text-shield-muted/90">
                <span className="text-shield-fg/80">Scripture-aware</span>
                <span className="hidden text-shield-edge sm:inline" aria-hidden>·</span>
                <span>Apologetics-ready</span>
                <span className="hidden text-shield-edge sm:inline" aria-hidden>·</span>
                <span>Always available</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
                How it works
              </p>
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-shield-fg md:text-4xl">
                From question to conviction
              </h2>
              <p className="mx-auto max-w-xl text-sm text-shield-muted md:text-base">
                Three steps between the question that stumped you and an answer you can
                stand on.
              </p>
            </div>
          </Reveal>

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div
              className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-shield-brand/30 to-transparent md:block"
              aria-hidden
            />
            {STEPS.map((step, i) => (
              <Reveal key={step.number} delay={i * 120}>
                <div className="relative h-full rounded-xl border border-shield-edge/60 bg-shield-panel/40 p-6 shadow-shield-card backdrop-blur-md">
                  <div className="relative mb-5 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-shield-brand/25 bg-shield-brand/10">
                      <step.icon className="h-5 w-5 text-shield-brand" />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-shield-fg/10">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-bold text-shield-fg">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-shield-muted">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
                Capabilities
              </p>
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-shield-fg md:text-4xl">
                Built for study and dialogue
              </h2>
              <p className="mx-auto max-w-xl text-sm text-shield-muted md:text-base">
                Tools that meet you where you are — preparing a lesson, wrestling with a
                hard question, or reading chapter by chapter.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Reveal>
              <div className="group relative h-full overflow-hidden rounded-xl border border-shield-edge/60 bg-shield-panel/55 p-7 shadow-shield-card backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-shield-brand/25 hover:shadow-shield-glow-sm">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-shield-brand/10 blur-3xl" />
                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-shield-brand to-shield-brand-dim shadow-shield-glow-sm transition-transform duration-300 group-hover:scale-105">
                  <BookOpen className="h-6 w-6 text-shield-on-brand" />
                </div>
                <h3 className="relative mb-2 text-lg font-bold text-shield-fg">Bible study</h3>
                <p className="relative mb-5 text-sm leading-relaxed text-shield-muted">
                  Search and study scripture with AI-assisted insights, cross-references,
                  and study prompts tailored to what you read.
                </p>
                <ul className="relative space-y-2.5 text-sm text-shield-muted">
                  <li className="flex items-center gap-2.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-shield-brand" />
                    Deep search across passages and topics
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-shield-brand" />
                    Cross-reference and context helpers
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-shield-brand" />
                    Study questions generated as you go
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="group relative h-full overflow-hidden rounded-xl border border-shield-edge/60 bg-shield-panel/55 p-7 shadow-shield-card backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-shield-accent/30 hover:shadow-[0_0_40px_-12px_rgb(var(--sh-accent)/0.22)]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-shield-accent/10 blur-3xl" />
                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-shield-accent to-shield-accent-dim shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <MessageCircle className="h-6 w-6 text-shield-deep" />
                </div>
                <h3 className="relative mb-2 text-lg font-bold text-shield-fg">AI chat</h3>
                <p className="relative mb-5 text-sm leading-relaxed text-shield-muted">
                  Explore apologetics and spiritual questions with responses shaped for
                  clarity and charity.
                </p>
                <ul className="relative space-y-2.5 text-sm text-shield-muted">
                  <li className="flex items-center gap-2.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-shield-accent" />
                    Scripture-grounded answers with citations
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-shield-accent" />
                    Gentle mode free; scholarly and debate on paid plans
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-shield-accent" />
                    Available whenever you need a thoughtful voice
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {MINI_FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 100}>
                <div className="group h-full rounded-xl border border-shield-edge/60 bg-shield-panel/40 p-5 shadow-shield-card backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-shield-brand/25">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-shield-brand/20 bg-shield-brand/10">
                      <feature.icon className="h-4 w-4 text-shield-brand" />
                    </div>
                    {feature.badge && (
                      <span className="rounded-full border border-shield-accent/30 bg-shield-accent/10 px-2 py-0.5 text-[10px] font-semibold text-shield-accent">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-shield-fg">{feature.title}</h3>
                  <p className="text-xs leading-relaxed text-shield-muted">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="relative py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
                How we stay faithful
              </p>
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-shield-fg md:text-4xl">
                Answers you can test against Scripture
              </h2>
              <p className="mx-auto max-w-xl text-sm text-shield-muted md:text-base">
                You should not have to take an AI&apos;s word for it. Here is how Shield AI
                keeps the Bible at the center.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {TRUST_POINTS.map((point, i) => (
              <Reveal key={point.title} delay={i * 80}>
                <div className="flex h-full gap-4 rounded-xl border border-shield-edge/60 bg-shield-panel/40 p-6 shadow-shield-card backdrop-blur-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-shield-brand/20 bg-shield-brand/10">
                    <point.icon className="h-5 w-5 text-shield-brand" />
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-base font-bold text-shield-fg">{point.title}</h3>
                    <p className="text-sm leading-relaxed text-shield-muted">
                      {point.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Traditions */}
      <section className="relative py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-accent">
                Your tradition
              </p>
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-shield-fg md:text-4xl">
                Answers that respect where you worship
              </h2>
              <p className="mx-auto max-w-xl text-sm text-shield-muted md:text-base">
                Choose your tradition in your profile and Shield AI frames its answers
                through that church&apos;s theology and teachers, while noting where
                Christians differ.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {TRADITIONS.map((tradition, i) => (
              <Reveal key={tradition.name} delay={i * 80}>
                <div className="h-full rounded-xl border border-shield-accent/15 bg-shield-panel/40 p-5 text-center shadow-shield-card backdrop-blur-md transition-colors hover:border-shield-accent/35">
                  <h3 className="mb-1 text-sm font-bold text-shield-fg">{tradition.name}</h3>
                  <p className="text-xs leading-relaxed text-shield-muted">
                    {tradition.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-16 md:py-24">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
                Common questions
              </p>
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-shield-fg md:text-4xl">
                Answers to the questions people actually ask
              </h2>
              <p className="mx-auto max-w-xl text-sm text-shield-muted md:text-base">
                A few of the apologetics questions Shield AI is built to help you think
                through — with more available in the chat.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-shield-edge/60 bg-shield-panel/40 px-5 py-4 shadow-shield-card backdrop-blur-md transition-colors hover:border-shield-brand/25"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-shield-fg [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-shield-brand transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-shield-muted">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-[320px] w-[min(100%,640px)] -translate-x-1/2 rounded-full bg-shield-brand/10 blur-[110px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
              Get started
            </p>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-shield-fg md:text-4xl">
              Ready to go deeper?
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-sm text-shield-muted md:text-base">
              Open the chat for dialogue, or the Bible reader for focused study — both are
              a click away.
            </p>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/chat"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-shield-brand to-shield-brand-dim px-7 py-3 text-sm font-semibold text-shield-on-brand shadow-shield-glow-sm transition-all duration-300 hover:brightness-110 hover:shadow-shield-glow"
              >
                <Zap className="h-4 w-4 shrink-0" />
                <span>Get started free</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/bible"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-shield-edge bg-transparent px-7 py-3 text-sm font-semibold text-shield-fg transition-all duration-300 hover:border-shield-brand hover:text-shield-brand"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>Open Bible reader</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

export default Home
