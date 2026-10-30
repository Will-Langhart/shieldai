import { describe, expect, it } from 'vitest';
import { FAQ_ITEMS } from '../../components/features/landing/faqData';
import { FEATURE_FLAGS } from '../feature-flags';
import { getHelpSections } from '../help-center';

const sections = getHelpSections();
const section = (id: string) => sections.find((s) => s.id === id)!;
const itemText = (item: { question: string; answer: string }) => `${item.question} ${item.answer}`;

describe('getHelpSections', () => {
  it('returns the sections in order with unique ids', () => {
    const ids = sections.map((s) => s.id);
    expect(ids).toEqual(['asking', 'modes', 'bible', 'notes', 'faq']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers gentle, scholarly and debate and never the old modes', () => {
    const modes = section('modes');
    const text = modes.items.map(itemText).join(' ').toLowerCase();
    for (const mode of ['gentle', 'scholarly', 'debate']) expect(text).toContain(mode);
    for (const item of modes.items) expect(itemText(item)).not.toMatch(/fast|accurate/i);
  });

  it('reuses the homepage FAQ as-is', () => {
    expect(section('faq').items).toEqual(FAQ_ITEMS);
  });

  it('gives every item a question and an answer', () => {
    for (const s of sections) {
      expect(s.items.length).toBeGreaterThan(0);
      for (const item of s.items) {
        expect(item.question.trim()).not.toBe('');
        expect(item.answer.trim()).not.toBe('');
      }
    }
  });

  it('has no pricing or subscription copy', () => {
    for (const s of sections) {
      for (const item of s.items) expect(itemText(item)).not.toMatch(/price|pricing|subscri|\$\d/i);
    }
  });
});

describe('help-center flag', () => {
  it('is registered and off', () => {
    expect(FEATURE_FLAGS['help-center']).toEqual({ description: 'Help Center page at /help', on: false });
  });
});
