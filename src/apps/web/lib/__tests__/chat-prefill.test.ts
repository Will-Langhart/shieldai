import { describe, expect, it } from 'vitest';
import { takePrefillQuery } from '../chat-prefill';

describe('takePrefillQuery', () => {
  it('returns null when q is missing', () => {
    expect(takePrefillQuery({ other: 'x' })).toBeNull();
  });

  it('returns null when q is blank', () => {
    expect(takePrefillQuery({ q: '' })).toBeNull();
    expect(takePrefillQuery({ q: '   ' })).toBeNull();
  });

  it('returns null when q is an array', () => {
    expect(takePrefillQuery({ q: ['a', 'b'] })).toBeNull();
  });

  it('returns the prefill and keeps other params in rest', () => {
    const query = { q: 'Did Jesus rise?', ref: 'landing', tags: ['a', 'b'] };
    expect(takePrefillQuery(query)).toEqual({
      prefill: 'Did Jesus rise?',
      rest: { ref: 'landing', tags: ['a', 'b'] },
    });
    expect(query.q).toBe('Did Jesus rise?');
  });

  it('truncates a q longer than 500 characters', () => {
    const long = 'x'.repeat(600);
    const result = takePrefillQuery({ q: long });
    expect(result?.prefill).toBe('x'.repeat(500));
    expect(result?.rest).toEqual({});
  });

  it('honours a custom maxLength', () => {
    expect(takePrefillQuery({ q: 'abcdef' }, 3)?.prefill).toBe('abc');
  });
});
