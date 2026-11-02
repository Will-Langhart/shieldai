import { describe, expect, it } from 'vitest';
import { parseFlagOverrides, resolveFlag, type FeatureFlag } from '../feature-flags';

const registry: Record<string, FeatureFlag> = {
  'search-v2': { description: 'Better search', on: false },
  'tool-faq': { description: 'FAQ', on: true },
};

describe('parseFlagOverrides', () => {
  it('reads a comma list with - for off', () => {
    expect(parseFlagOverrides('a, -b,,c')).toEqual({ a: true, b: false, c: true });
    expect(parseFlagOverrides(undefined)).toEqual({});
  });
});

describe('resolveFlag', () => {
  it('uses the registry in production', () => {
    expect(resolveFlag('search-v2', registry, { vercelEnv: 'production' })).toBe(false);
    expect(resolveFlag('tool-faq', registry, { vercelEnv: 'production' })).toBe(true);
  });
  it('turns every registered flag on in Vercel previews', () => {
    expect(resolveFlag('search-v2', registry, { vercelEnv: 'preview' })).toBe(true);
  });
  it('lets overrides win over both', () => {
    expect(resolveFlag('tool-faq', registry, { overrides: '-tool-faq', vercelEnv: 'preview' })).toBe(false);
    expect(resolveFlag('search-v2', registry, { overrides: 'search-v2' })).toBe(true);
  });
  it('keeps unknown flags off', () => {
    expect(resolveFlag('nope', registry, { vercelEnv: 'preview' })).toBe(false);
  });
});
