import Link from 'next/link'
import { BookOpen, MessageCircle, ArrowRight, CheckCircle, Play, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

function QuestionRotator() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const questions = [
    'How can I defend the existence of God scientifically?',
    'What evidence supports the resurrection of Jesus?',
    'How do I respond to the problem of evil and suffering?',
    'Is the Bible historically reliable and accurate?',
    'How can I explain the Trinity to non-Christians?',
    "What's the difference between faith and blind belief?",
    'How do I address questions about evolution and creation?',
    'What are the strongest arguments for Christianity?',
    'How can I defend the moral argument for God?',
    'What about other religions - why Christianity?',
    "How do I respond to 'God of the gaps' criticisms?",
    'What evidence exists for the reliability of the Gospels?',
    'How can I explain free will and God\'s sovereignty?',
    "What's the best way to approach atheist friends?",
    'How do I defend the historicity of Jesus Christ?',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % questions.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [questions.length])

  return (
    <div className="text-center">
      <p
        key={currentIndex}
        className="text-lg md:text-xl text-shield-fg/95 font-medium transition-all duration-500 ease-in-out animate-fade-in"
        style={{
          animation: 'fadeIn 0.5s ease-in-out',
        }}
      >
        {questions[currentIndex]}
      </p>
      <div className="flex justify-center mt-5 gap-2">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-6 bg-shield-brand shadow-shield-glow-sm'
                : 'w-1.5 bg-shield-muted/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function Home() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollProgress = Math.min(
    scrollY / (typeof window !== 'undefined' ? window.innerHeight * 3 : 1),
    1
  )
  const colorShift = scrollProgress * 0.3

  const getSectionColor = (sectionIndex: number) => {
    if (typeof window === 'undefined') {
      return { brightness: 1, saturation: 1, hue: 0 }
    }
    const sectionProgress = Math.max(
      0,
      Math.min(1, (scrollY - sectionIndex * window.innerHeight) / window.innerHeight)
    )
    return {
      brightness: 1 + sectionProgress * 0.1,
      saturation: 1 + sectionProgress * 0.2,
      hue: sectionProgress * 5,
    }
  }

  return (
    <div className="min-h-screen relative text-shield-fg">
      <div
        className="fixed inset-0 transition-all duration-1000 ease-out -z-10 bg-shield-deep"
        style={{
          background: `linear-gradient(180deg, 
            #12151C 0%, 
            #1A1D24 22%, 
            #1E2128 48%, 
            #222530 68%, 
            #262A36 88%, 
            #2A2E3A 100%)`,
          filter: `brightness(${1 + colorShift * 0.1}) saturate(${1 + colorShift * 0.2})`,
        }}
      />

      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out -z-10 bg-shield-mesh opacity-90 animate-shield-float"
        aria-hidden
      />

      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out -z-10"
        style={{
          background: `linear-gradient(180deg, 
            rgba(26, 29, 36, ${0.35 + colorShift * 0.15}) 0%, 
            rgba(30, 33, 40, ${0.2 + colorShift * 0.25}) 50%, 
            rgba(44, 48, 58, ${0.08 + colorShift * 0.35}) 100%)`,
        }}
      />

      {/* Hero */}
      <section
        className="landing-section section-transition scroll-enhanced enhanced-transition relative overflow-hidden bg-gradient-shield-hero pt-28 pb-32 md:pt-36 md:pb-40"
        style={{
          filter: `brightness(${getSectionColor(0).brightness}) saturate(${getSectionColor(0).saturation}) hue-rotate(${getSectionColor(0).hue}deg)`,
        }}
      >
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-shield-brand/15 blur-[100px]"
          aria-hidden
        />
        <div className="absolute inset-0 opacity-[0.07]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.35'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
              Faith-informed AI
            </p>

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-shield-brand/25 bg-shield-brand/10 px-4 py-2 text-sm font-medium text-shield-brand shadow-shield-inset backdrop-blur-sm">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Christian apologetics & Bible study</span>
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight text-shield-fg sm:text-6xl md:text-7xl lg:text-8xl">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-shield-brand via-sky-300 to-shield-brand-dim bg-clip-text text-transparent">
                Shield AI
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-shield-muted md:text-xl md:leading-relaxed">
              Your assistant for scripture, thoughtful answers, and apologetics—grounded in biblical wisdom
              and built for real conversations.
            </p>

            <div className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-shield-muted/90">
              <span className="text-shield-fg/80">Scripture-aware</span>
              <span className="hidden text-shield-edge sm:inline" aria-hidden>
                ·
              </span>
              <span>Apologetics-ready</span>
              <span className="hidden text-shield-edge sm:inline" aria-hidden>
                ·
              </span>
              <span>Always available</span>
            </div>

            <div className="mb-14 max-w-3xl mx-auto rounded-2xl border border-white/[0.06] bg-shield-panel/35 px-6 py-8 shadow-shield-card backdrop-blur-md">
              <h3 className="mb-5 text-center text-sm font-semibold uppercase tracking-wider text-shield-muted">
                Ask Shield AI about
              </h3>
              <div className="flex min-h-[64px] items-center justify-center">
                <QuestionRotator />
              </div>
            </div>

            <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
              <Link
                href="/chat"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-shield-brand to-shield-brand-dim px-8 py-4 text-lg font-semibold text-white shadow-shield-glow-sm transition-all duration-300 hover:brightness-110 hover:shadow-shield-glow md:px-10"
              >
                <MessageCircle className="h-6 w-6 shrink-0" />
                <span>Start chatting</span>
                <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/bible"
                className="group inline-flex items-center justify-center gap-3 rounded-xl border border-shield-edge bg-shield-panel/70 px-8 py-4 text-lg font-semibold text-shield-fg shadow-shield-inset backdrop-blur-sm transition-all duration-300 hover:border-shield-edge-strong hover:bg-shield-elevated/90 md:px-10"
              >
                <BookOpen className="h-6 w-6 shrink-0 text-shield-brand" />
                <span>Explore the Bible</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-full bg-gradient-to-b from-transparent to-shield-surface" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-14 w-full bg-gradient-to-b from-transparent to-shield-layer opacity-70" />
      </section>

      {/* Features */}
      <section
        className="landing-section section-transition scroll-enhanced enhanced-transition relative flex min-h-screen items-center py-24 bg-gradient-to-b from-shield-surface via-shield-layer to-shield-tier"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center md:mb-20">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
              Capabilities
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-shield-fg md:text-4xl lg:text-5xl">
              Built for study and dialogue
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-shield-muted">
              Tools that meet you where you are—whether you are preparing a lesson, wrestling with a hard
              question, or reading chapter by chapter.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-shield-panel/55 p-8 shadow-shield-card backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-shield-brand/25 hover:shadow-shield-glow-sm">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-shield-brand/10 blur-3xl transition-opacity group-hover:opacity-100" />
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-shield-brand to-shield-brand-dim shadow-shield-glow-sm transition-transform duration-300 group-hover:scale-105">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="relative mb-3 text-center text-2xl font-bold text-shield-fg">Bible study</h3>
              <p className="relative mb-6 text-center leading-relaxed text-shield-muted">
                Search and study scripture with AI-assisted insights, cross-references, and study prompts.
              </p>
              <ul className="relative space-y-2.5 text-sm text-shield-muted">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400/90" />
                  Deep search across passages and topics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400/90" />
                  Cross-reference and context helpers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400/90" />
                  Questions tailored to what you read
                </li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-shield-panel/55 p-8 shadow-shield-card backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-shield-accent/30 hover:shadow-[0_0_40px_-12px_rgba(232,180,76,0.22)]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-shield-accent/10 blur-3xl transition-opacity group-hover:opacity-100" />
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-shield-accent to-shield-accent-dim shadow-lg transition-transform duration-300 group-hover:scale-105">
                <MessageCircle className="h-8 w-8 text-shield-deep" />
              </div>
              <h3 className="relative mb-3 text-center text-2xl font-bold text-shield-fg">AI chat</h3>
              <p className="relative mb-6 text-center leading-relaxed text-shield-muted">
                Explore apologetics and spiritual questions with responses shaped for clarity and charity.
              </p>
              <ul className="relative space-y-2.5 text-sm text-shield-muted">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400/90" />
                  Scripture-grounded answers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400/90" />
                  Modes for gentle, scholarly, or debate-style dialogue
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400/90" />
                  Available whenever you need a thoughtful voice
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-full bg-gradient-to-b from-transparent to-shield-tier" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-14 w-full bg-gradient-to-b from-transparent to-shield-mist opacity-70" />
      </section>

      {/* CTA */}
      <section className="landing-section section-transition scroll-enhanced enhanced-transition relative overflow-hidden py-24 md:py-28 bg-gradient-to-b from-shield-panel via-shield-canvas to-shield-deep">
        <div className="pointer-events-none absolute inset-0 bg-shield-radial opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
            Get started
          </p>
          <h2 className="mb-5 text-3xl font-bold tracking-tight text-shield-fg md:text-4xl lg:text-5xl">
            Ready to go deeper?
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-lg text-shield-muted">
            Open the chat for dialogue, or the Bible reader for focused study—both are a click away.
          </p>

          <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/chat"
              className="group inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-shield-brand to-shield-brand-dim px-10 py-4 text-lg font-semibold text-white shadow-shield-glow-sm transition-all duration-300 hover:brightness-110 hover:shadow-shield-glow"
            >
              <Zap className="h-6 w-6 shrink-0" />
              <span>Get started free</span>
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/bible"
              className="group inline-flex items-center justify-center gap-3 rounded-xl border-2 border-shield-edge bg-transparent px-10 py-4 text-lg font-semibold text-shield-fg transition-all duration-300 hover:border-shield-brand hover:text-shield-brand"
            >
              <Play className="h-6 w-6 shrink-0" />
              <span>Open Bible reader</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
