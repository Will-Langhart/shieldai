import type { GetStaticProps } from 'next'
import { Header } from '../../components/Header'
import Footer from '../../components/layout/Footer'
import { Seo } from '../../components/Seo'
import { AnswersIndex } from '../../components/features/answers/AnswersIndex'
import { useWarmTheme } from '../../hooks/useWarmTheme'
import { isFeatureOn } from '../../lib/feature-flags'
import { getAnswersByCategory } from '../../lib/answers'
import type { AnswerGroup } from '../../lib/answers'

interface AnswersPageProps {
  groups: AnswerGroup[]
}

export const getStaticProps: GetStaticProps<AnswersPageProps> = async () => {
  if (!isFeatureOn('answers-library')) return { notFound: true }
  return { props: { groups: getAnswersByCategory() } }
}

export default function AnswersPage({ groups }: AnswersPageProps) {
  const { themeAttr } = useWarmTheme()
  return (
    <div className="warm-theme min-h-screen relative" {...themeAttr}>
      <Seo
        title="Answers to Hard Questions About the Christian Faith"
        description="Honest, Scripture-grounded answers to the hardest questions people ask about the Christian faith: God's existence, Jesus, the resurrection, suffering, science and more."
        path="/answers"
      />
      <Header />
      <main className="relative min-h-screen bg-shield-canvas text-shield-fg">
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-14 sm:px-6">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-shield-fg md:text-5xl">Answers</h1>
          <p className="mb-10 text-base leading-relaxed text-shield-muted md:text-lg">
            Honest, Scripture-grounded answers to the hardest questions people ask about the Christian faith.
          </p>
          <AnswersIndex groups={groups} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
