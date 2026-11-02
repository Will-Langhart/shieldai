import Link from 'next/link'
import { Header } from '../components/Header'
import Footer from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { useWarmTheme } from '../hooks/useWarmTheme'
import { isFeatureOn } from '../lib/feature-flags'
import { getHelpSections, helpPageStaticProps } from '../lib/help-center'

// Help Center (behind the `help-center` flag). Public: no sign-in, no Supabase.
// With the flag off, /help stays a 404 exactly as before the page existed.

export const getStaticProps = () => helpPageStaticProps(isFeatureOn('help-center'))

export default function HelpPage() {
  const { themeAttr } = useWarmTheme()
  const sections = getHelpSections()
  return (
    <div className="warm-theme min-h-screen relative" {...themeAttr}>
      <Seo
        title="Help Center"
        description="How to use Shield AI: asking questions in chat, choosing gentle, scholarly or debate mode, reading the Bible, saving notes, and answers to common questions."
        path="/help"
      />
      <Header />
      <main className="relative min-h-screen bg-shield-canvas text-shield-fg">
        <div className="shield-page-shell max-w-3xl pb-20 pt-14">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-shield-fg md:text-5xl">Help Center</h1>
          <p className="mb-10 text-base leading-relaxed text-shield-muted md:text-lg">
            Everything you need to get started with Shield AI: asking questions, picking a chat mode, reading the
            Bible and keeping notes.
          </p>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="shield-glass-panel px-6 py-6 sm:px-8">
                <h2 className="mb-4 text-2xl font-semibold text-shield-fg">{section.title}</h2>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <details
                      key={item.question}
                      className="group rounded-xl border border-shield-edge bg-shield-panel/65 px-4 py-3"
                    >
                      <summary className="cursor-pointer font-semibold text-shield-fg">{item.question}</summary>
                      <p className="mt-2 leading-relaxed text-shield-muted">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-shield-muted">Still have a question?</p>
            <Link
              href="/chat"
              className="inline-block rounded-xl bg-shield-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-shield-brand/90"
            >
              Ask a question in chat
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
