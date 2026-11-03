import { describe, expect, it } from 'vitest';
import {
  filterAndSortInsights,
  type FilterableInsight,
  type InsightSearchFilters,
  type InsightSortBy,
} from '../insights-filter';

type TestInsight = FilterableInsight & { id: string };

function insight(id: string, overrides: Partial<TestInsight> = {}): TestInsight {
  return {
    id,
    passage_reference: `Ref ${id}`,
    passage_text: `Text ${id}`,
    bible_version: 'ESV',
    explanation: `Explanation ${id}`,
    key_themes: [],
    tags: [],
    created_at: '2026-01-01T00:00:00Z',
    is_favorite: false,
    is_shared: false,
    ...overrides,
  };
}

const baseFilters: InsightSearchFilters = {
  query: '',
  bible_version: '',
  tags: [],
  themes: [],
  date_from: '',
  date_to: '',
  is_favorite: null,
  is_shared: null,
  sort_by: 'created_at',
  sort_order: 'desc',
};

const ids = (list: TestInsight[]) => list.map((i) => i.id);

describe('filterAndSortInsights', () => {
  it('returns every item newest first with empty filters', () => {
    const items = [
      insight('old', { created_at: '2025-01-01T00:00:00Z' }),
      insight('new', { created_at: '2026-06-01T00:00:00Z' }),
      insight('mid', { created_at: '2025-08-01T00:00:00Z' }),
    ];
    expect(ids(filterAndSortInsights(items, baseFilters))).toEqual(['new', 'mid', 'old']);
  });

  const queryCases: [string, Partial<TestInsight>, string][] = [
    ['passage_reference', { passage_reference: 'John 3:16' }, 'JOHN 3'],
    ['explanation', { explanation: 'About GRACE and mercy' }, 'grace'],
    ['passage_text', { passage_text: 'For God so loved the world' }, 'SO LOVED'],
    ['key_themes', { key_themes: ['Salvation'] }, 'salv'],
    ['tags', { tags: ['Favourite-Verse'] }, 'favourite'],
  ];

  it.each(queryCases)('matches the query against %s case-insensitively', (_field, overrides, query) => {
    const items = [insight('hit', overrides), insight('miss')];
    const result = filterAndSortInsights(items, { ...baseFilters, query });
    expect(ids(result)).toEqual(['hit']);
  });

  it('filters by bible version', () => {
    const items = [insight('esv'), insight('kjv', { bible_version: 'KJV' })];
    expect(ids(filterAndSortInsights(items, { ...baseFilters, bible_version: 'KJV' }))).toEqual(['kjv']);
  });

  it('requires every selected tag', () => {
    const items = [
      insight('both', { tags: ['a', 'b', 'c'] }),
      insight('one', { tags: ['a'] }),
      insight('none'),
    ];
    expect(ids(filterAndSortInsights(items, { ...baseFilters, tags: ['a', 'b'] }))).toEqual(['both']);
  });

  it('requires every selected theme', () => {
    const items = [
      insight('both', { key_themes: ['faith', 'hope'] }),
      insight('one', { key_themes: ['hope'] }),
    ];
    expect(ids(filterAndSortInsights(items, { ...baseFilters, themes: ['faith', 'hope'] }))).toEqual([
      'both',
    ]);
  });

  it('treats the date range as inclusive', () => {
    const items = [
      insight('before', { created_at: '2026-01-01T00:00:00Z' }),
      insight('start', { created_at: '2026-02-01T00:00:00Z' }),
      insight('inside', { created_at: '2026-02-15T00:00:00Z' }),
      insight('end', { created_at: '2026-03-01T00:00:00Z' }),
      insight('after', { created_at: '2026-04-01T00:00:00Z' }),
    ];
    const result = filterAndSortInsights(items, {
      ...baseFilters,
      date_from: '2026-02-01T00:00:00Z',
      date_to: '2026-03-01T00:00:00Z',
    });
    expect(ids(result)).toEqual(['end', 'inside', 'start']);
  });

  it.each([
    [true, ['fav']],
    [false, ['plain']],
    [null, ['fav', 'plain']],
  ] as const)('filters favourites when is_favorite is %s', (value, expected) => {
    const items = [
      insight('fav', { is_favorite: true, created_at: '2026-02-01T00:00:00Z' }),
      insight('plain', { created_at: '2026-01-01T00:00:00Z' }),
    ];
    expect(ids(filterAndSortInsights(items, { ...baseFilters, is_favorite: value }))).toEqual(expected);
  });

  it.each([
    [true, ['shared']],
    [false, ['private']],
    [null, ['shared', 'private']],
  ] as const)('filters shared when is_shared is %s', (value, expected) => {
    const items = [
      insight('shared', { is_shared: true, created_at: '2026-02-01T00:00:00Z' }),
      insight('private', { created_at: '2026-01-01T00:00:00Z' }),
    ];
    expect(ids(filterAndSortInsights(items, { ...baseFilters, is_shared: value }))).toEqual(expected);
  });

  const numericSorts: [InsightSortBy, keyof FilterableInsight][] = [
    ['rating', 'average_rating'],
    ['engagement', 'engagement_score'],
    ['relevance', 'response_count'],
  ];

  it.each(numericSorts)('sorts by %s asc and desc, treating missing as 0', (sortBy, field) => {
    const items = [
      insight('high', { [field]: 5 }),
      insight('missing'),
      insight('low', { [field]: 2 }),
    ];
    expect(
      ids(filterAndSortInsights(items, { ...baseFilters, sort_by: sortBy, sort_order: 'asc' })),
    ).toEqual(['missing', 'low', 'high']);
    expect(
      ids(filterAndSortInsights(items, { ...baseFilters, sort_by: sortBy, sort_order: 'desc' })),
    ).toEqual(['high', 'low', 'missing']);
  });

  it('places a missing number level with an explicit 0', () => {
    const items = [insight('zero', { average_rating: 0 }), insight('missing'), insight('one', { average_rating: 1 })];
    const result = filterAndSortInsights(items, { ...baseFilters, sort_by: 'rating', sort_order: 'asc' });
    expect(ids(result)).toEqual(['zero', 'missing', 'one']);
  });

  it('sorts by passage_reference asc and desc', () => {
    const items = [
      insight('b', { passage_reference: 'John 1:1' }),
      insight('a', { passage_reference: 'Genesis 1:1' }),
      insight('c', { passage_reference: 'Romans 8:28' }),
    ];
    expect(
      ids(filterAndSortInsights(items, { ...baseFilters, sort_by: 'passage_reference', sort_order: 'asc' })),
    ).toEqual(['a', 'b', 'c']);
    expect(
      ids(filterAndSortInsights(items, { ...baseFilters, sort_by: 'passage_reference', sort_order: 'desc' })),
    ).toEqual(['c', 'b', 'a']);
  });

  it('sorts by created_at asc and desc', () => {
    const items = [
      insight('mid', { created_at: '2026-02-01T00:00:00Z' }),
      insight('old', { created_at: '2026-01-01T00:00:00Z' }),
      insight('new', { created_at: '2026-03-01T00:00:00Z' }),
    ];
    expect(ids(filterAndSortInsights(items, { ...baseFilters, sort_order: 'asc' }))).toEqual([
      'old',
      'mid',
      'new',
    ]);
    expect(ids(filterAndSortInsights(items, { ...baseFilters, sort_order: 'desc' }))).toEqual([
      'new',
      'mid',
      'old',
    ]);
  });

  it('does not mutate the input array', () => {
    const items = [
      insight('old', { created_at: '2025-01-01T00:00:00Z' }),
      insight('new', { created_at: '2026-01-01T00:00:00Z', tags: ['x'] }),
    ];
    const snapshot = JSON.parse(JSON.stringify(items));
    const result = filterAndSortInsights(items, baseFilters);
    expect(result).not.toBe(items);
    expect(items).toEqual(snapshot);
    filterAndSortInsights(items, { ...baseFilters, tags: ['x'] });
    expect(items).toEqual(snapshot);
  });
});
