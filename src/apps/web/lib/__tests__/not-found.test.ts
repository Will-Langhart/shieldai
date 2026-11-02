import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, resolveFlag } from '../feature-flags';
import {
  NOT_FOUND_HEADING,
  NOT_FOUND_LINKS,
  NOT_FOUND_MESSAGE,
  PLAIN_NOT_FOUND_TEXT,
  notFoundView,
  plainNotFoundParts,
} from '../not-found';

describe('notFoundView', () => {
  it('is branded when the flag is on', () => {
    expect(notFoundView(true)).toBe('branded');
  });

  it('is plain when the flag is off', () => {
    expect(notFoundView(false)).toBe('plain');
  });
});

describe('plainNotFoundParts', () => {
  it('splits the default text into code and message', () => {
    expect(plainNotFoundParts()).toEqual({
      code: '404',
      message: 'This page could not be found.',
    });
  });

  it('copes with text that has no separator', () => {
    expect(plainNotFoundParts('404')).toEqual({ code: '404', message: '' });
  });
});

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
  it('is on in production and in Vercel previews', () => {
    expect(resolveFlag('not-found-page', FEATURE_FLAGS, {})).toBe(true);
    expect(resolveFlag('not-found-page', FEATURE_FLAGS, { vercelEnv: 'preview' })).toBe(true);
  });
});
