import { ANSWERS } from './topics';
import { ANSWER_CATEGORIES } from './types';
import type { Answer, AnswerCategory } from './types';

export { ANSWERS } from './topics';
export { ANSWER_CATEGORIES } from './types';
export type { Answer, AnswerCategory } from './types';

export type AnswerGroup = {
  id: AnswerCategory;
  label: string;
  answers: Answer[];
};

export function getAllAnswers(): Answer[] {
  return ANSWERS;
}

export function getAnswerBySlug(slug: string): Answer | undefined {
  return ANSWERS.find((a) => a.slug === slug);
}

/** Categories in ANSWER_CATEGORIES order with their answers; empty ones are skipped. */
export function getAnswersByCategory(answers: Answer[] = ANSWERS): AnswerGroup[] {
  return ANSWER_CATEGORIES.map(({ id, label }) => ({
    id,
    label,
    answers: answers.filter((a) => a.category === id),
  })).filter((group) => group.answers.length > 0);
}

/** Case-insensitive match on question, shortAnswer and keyPoints. A blank query returns all. */
export function filterAnswers(answers: Answer[], query: string): Answer[] {
  const q = query.trim().toLowerCase();
  if (!q) return answers;
  return answers.filter(
    (a) =>
      a.question.toLowerCase().includes(q) ||
      a.shortAnswer.toLowerCase().includes(q) ||
      a.keyPoints.some((p) => p.toLowerCase().includes(q)),
  );
}
