/**
 * URL for the saved AI insights of one passage in one Bible version.
 * Both values are URL-encoded so references like "John 3:16" and any
 * version string are passed through safely.
 */
export function buildSavedInsightsUrl(reference: string, version: string): string {
  return `/api/ai-insights/by-passage?passage_reference=${encodeURIComponent(reference)}&bible_version=${encodeURIComponent(version)}`;
}
