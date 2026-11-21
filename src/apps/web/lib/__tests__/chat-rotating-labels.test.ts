import { describe, expect, it } from 'vitest';
import {
  APOLOGETICS_PLACEHOLDERS,
  THINKING_PHRASES,
  nextRotationIndex,
} from '../chat-rotating-labels';

describe('nextRotationIndex', () => {
  it('steps forward', () => {
    expect(nextRotationIndex(0, 4)).toBe(1);
  });

  it('wraps at the end', () => {
    expect(nextRotationIndex(3, 4)).toBe(0);
    expect(nextRotationIndex(19, 20)).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(nextRotationIndex(0, 0)).toBe(0);
    expect(nextRotationIndex(2, -1)).toBe(0);
  });

  it('returns 0 for a negative or non-finite index', () => {
    expect(nextRotationIndex(-1, 4)).toBe(0);
    expect(nextRotationIndex(Number.NaN, 4)).toBe(0);
    expect(nextRotationIndex(Number.POSITIVE_INFINITY, 4)).toBe(0);
    expect(nextRotationIndex(1.5, 4)).toBe(0);
  });
});

describe('rotating label lists', () => {
  it('has 4 thinking phrases, all non-empty strings', () => {
    expect(THINKING_PHRASES).toHaveLength(4);
    for (const p of THINKING_PHRASES) {
      expect(typeof p).toBe('string');
      expect(p.trim().length).toBeGreaterThan(0);
    }
  });

  it('has 20 apologetics placeholders, all non-empty strings', () => {
    expect(APOLOGETICS_PLACEHOLDERS).toHaveLength(20);
    for (const q of APOLOGETICS_PLACEHOLDERS) {
      expect(typeof q).toBe('string');
      expect(q.trim().length).toBeGreaterThan(0);
    }
  });

  it('starts the thinking phrases with "Searching Scripture…"', () => {
    expect(THINKING_PHRASES[0]).toBe('Searching Scripture…');
  });
});
