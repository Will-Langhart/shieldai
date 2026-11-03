import { describe, expect, it } from 'vitest';
import { buildInsightsHistoryQuery, type InsightsHistoryFilters } from '../insights-history-query';

function filters(overrides: Partial<InsightsHistoryFilters> = {}): InsightsHistoryFilters {
  return {
    search_query: '',
    bible_version: '',
    tags: [],
    key_themes: [],
    is_favorite: null,
    is_shared: null,
    date_from: '',
    date_to: '',
    passage_reference: '',
    ...overrides,
  };
}

const FIXED = 'limit=100&offset=0&sort_by=created_at&sort_order=desc';

describe('buildInsightsHistoryQuery', () => {
  it('gives only the four fixed params for default filters', () => {
    const params = buildInsightsHistoryQuery(filters());
    expect(params.toString()).toBe(FIXED);
    expect([...params.keys()]).toEqual(['limit', 'offset', 'sort_by', 'sort_order']);
  });

  it.each([
    'search_query',
    'bible_version',
    'passage_reference',
    'date_from',
    'date_to',
  ] as const)('includes %s only when non-empty', (key) => {
    expect(buildInsightsHistoryQuery(filters({ [key]: '' })).has(key)).toBe(false);
    const params = buildInsightsHistoryQuery(filters({ [key]: 'value' }));
    expect(params.getAll(key)).toEqual(['value']);
  });

  it('appends string filters in a fixed order after the fixed params', () => {
    const params = buildInsightsHistoryQuery(
      filters({
        search_query: 'grace',
        bible_version: 'ESV',
        passage_reference: 'John 3:16',
        date_from: '2026-01-01',
        date_to: '2026-02-01',
      }),
    );
    expect([...params.keys()]).toEqual([
      'limit',
      'offset',
      'sort_by',
      'sort_order',
      'search_query',
      'bible_version',
      'passage_reference',
      'date_from',
      'date_to',
    ]);
  });

  it('sends false booleans as "false" and omits null', () => {
    const params = buildInsightsHistoryQuery(filters({ is_favorite: false, is_shared: null }));
    expect(params.get('is_favorite')).toBe('false');
    expect(params.has('is_shared')).toBe(false);
  });

  it('sends true booleans as "true"', () => {
    const params = buildInsightsHistoryQuery(filters({ is_favorite: true, is_shared: true }));
    expect(params.get('is_favorite')).toBe('true');
    expect(params.get('is_shared')).toBe('true');
  });

  it('repeats tags and key_themes keys in order', () => {
    const params = buildInsightsHistoryQuery(
      filters({ tags: ['hope', 'faith', 'love'], key_themes: ['grace', 'mercy'] }),
    );
    expect(params.getAll('tags')).toEqual(['hope', 'faith', 'love']);
    expect(params.getAll('key_themes')).toEqual(['grace', 'mercy']);
    expect(params.toString()).toBe(
      `${FIXED}&tags=hope&tags=faith&tags=love&key_themes=grace&key_themes=mercy`,
    );
  });

  it('encodes spaces and ampersands in toString()', () => {
    const params = buildInsightsHistoryQuery(
      filters({ search_query: 'faith & works', tags: ['a&b c'] }),
    );
    expect(params.toString()).toBe(`${FIXED}&search_query=faith+%26+works&tags=a%26b+c`);
    expect(params.get('search_query')).toBe('faith & works');
  });
});
