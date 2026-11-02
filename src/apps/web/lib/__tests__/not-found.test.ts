import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, resolveFlag } from '../feature-flags';
import {
  NOT_FOUND_HEADING,
  NOT_FOUND_LINKS,
  NOT_FOUND_MESSAGE,
  PLAIN_NOT_FOUND_TEXT,
} from '../not-found';

describe('not-found content', () => {
  it('links to Home, Bible and Chat in that order', () => {
    expect(NOT_FOUND_LINKS.map((l) => l.href)).toEqual(['/', '/bible', '/chat']);
    expect(NOT_FOUND_LINKS.map((l) => l.label)).toEqual(['Home', 'Bible', 'Chat']);
  });

  it('only has internal links with descriptions', () => {
    for (const link of NOT_FOUND_LINKS) {
      expect(link.description.trim()).not.toBe('');
      expect(link.href.startsWith('/')).toBe(true);
      expect(link.href.startsWith('//')).toBe(false);
    }
  });

  it('has a heading and message', () => {
    expect(typeof NOT_FOUND_HEADING).toBe('string');
    expect(NOT_FOUND_HEADING.trim()).not.toBe('');
    expect(typeof NOT_FOUND_MESSAGE).toBe('string');
    expect(NOT_FOUND_MESSAGE.trim()).not.toBe('');
  });

  it('keeps the default Next.js 404 text for the flag-off fallback', () => {
    expect(PLAIN_NOT_FOUND_TEXT).toBe('404 | This page could not be found.');
  });
});

describe('not-found-page flag', () => {
  it('is off by default and on in Vercel previews', () => {
    expect(resolveFlag('not-found-page', FEATURE_FLAGS, {})).toBe(false);
    expect(resolveFlag('not-found-page', FEATURE_FLAGS, { vercelEnv: 'preview' })).toBe(true);
  });
});
