import { describe, expect, it } from 'vitest';
import { ANSWER_CATEGORIES, ANSWERS, getAnswerBySlug } from '..';
import type { Answer } from '..';
import {
  askHref,
  buildAnswerDescription,
  buildAnswerJsonLd,
  getCategoryLabel,
  getRelatedAnswers,
} from '../page-helpers';

describe('askHref', () => {
  it('starts with /chat?q= and round-trips special characters', () => {
    const questions = [
      'Does God exist?',
      'What about "good" people & other faiths?',
      "Isn't faith blind? 50% = belief & #doubt / reason",
    ];
    for (const q of questions) {
      const href = askHref(q);
      expect(href.startsWith('/chat?q=')).toBe(true);
      const encoded = href.slice('/chat?q='.length);
      expect(encoded).not.toMatch(/[?&#"\s]/);
      expect(decodeURIComponent(encoded)).toBe(q);
      expect(new URLSearchParams(href.split('?')[1]).get('q')).toBe(q);
    }
  });
});

describe('buildAnswerJsonLd', () => {
  it.each(ANSWERS.map((a) => [a.slug, a] as const))('%s is a FAQPage with one Question', (_slug, a) => {
    const ld = buildAnswerJsonLd(a) as {
      '@context': string;
      '@type': string;
      mainEntity: { '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }[];
    };
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(1);
    expect(ld.mainEntity[0]['@type']).toBe('Question');
    expect(ld.mainEntity[0].name).toBe(a.question);
    expect(ld.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe(a.shortAnswer);
  });
});

describe('getRelatedAnswers', () => {
  it('keeps order and skips missing slugs', () => {
    const base = getAnswerBySlug('does-god-exist')!;
    const answer: Answer = { ...base, related: ['who-is-jesus', 'not-a-real-slug', 'moral-argument'] };
    expect(getRelatedAnswers(answer).map((a) => a.slug)).toEqual(['who-is-jesus', 'moral-argument']);
    expect(getRelatedAnswers({ ...base, related: [] })).toEqual([]);
  });

  it("resolves every entry's related answers", () => {
    for (const a of ANSWERS) {
      expect(getRelatedAnswers(a).map((r) => r.slug)).toEqual(a.related);
    }
  });
});

describe('getCategoryLabel', () => {
  it('returns the label for each category', () => {
    for (const c of ANSWER_CATEGORIES) expect(getCategoryLabel(c.id)).toBe(c.label);
  });
});

describe('buildAnswerDescription', () => {
  it('keeps short text and cuts long text to at most the max on a word boundary', () => {
    const base = ANSWERS[0];
    expect(buildAnswerDescription({ ...base, shortAnswer: 'Short answer.' })).toBe('Short answer.');
    for (const a of ANSWERS) {
      const d = buildAnswerDescription(a);
      expect(d.length).toBeLessThanOrEqual(155);
      expect(d.length).toBeGreaterThan(80);
      expect(a.shortAnswer.startsWith(d.replace(/…$/, ''))).toBe(true);
    }
  });
});
