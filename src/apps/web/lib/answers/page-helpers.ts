// Pure helpers for the /answers/[slug] topic page.
import { ANSWER_CATEGORIES } from './types';
import type { Answer, AnswerCategory } from './types';
import { getAnswerBySlug } from './index';

/** Link that opens the chat with its composer pre-filled with `question`. */
export function askHref(question: string): string {
  return `/chat?q=${encodeURIComponent(question)}`;
}

/** schema.org FAQPage for one answer; the answer text is exactly the shortAnswer shown on the page. */
export function buildAnswerJsonLd(answer: Answer): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: answer.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer.shortAnswer,
        },
      },
    ],
  };
}

/** The answer's related entries, in order, skipping slugs that don't exist. */
export function getRelatedAnswers(answer: Answer): Answer[] {
  return answer.related
    .map((slug) => getAnswerBySlug(slug))
    .filter((a): a is Answer => a !== undefined);
}

export function getCategoryLabel(category: AnswerCategory): string {
  return ANSWER_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

/** Meta description: the shortAnswer cut to ~155 chars on a word boundary. */
export function buildAnswerDescription(answer: Answer, max = 155): string {
  const text = answer.shortAnswer.trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, '')}…`;
}
