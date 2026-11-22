import { describe, expect, it } from 'vitest';
import { normalizeInsightPayload, resolveBookSelection } from '../bible-reader';

const books = [
  { id: 'GEN', name: 'Genesis', nameLong: 'The Book of Genesis' },
  { id: 'EXO', name: 'Exodus', nameLong: 'The Book of Exodus' },
  { id: 'JHN', name: 'John', nameLong: 'The Gospel of John' },
];

describe('resolveBookSelection', () => {
  it('matches the current book by name', () => {
    expect(resolveBookSelection(books, 'John', 'XXX')).toEqual({ book: books[2], changed: false });
  });

  it('matches the current book by id', () => {
    expect(resolveBookSelection(books, 'Jean', 'EXO')).toEqual({ book: books[1], changed: false });
  });

  it('falls back to the first book when nothing matches', () => {
    expect(resolveBookSelection(books, 'Tobit', 'TOB')).toEqual({ book: books[0], changed: true });
  });

  it('returns null for an empty list', () => {
    expect(resolveBookSelection([], 'Genesis', 'GEN')).toBeNull();
  });
});

describe('normalizeInsightPayload', () => {
  it('unwraps a { insights } payload', () => {
    const insights = { explanation: 'In the beginning', keyThemes: ['creation'] };
    expect(normalizeInsightPayload({ insights })).toEqual(insights);
  });

  it('returns a bare payload as it is', () => {
    const data = { explanation: 'Grace and truth', studyQuestions: ['Why?'] };
    expect(normalizeInsightPayload(data)).toEqual(data);
  });

  it('merges a JSON-string explanation into the payload', () => {
    const data = {
      insights: {
        explanation: '  {"explanation":"Parsed","keyThemes":["love"]}',
        denomination: 'Catholic',
      },
    };
    expect(normalizeInsightPayload(data)).toEqual({
      explanation: 'Parsed',
      keyThemes: ['love'],
      denomination: 'Catholic',
    });
  });

  it('keeps an invalid JSON-string explanation as it is', () => {
    const data = { explanation: '{not json', keyThemes: [] };
    expect(normalizeInsightPayload(data)).toEqual(data);
  });

  it('handles a payload with no explanation', () => {
    const data = { insights: { keyThemes: ['hope'] } };
    expect(normalizeInsightPayload(data)).toEqual({ keyThemes: ['hope'] });
  });
});
