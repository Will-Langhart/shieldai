import Link from 'next/link'
import { askHref, getCategoryLabel } from '../../../lib/answers/page-helpers'
import type { Answer } from '../../../lib/answers'

export interface AnswerDetailProps {
  answer: Answer
  related: Answer[]
}

const h2Class = 'mb-3 mt-10 text-xl font-semibold text-shield-fg'

export function AnswerDetail({ answer, related }: AnswerDetailProps) {
  return (
    <article>
      <Link
        href="/answers"
        className="mb-8 inline-block text-sm font-medium text-shield-muted transition-colors hover:text-shield-brand"
      >
        ← All answers
      </Link>

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-shield-brand">
        {getCategoryLabel(answer.category)}
      </p>
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-shield-fg md:text-4xl">{answer.question}</h1>
      <p className="text-base leading-relaxed text-shield-fg md:text-lg">{answer.shortAnswer}</p>

      <div className="mt-8">
        <Link
          href={askHref(answer.question)}
          className="inline-block rounded-lg bg-shield-brand px-5 py-3 text-base font-semibold text-white shadow-shield-card transition-opacity hover:opacity-90"
        >
          Ask Shield AI about this
        </Link>
      </div>

      <h2 className={h2Class}>Key points</h2>
      <ul className="list-disc space-y-2 pl-6 text-shield-fg">
        {answer.keyPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <h2 className={h2Class}>Key Scriptures</h2>
      <ul className="space-y-1 text-shield-fg">
        {answer.scriptures.map((ref) => (
          <li key={ref}>{ref}</li>
        ))}
      </ul>

      <h2 className={h2Class}>People also ask</h2>
      <ul className="space-y-2">
        {answer.followUps.map((followUp) => (
          <li key={followUp}>
            <Link href={askHref(followUp)} className="text-shield-brand hover:underline">
              {followUp}
            </Link>
          </li>
        ))}
      </ul>

      {related.length > 0 && (
        <>
          <h2 className={h2Class}>Related questions</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/answers/${r.slug}`}
                  className="block rounded-xl border border-shield-edge/60 bg-shield-panel/40 px-5 py-4 text-base font-semibold text-shield-fg transition-colors hover:border-shield-brand/40 hover:text-shield-brand"
                >
                  {r.question}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}

export default AnswerDetail
