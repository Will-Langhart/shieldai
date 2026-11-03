import { describe, expect, it } from 'vitest';
import { insightInteractionsUrl, insightResponsesUrl } from '../insight-detail-urls';

const uuid = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

describe('insightResponsesUrl', () => {
  it('builds the responses URL for a plain UUID', () => {
    expect(insightResponsesUrl(uuid)).toBe(`/api/ai-insights/responses?insight_id=${uuid}`);
  });

  it('encodes &, = and spaces so the id cannot add query params', () => {
    const raw = 'abc&user_id=1 x';
    const result = insightResponsesUrl(raw);
    expect(result).toBe('/api/ai-insights/responses?insight_id=abc%26user_id%3D1%20x');
    const url = new URL(result, 'https://example.com');
    expect([...url.searchParams.keys()]).toEqual(['insight_id']);
    expect(url.searchParams.get('insight_id')).toBe(raw);
  });
});

describe('insightInteractionsUrl', () => {
  it('builds the interactions URL for a plain UUID', () => {
    expect(insightInteractionsUrl(uuid)).toBe(`/api/ai-insights/interactions?insight_id=${uuid}`);
  });

  it('encodes &, = and spaces so the id cannot add query params', () => {
    const raw = 'abc&user_id=1 x';
    const result = insightInteractionsUrl(raw);
    expect(result).toBe('/api/ai-insights/interactions?insight_id=abc%26user_id%3D1%20x');
    const url = new URL(result, 'https://example.com');
    expect([...url.searchParams.keys()]).toEqual(['insight_id']);
    expect(url.searchParams.get('insight_id')).toBe(raw);
  });
});
