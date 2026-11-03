import { describe, expect, it } from 'vitest';
import { BookOpen, Brain, Clock, Cross, RotateCcw, Star } from 'lucide-react';
import { getQuickNavItems, type QuickNavItem, type QuickNavItemsInput } from '../quick-navigation';

const baseItems: QuickNavItem[] = [
  { id: 'ai-insights', label: 'AI Insights', description: 'AI', reference: 'ai-insights', type: 'ai-feature', icon: Brain, shortcut: 'Ctrl+I', category: 'ai' },
  { id: 'john-3-16', label: 'John 3:16', description: 'For God...', reference: 'John 3:16', type: 'passage', icon: Cross, category: 'popular' },
  { id: 'random-passage', label: 'Random Passage', description: 'Random', reference: 'random-passage', type: 'shortcut', icon: RotateCcw, category: 'navigation' },
];

const longText = 'x'.repeat(150);
const visited = new Date(2026, 0, 15);

const input = (overrides: Partial<QuickNavItemsInput> = {}): QuickNavItemsInput => ({
  searchQuery: '',
  searchResults: [
    { reference: 'Romans 5:8', text: longText },
    { reference: 'Psalm 46:1', text: 'God is our refuge' },
  ],
  activeCategory: 'all',
  baseItems,
  recentPassages: [{ reference: 'Genesis 1', timestamp: visited }],
  favoritePassages: [
    { reference: 'John 1:1', book: 'John', chapter: 1, verse: 1 },
    { reference: 'Psalm 23', book: 'Psalm', chapter: 23 },
  ],
  ...overrides,
});

describe('getQuickNavItems', () => {
  it('returns mapped search results for a search query, ignoring the category', () => {
    const items = getQuickNavItems(input({ searchQuery: 'love', activeCategory: 'ai' }));
    expect(items).toEqual([
      {
        id: 'search-0',
        label: 'Romans 5:8',
        description: 'x'.repeat(100) + '...',
        reference: 'Romans 5:8',
        type: 'passage',
        icon: BookOpen,
        category: 'search',
      },
      {
        id: 'search-1',
        label: 'Psalm 46:1',
        description: 'God is our refuge...',
        reference: 'Psalm 46:1',
        type: 'passage',
        icon: BookOpen,
        category: 'search',
      },
    ]);
  });

  it('falls back to the category for a whitespace-only query', () => {
    const items = getQuickNavItems(input({ searchQuery: '   ', activeCategory: 'ai' }));
    expect(items.map((i) => i.id)).toEqual(['ai-insights']);
  });

  it.each([
    ['ai', ['ai-insights']],
    ['popular', ['john-3-16']],
    ['navigation', ['random-passage']],
  ])('filters base items by the %s category', (category, ids) => {
    const items = getQuickNavItems(input({ activeCategory: category }));
    expect(items.map((i) => i.id)).toEqual(ids);
    expect(items[0]).toBe(baseItems.find((b) => b.id === ids[0]));
  });

  it('maps recent passages', () => {
    expect(getQuickNavItems(input({ activeCategory: 'recent' }))).toEqual([
      {
        id: 'recent-0',
        label: 'Genesis 1',
        description: `Visited ${visited.toLocaleDateString()}`,
        reference: 'Genesis 1',
        type: 'passage',
        icon: Clock,
        category: 'recent',
      },
    ]);
  });

  it('maps favorite passages with and without a verse', () => {
    expect(getQuickNavItems(input({ activeCategory: 'favorites' }))).toEqual([
      {
        id: 'favorite-0',
        label: 'John 1:1',
        description: 'John 1:1',
        reference: 'John 1:1',
        type: 'passage',
        icon: Star,
        category: 'favorites',
      },
      {
        id: 'favorite-1',
        label: 'Psalm 23',
        description: 'Psalm 23',
        reference: 'Psalm 23',
        type: 'passage',
        icon: Star,
        category: 'favorites',
      },
    ]);
  });

  it.each(['all', 'unknown'])('returns every base item for the %s category', (category) => {
    expect(getQuickNavItems(input({ activeCategory: category }))).toBe(baseItems);
  });
});
