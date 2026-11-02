import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from '../api-error-message';

describe('apiErrorMessage', () => {
  it('returns body.error when it is a non-empty string', () => {
    expect(apiErrorMessage({ error: 'Rate limit hit' }, 429, 'generate study questions')).toBe(
      'Rate limit hit'
    );
  });

  it('falls back for an empty object', () => {
    expect(apiErrorMessage({}, 500, 'generate cross-references')).toBe(
      'Failed to generate cross-references (500)'
    );
  });

  it('falls back for null', () => {
    expect(apiErrorMessage(null, 502, 'generate study questions')).toBe(
      'Failed to generate study questions (502)'
    );
  });

  it('falls back for a non-object body', () => {
    expect(apiErrorMessage('oops', 400, 'generate cross-references')).toBe(
      'Failed to generate cross-references (400)'
    );
    expect(apiErrorMessage(42, 400, 'generate cross-references')).toBe(
      'Failed to generate cross-references (400)'
    );
  });

  it('falls back for an empty string error', () => {
    expect(apiErrorMessage({ error: '' }, 401, 'generate study questions')).toBe(
      'Failed to generate study questions (401)'
    );
  });

  it('falls back for a non-string error', () => {
    expect(apiErrorMessage({ error: { code: 1 } }, 503, 'generate cross-references')).toBe(
      'Failed to generate cross-references (503)'
    );
    expect(apiErrorMessage({ error: true }, 503, 'generate cross-references')).toBe(
      'Failed to generate cross-references (503)'
    );
  });
});
