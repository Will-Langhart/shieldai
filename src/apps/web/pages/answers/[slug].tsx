import type { GetStaticPaths, GetStaticProps } from 'next'
import { Header } from '../../components/Header'
import Footer from '../../components/layout/Footer'
import { Seo } from '../../components/Seo'
import { AnswerDetail } from '../../components/features/answers/AnswerDetail'
import { useWarmTheme } from '../../hooks/useWarmTheme'
import { isFeatureOn } from '../../lib/feature-flags'
import { getAllAnswers, getAnswerBySlug } from '../../lib/answers'
import type { Answer } from '../../lib/answers'
import { buildAnswerDescription, buildAnswerJsonLd, getRelatedAnswers } from '../../lib/answers/page-helpers'

interface AnswerPageProps {
  answer: Answer
  related: Answer[]
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = isFeatureOn('answers-library')
    ? getAllAnswers().map((a) => ({ params: { slug: a.slug } }))
    : []
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps<AnswerPageProps> = async ({ params }) => {
  if (!isFeatureOn('answers-library')) return { notFound: true }
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  const answer = getAnswerBySlug(slug)
  if (!answer) return { notFound: true }
  return { props: { answer, related: getRelatedAnswers(answer) } }
}

export default function AnswerPage({ answer, related }: AnswerPageProps) {
  const { themeAttr } = useWarmTheme()
  return (
    <div className="warm-theme min-h-screen relative" {...themeAttr}>
      <Seo
        title={answer.question}
        description={buildAnswerDescription(answer)}
        path={`/answers/${answer.slug}`}
        type="article"
        jsonLd={buildAnswerJsonLd(answer)}
      />
      <Header />
      <main className="relative min-h-screen bg-shield-canvas text-shield-fg">
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-14 sm:px-6">
          <AnswerDetail answer={answer} related={related} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
