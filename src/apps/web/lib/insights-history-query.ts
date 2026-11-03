/** Filters the insights history page sends to `/api/ai-insights/history`. */
export interface InsightsHistoryFilters {
  search_query: string;
  bible_version: string;
  tags: string[];
  key_themes: string[];
  is_favorite: boolean | null;
  is_shared: boolean | null;
  date_from: string;
  date_to: string;
  passage_reference: string;
}

/**
 * Builds the query string for the insights history request: the four fixed
 * paging/sort params, then each filter only when it is set.
 */
export function buildInsightsHistoryQuery(filters: InsightsHistoryFilters): URLSearchParams {
  const queryParams = new URLSearchParams({
    limit: '100',
    offset: '0',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  if (filters.search_query) queryParams.append('search_query', filters.search_query);
  if (filters.bible_version) queryParams.append('bible_version', filters.bible_version);
  if (filters.passage_reference) queryParams.append('passage_reference', filters.passage_reference);
  if (filters.is_favorite !== null) queryParams.append('is_favorite', filters.is_favorite.toString());
  if (filters.is_shared !== null) queryParams.append('is_shared', filters.is_shared.toString());
  if (filters.date_from) queryParams.append('date_from', filters.date_from);
  if (filters.date_to) queryParams.append('date_to', filters.date_to);
  filters.tags.forEach((tag) => queryParams.append('tags', tag));
  filters.key_themes.forEach((theme) => queryParams.append('key_themes', theme));

  return queryParams;
}
