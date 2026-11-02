import { useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { filterAnswers } from '../../../lib/answers'
import type { AnswerGroup } from '../../../lib/answers'

export interface AnswersIndexProps {
  groups: AnswerGroup[]
}

export function AnswersIndex({ groups }: AnswersIndexProps) {
  const [query, setQuery] = useState('')
  const inputId = useId()

  const visible = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, answers: filterAnswers(g.answers, query) }))
        .filter((g) => g.answers.length > 0),
    [groups, query],
  )

  return (
    <div>
      <div className="mb-10">
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-shield-fg">
          Filter answers
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by keyword"
          className="w-full rounded-lg border border-shield-edge bg-shield-panel/70 px-4 py-2.5 text-sm text-shield-fg placeholder:text-shield-muted focus:border-shield-brand focus:outline-none focus:ring-2 focus:ring-shield-brand/30"
        />
      </div>

      {visible.length === 0 ? (
        <p role="status" className="text-sm text-shield-muted">
          No answers match “{query.trim()}”.
        </p>
      ) : (
        <div className="space-y-10">
          {visible.map((group) => (
            <section key={group.id} aria-labelledby={`answers-${group.id}`}>
              <h2
                id={`answers-${group.id}`}
                className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-shield-brand"
              >
                {group.label}
              </h2>
              <ul className="space-y-2">
                {group.answers.map((answer) => (
                  <li key={answer.slug}>
                    <Link
                      href={`/answers/${answer.slug}`}
                      className="block rounded-xl border border-shield-edge/60 bg-shield-panel/40 px-5 py-4 text-base font-semibold text-shield-fg shadow-shield-card transition-colors hover:border-shield-brand/40 hover:text-shield-brand"
                    >
                      {answer.question}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default AnswersIndex
