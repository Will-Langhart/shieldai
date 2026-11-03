// URLs InsightDetailView reads a saved insight's responses and interactions from.
// The id is encoded so it can't add or change query params.

export function insightResponsesUrl(insightId: string): string {
  return `/api/ai-insights/responses?insight_id=${encodeURIComponent(insightId)}`;
}

export function insightInteractionsUrl(insightId: string): string {
  return `/api/ai-insights/interactions?insight_id=${encodeURIComponent(insightId)}`;
}
