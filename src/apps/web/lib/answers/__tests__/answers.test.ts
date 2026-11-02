import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, resolveFlag } from '../../feature-flags';
import { parseReference } from '../../reference-utils';
import {
  ANSWER_CATEGORIES,
  ANSWERS,
  filterAnswers,
  getAllAnswers,
  getAnswerBySlug,
  getAnswersByCategory,
} from '..';
import type { Answer } from '..';

const wordCount = (s: string) => s.trim().split(/\s+/).length;

describe('answers content', () => {
  it('has the eight launch topics', () => {
    expect(ANSWERS.map((a) => a.slug).sort()).toEqual(
      [
        'does-god-exist',
        'how-is-a-person-saved',
        'is-the-bible-reliable',
        'moral-argument',
        'problem-of-evil',
        'resurrection-evidence',
        'science-and-faith',
        'who-is-jesus',
      ].sort(),
    );
  });

  it.each(ANSWERS.map((a) => [a.slug, a] as const))('%s is complete', (_slug, a) => {
    expect(a.question.trim()).not.toBe('');
    expect(a.question.endsWith('?')).toBe(true);
    expect(a.question.length).toBeLessThan(120);
    expect(wordCount(a.shortAnswer)).toBeGreaterThanOrEqual(60);
    expect(wordCount(a.shortAnswer)).toBeLessThanOrEqual(140);
    expect(a.keyPoints.length).toBeGreaterThanOrEqual(3);
    expect(a.keyPoints.length).toBeLessThanOrEqual(5);
    expect(a.scriptures.length).toBeGreaterThanOrEqual(2);
    expect(a.scriptures.length).toBeLessThanOrEqual(5);
    expect(a.followUps.length).toBeGreaterThanOrEqual(2);
    expect(a.followUps.length).toBeLessThanOrEqual(4);
    expect(a.related.length).toBeGreaterThanOrEqual(2);
    expect(a.related.length).toBeLessThanOrEqual(4);
    for (const s of [...a.keyPoints, ...a.scriptures, ...a.followUps, ...a.related]) {
      expect(s.trim()).not.toBe('');
    }
    for (const f of a.followUps) expect(f.endsWith('?')).toBe(true);
  });

  it('has unique kebab-case slugs in known categories', () => {
    const slugs = ANSWERS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const categoryIds = ANSWER_CATEGORIES.map((c) => c.id);
    for (const a of ANSWERS) {
      expect(a.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(categoryIds).toContain(a.category);
    }
  });

  it('only relates to other existing answers', () => {
    const slugs = new Set(ANSWERS.map((a) => a.slug));
    for (const a of ANSWERS) {
      expect(new Set(a.related).size).toBe(a.related.length);
      for (const r of a.related) {
        expect(slugs.has(r)).toBe(true);
        expect(r).not.toBe(a.slug);
      }
    }
  });

  it('uses scripture references parseReference accepts', () => {
    for (const a of ANSWERS) {
      for (const ref of a.scriptures) {
        expect(parseReference(ref), ref).not.toBeNull();
      }
    }
  });

  it('lists categories in the agreed order', () => {
    expect(ANSWER_CATEGORIES.map((c) => c.id)).toEqual([
      'god',
      'jesus',
      'resurrection',
      'bible',
      'suffering',
      'science',
      'religions',
      'morality',
      'salvation',
      'christian-living',
    ]);
  });
});

describe('answers helpers', () => {
  it('getAllAnswers and getAnswerBySlug', () => {
    expect(getAllAnswers()).toBe(ANSWERS);
    expect(getAnswerBySlug('who-is-jesus')?.category).toBe('jesus');
    expect(getAnswerBySlug('nope')).toBeUndefined();
  });

  it('filterAnswers returns all for a blank query', () => {
    expect(filterAnswers(ANSWERS, '')).toEqual(ANSWERS);
    expect(filterAnswers(ANSWERS, '   ')).toEqual(ANSWERS);
  });

  it('filterAnswers matches question, shortAnswer and keyPoints case-insensitively', () => {
    const sample: Answer[] = [
      { ...ANSWERS[0], slug: 'a', question: 'Alpha QUESTION?', shortAnswer: 'x', keyPoints: ['y'] },
      { ...ANSWERS[0], slug: 'b', question: 'b?', shortAnswer: 'has Beta inside', keyPoints: ['y'] },
      { ...ANSWERS[0], slug: 'c', question: 'c?', shortAnswer: 'x', keyPoints: ['z', 'Gamma point'] },
    ];
    expect(filterAnswers(sample, 'question').map((a) => a.slug)).toEqual(['a']);
    expect(filterAnswers(sample, 'BETA').map((a) => a.slug)).toEqual(['b']);
    expect(filterAnswers(sample, 'gamma').map((a) => a.slug)).toEqual(['c']);
    expect(filterAnswers(ANSWERS, 'resurrection').map((a) => a.slug)).toContain('resurrection-evidence');
  });

  it('filterAnswers returns nothing for a non-match', () => {
    expect(filterAnswers(ANSWERS, 'zzqxnonsense')).toEqual([]);
  });

  it('getAnswersByCategory keeps category order and skips empty ones', () => {
    const groups = getAnswersByCategory();
    const order = ANSWER_CATEGORIES.map((c) => c.id);
    const ids = groups.map((g) => g.id);
    expect(ids).toEqual(order.filter((id) => ids.includes(id)));
    expect(ids).not.toContain('religions');
    expect(ids).not.toContain('christian-living');
    for (const g of groups) {
      expect(g.answers.length).toBeGreaterThan(0);
      expect(g.label).toBe(ANSWER_CATEGORIES.find((c) => c.id === g.id)?.label);
    }
    expect(groups.flatMap((g) => g.answers)).toHaveLength(ANSWERS.length);

    const subset = getAnswersByCategory([getAnswerBySlug('problem-of-evil')!, getAnswerBySlug('does-god-exist')!]);
    expect(subset.map((g) => g.id)).toEqual(['god', 'suffering']);
  });
});

describe('answers-library flag', () => {
  it('is on in Vercel previews', () => {
    expect(resolveFlag('answers-library', FEATURE_FLAGS, { vercelEnv: 'preview' })).toBe(true);
  });
});
