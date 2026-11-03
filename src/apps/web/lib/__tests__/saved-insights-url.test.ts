import { describe, expect, it } from 'vitest';
import { buildSavedInsightsUrl } from '../saved-insights-url';

describe('buildSavedInsightsUrl', () => {
  it('builds the by-passage path with reference and version', () => {
    expect(buildSavedInsightsUrl('Genesis 1', 'ESV')).toBe(
      '/api/ai-insights/by-passage?passage_reference=Genesis%201&bible_version=ESV'
    );
  });

  it('parses back into the original reference and version', () => {
    const url = new URL(buildSavedInsightsUrl('John 3:16 & more', 'KJV'), 'https://example.com');
    expect(url.pathname).toBe('/api/ai-insights/by-passage');
    expect(url.searchParams.get('passage_reference')).toBe('John 3:16 & more');
    expect(url.searchParams.get('bible_version')).toBe('KJV');
    expect([...url.searchParams.keys()]).toEqual(['passage_reference', 'bible_version']);
  });

  it('encodes spaces, colons and ampersands in the reference', () => {
    const url = buildSavedInsightsUrl('John 3:16&x=1', 'ESV');
    expect(url).toContain('passage_reference=John%203%3A16%26x%3D1&');
  });

  it('encodes the version', () => {
    const url = buildSavedInsightsUrl('Psalm 23', 'NIV 2011&x=1');
    expect(url).toMatch(/&bible_version=NIV%202011%26x%3D1$/);
  });
});
