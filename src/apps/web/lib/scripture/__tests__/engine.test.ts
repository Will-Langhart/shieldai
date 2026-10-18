import { describe, expect, it, vi } from 'vitest';
import { canonicalize, verseNumbers, MAX_PASSAGE_VERSES } from '../reference';
import { ScriptureEngine } from '../engine';
import { splitVerseNumbers } from '../providers/esv';
import type { CanonicalRef, Passage, ScriptureProvider } from '../types';

describe('canonicalize', () => {
  it('normalizes full names, abbreviations and numbered books', () => {
    expect(canonicalize('John 3:16')).toMatchObject({ book: 'John', usfm: 'JHN', chapter: 3, verseStart: 16, display: 'John 3:16' });
    expect(canonicalize('Jn 3:16-18')?.display).toBe('John 3:16-18');
    expect(canonicalize('1 Cor 13:4-7')).toMatchObject({ book: '1 Corinthians', usfm: '1CO', display: '1 Corinthians 13:4-7' });
    expect(canonicalize('Psalm 23')).toMatchObject({ book: 'Psalms', usfm: 'PSA', chapter: 23, display: 'Psalms 23' });
  });

  it('accepts en dashes and spaced ranges', () => {
    expect(canonicalize('Romans 8:28–30')?.display).toBe('Romans 8:28-30');
    expect(canonicalize('Romans 8:28 - 30')?.display).toBe('Romans 8:28-30');
  });

  it('clips very long ranges', () => {
    const ref = canonicalize('Psalms 119:1-176')!;
    expect(verseNumbers(ref)).toHaveLength(MAX_PASSAGE_VERSES);
  });

  it('rejects non-books and book-only references', () => {
    expect(canonicalize('Hezekiah 3:4')).toBeNull();
    expect(canonicalize('Genesis')).toBeNull();
    expect(canonicalize('not a verse')).toBeNull();
  });
});

describe('splitVerseNumbers', () => {
  it('splits bracketed verse markers', () => {
    expect(splitVerseNumbers('[16] For God so loved the world, [17] For God did not send')).toEqual([
      { num: 16, text: 'For God so loved the world,' },
      { num: 17, text: 'For God did not send' },
    ]);
  });
});

function fakeProvider(id: string, code: string, opts: Partial<ScriptureProvider> = {}): ScriptureProvider & { calls: number } {
  const p = {
    id,
    calls: 0,
    enabled: () => true,
    translations: () => [{ code, name: code }],
    async getPassage(ref: CanonicalRef, translation: string): Promise<Passage | null> {
      p.calls += 1;
      return { reference: ref.display, translation, verses: [{ num: ref.verseStart ?? 1, text: `${code} text` }], source: id };
    },
    ...opts,
  };
  return p;
}

describe('ScriptureEngine', () => {
  it('routes each translation to its provider and fans out in parallel', async () => {
    const kjv = fakeProvider('kjv', 'KJV');
    const net = fakeProvider('net', 'NET');
    const engine = new ScriptureEngine([kjv, net]);
    const passages = await engine.compare('John 3:16', ['KJV', 'net', 'XYZ']);
    expect(passages.map(p => [p.translation, p.source])).toEqual([['KJV', 'kjv'], ['NET', 'net']]);
  });

  it('caches passages', async () => {
    const kjv = fakeProvider('kjv', 'KJV');
    const engine = new ScriptureEngine([kjv]);
    await engine.getPassage('John 3:16');
    await engine.getPassage('Jn 3:16');
    expect(kjv.calls).toBe(1);
  });

  it('skips disabled providers', () => {
    const esv = fakeProvider('esv', 'ESV', { enabled: () => false });
    const engine = new ScriptureEngine([fakeProvider('kjv', 'KJV'), esv]);
    expect(engine.translations().map(t => t.code)).toEqual(['KJV']);
  });

  it('turns a provider timeout or error into null', async () => {
    vi.useFakeTimers();
    const slow = fakeProvider('slow', 'KJV', { getPassage: () => new Promise(() => {}) });
    const engine = new ScriptureEngine([slow]);
    const pending = engine.getPassage('John 3:16');
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toBeNull();
    vi.useRealTimers();

    const broken = new ScriptureEngine([fakeProvider('x', 'KJV', { getPassage: async () => { throw new Error('down'); } })]);
    await expect(broken.getPassage('John 3:16')).resolves.toBeNull();
  });

  it('falls back to the next search provider when one is empty or failing', async () => {
    const api = fakeProvider('api-bible', 'WEB', { search: async () => { throw new Error('403'); } });
    const index = fakeProvider('kjv-pinecone', 'KJV', {
      search: async () => [{ reference: 'John 3:16', text: 'For God so loved', translation: 'KJV' }],
    });
    const engine = new ScriptureEngine([index, api]);
    // Keyword tries API.Bible first, then the index.
    await expect(engine.search('loved the world', 'keyword')).resolves.toHaveLength(1);
  });

  it('benches a provider after repeated failures, then retries after the cooldown', async () => {
    let now = 0;
    let calls = 0;
    const flaky = fakeProvider('api-bible', 'WEB', { getPassage: async () => { calls += 1; throw new Error('403'); } });
    const engine = new ScriptureEngine([fakeProvider('kjv', 'KJV'), flaky], () => now);
    for (const ref of ['John 1:1', 'John 1:2', 'John 1:3']) await engine.getPassage(ref, 'WEB');
    expect(engine.translations().map(t => t.code)).toEqual(['KJV']);
    await engine.getPassage('John 1:4', 'WEB');
    expect(calls).toBe(3);
    now += 5 * 60 * 1000;
    expect(engine.translations().map(t => t.code)).toEqual(['KJV', 'WEB']);
  });
});
