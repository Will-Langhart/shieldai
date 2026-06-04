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
        className="text-sm md:text-base text-shield-fg/95 font-medium transition-all duration-500 ease-in-out animate-fade-in"
        style={{
          animation: 'fadeIn 0.5s ease-in-out',
        }}
      >
        {questions[currentIndex]}
      </p>
      <div className="flex justify-center mt-3 gap-1.5">
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

  return (
    <div className="min-h-screen relative text-shield-fg">
      <div
        className="fixed inset-0 -z-10 bg-shield-deep transition-all duration-1000 ease-out"
        style={{
          background: `linear-gradient(180deg, 
            #12151C 0%, 
            #171A22 18%, 
            #1A1D24 38%, 
            #1C2029 58%, 
            #1E222C 78%, 
            #20242E 100%)`,
          filter: `brightness(${1 + colorShift * 0.08}) saturate(${1 + colorShift * 0.12})`,
        }}
      />

      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out -z-10 bg-shield-mesh opacity-90 animate-shield-float"
        aria-hidden
      />

      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-all duration-1000 ease-out"
        style={{
          background: `linear-gradient(180deg, 
            rgba(22, 25, 32, ${0.12 + colorShift * 0.06}) 0%, 
            rgba(24, 27, 34, ${0.08 + colorShift * 0.08}) 45%, 
            rgba(26, 30, 38, ${0.1 + colorShift * 0.1}) 100%)`,
        }}
      />

      {/* Hero */}
      <section className="landing-section scroll-enhanced enhanced-transition relative overflow-hidden bg-transparent pt-20 pb-16 md:pt-24 md:pb-20">
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
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
              Faith-informed AI
            </p>

            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-shield-brand/25 bg-shield-brand/10 px-3 py-1.5 text-xs font-medium text-shield-brand shadow-shield-inset backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Christian apologetics & Bible study</span>
            </div>

            <h1 className="mb-4 text-4xl font-bold leading-[1.05] tracking-tight text-shield-fg sm:text-5xl md:text-6xl">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-shield-brand via-sky-300 to-shield-brand-dim bg-clip-text text-transparent">
                Shield AI
              </span>
            </h1>

            <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-shield-muted md:text-base md:leading-relaxed">
              Your assistant for scripture, thoughtful answers, and apologetics—grounded in biblical wisdom
              and built for real conversations.
            </p>

            <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-medium text-shield-muted/90">
              <span className="text-shield-fg/80">Scripture-aware</span>
              <span className="hidden text-shield-edge sm:inline" aria-hidden>·</span>
              <span>Apologetics-ready</span>
              <span className="hidden text-shield-edge sm:inline" aria-hidden>·</span>
              <span>Always available</span>
            </div>

            <div className="mb-8 max-w-2xl mx-auto rounded-xl border border-white/[0.06] bg-shield-panel/35 px-5 py-5 shadow-shield-card backdrop-blur-md">
              <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-shield-muted">
                Ask Shield AI about
              </h3>
              <div className="flex min-h-[48px] items-center justify-center">
                <QuestionRotator />
              </div>
            </div>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link
                href="/chat"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-shield-brand to-shield-brand-dim px-6 py-2.5 text-sm font-semibold text-white shadow-shield-glow-sm transition-all duration-300 hover:brightness-110 hover:shadow-shield-glow"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>Start chatting</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/bible"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-shield-edge bg-shield-panel/70 px-6 py-2.5 text-sm font-semibold text-shield-fg shadow-shield-inset backdrop-blur-sm transition-all duration-300 hover:border-shield-edge-strong hover:bg-shield-elevated/90"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-shield-brand" />
                <span>Explore the Bible</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section scroll-enhanced enhanced-transition relative bg-transparent py-14 md:py-20">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
              Capabilities
            </p>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-shield-fg md:text-3xl">
              Built for study and dialogue
            </h2>
            <p className="mx-auto max-w-xl text-sm text-shield-muted">
              Tools that meet you where you are—whether you are preparing a lesson, wrestling with a hard
              question, or reading chapter by chapter.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-shield-panel/55 p-6 shadow-shield-card backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-shield-brand/25 hover:shadow-shield-glow-sm">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-shield-brand/10 blur-3xl transition-opacity group-hover:opacity-100" />
              <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-shield-brand to-shield-brand-dim shadow-shield-glow-sm transition-transform duration-300 group-hover:scale-105">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="relative mb-2 text-center text-lg font-bold text-shield-fg">Bible study</h3>
              <p className="relative mb-4 text-center text-sm leading-relaxed text-shield-muted">
                Search and study scripture with AI-assisted insights, cross-references, and study prompts.
              </p>
              <ul className="relative space-y-2 text-xs text-shield-muted">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" />
                  Deep search across passages and topics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" />
                  Cross-reference and context helpers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" />
                  Questions tailored to what you read
                </li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-shield-panel/55 p-6 shadow-shield-card backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-shield-accent/30 hover:shadow-[0_0_40px_-12px_rgba(232,180,76,0.22)]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-shield-accent/10 blur-3xl transition-opacity group-hover:opacity-100" />
              <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-shield-accent to-shield-accent-dim shadow-lg transition-transform duration-300 group-hover:scale-105">
                <MessageCircle className="h-6 w-6 text-shield-deep" />
              </div>
              <h3 className="relative mb-2 text-center text-lg font-bold text-shield-fg">AI chat</h3>
              <p className="relative mb-4 text-center text-sm leading-relaxed text-shield-muted">
                Explore apologetics and spiritual questions with responses shaped for clarity and charity.
              </p>
              <ul className="relative space-y-2 text-xs text-shield-muted">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" />
                  Scripture-grounded answers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" />
                  Modes for gentle, scholarly, or debate-style dialogue
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" />
                  Available whenever you need a thoughtful voice
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-section scroll-enhanced enhanced-transition relative overflow-hidden bg-transparent py-14 md:py-20">
        <div className="relative mx-auto max-w-xl px-4 text-center sm:px-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-shield-brand">
            Get started
          </p>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-shield-fg md:text-3xl">
            Ready to go deeper?
          </h2>
          <p className="mx-auto mb-8 max-w-sm text-sm text-shield-muted">
            Open the chat for dialogue, or the Bible reader for focused study—both are a click away.
          </p>

          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/chat"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-shield-brand to-shield-brand-dim px-6 py-2.5 text-sm font-semibold text-white shadow-shield-glow-sm transition-all duration-300 hover:brightness-110 hover:shadow-shield-glow"
            >
              <Zap className="h-4 w-4 shrink-0" />
              <span>Get started free</span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/bible"
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-shield-edge bg-transparent px-6 py-2.5 text-sm font-semibold text-shield-fg transition-all duration-300 hover:border-shield-brand hover:text-shield-brand"
            >
              <Play className="h-4 w-4 shrink-0" />
              <span>Open Bible reader</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
