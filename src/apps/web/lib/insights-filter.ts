// Pure filter + sort for the AI insights history list
// (components/features/bible/EnhancedInsightsQuery.tsx).

export interface FilterableInsight {
  passage_reference: string;
  passage_text: string;
  bible_version: string;
  explanation: string;
  key_themes: string[];
  tags: string[];
  created_at: string;
  is_favorite: boolean;
  is_shared: boolean;
  response_count?: number;
  average_rating?: number;
  engagement_score?: number;
}

export type InsightSortBy = 'created_at' | 'passage_reference' | 'rating' | 'engagement' | 'relevance';

export interface InsightSearchFilters {
  query: string;
  bible_version: string;
  tags: string[];
  themes: string[];
  date_from: string;
  date_to: string;
  is_favorite: boolean | null;
  is_shared: boolean | null;
  sort_by: InsightSortBy;
  sort_order: 'asc' | 'desc';
}

function sortValue(insight: FilterableInsight, sortBy: InsightSortBy): string | number | Date {
  switch (sortBy) {
    case 'passage_reference':
      return insight.passage_reference;
    case 'rating':
      return insight.average_rating || 0;
    case 'engagement':
      return insight.engagement_score || 0;
    case 'relevance':
      return insight.response_count || 0;
    default:
      return new Date(insight.created_at);
  }
}

/** Returns a new filtered, sorted array; never mutates `insights`. */
export function filterAndSortInsights<T extends FilterableInsight>(
  insights: readonly T[],
  filters: InsightSearchFilters,
): T[] {
  let filtered = [...insights];

  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(
      (insight) =>
        insight.passage_reference.toLowerCase().includes(query) ||
        insight.explanation.toLowerCase().includes(query) ||
        insight.passage_text.toLowerCase().includes(query) ||
        insight.key_themes.some((theme) => theme.toLowerCase().includes(query)) ||
        insight.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }

  if (filters.bible_version) {
    filtered = filtered.filter((insight) => insight.bible_version === filters.bible_version);
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter((insight) => filters.tags.every((tag) => insight.tags.includes(tag)));
  }

  if (filters.themes.length > 0) {
    filtered = filtered.filter((insight) =>
      filters.themes.every((theme) => insight.key_themes.includes(theme)),
    );
  }

  if (filters.date_from) {
    const from = new Date(filters.date_from);
    filtered = filtered.filter((insight) => new Date(insight.created_at) >= from);
  }
  if (filters.date_to) {
    const to = new Date(filters.date_to);
    filtered = filtered.filter((insight) => new Date(insight.created_at) <= to);
  }

  if (filters.is_favorite !== null) {
    filtered = filtered.filter((insight) => insight.is_favorite === filters.is_favorite);
  }
  if (filters.is_shared !== null) {
    filtered = filtered.filter((insight) => insight.is_shared === filters.is_shared);
  }

  const asc = filters.sort_order === 'asc';
  filtered.sort((a, b) => {
    const aValue = sortValue(a, filters.sort_by);
    const bValue = sortValue(b, filters.sort_by);
    if (aValue < bValue) return asc ? -1 : 1;
    if (aValue > bValue) return asc ? 1 : -1;
    return 0;
  });

  return filtered;
}
