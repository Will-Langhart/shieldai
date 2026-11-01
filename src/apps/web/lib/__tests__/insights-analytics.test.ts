import { describe, expect, it } from 'vitest';
import { computeInsightsAnalytics, type Insight } from '../insights-analytics';

// Fixed "now": mid-day, mid-month, so local-time month buckets are stable.
const NOW = new Date(2026, 5, 15, 12, 0, 0);

function daysAgo(days: number): string {
  const d = new Date(NOW.getTime());
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

let seq = 0;
function makeInsight(overrides: Partial<Insight> = {}): Insight {
  seq += 1;
  return {
    id: `i${seq}`,
    passage_reference: `John 3:${seq}`,
    passage_text: 'text',
    bible_version: 'ESV',
    explanation: 'explanation',
    key_themes: [],
    cross_references: [],
    study_questions: [],
    prayer_points: [],
    ai_model: 'test',
    generation_timestamp: daysAgo(1),
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    is_favorite: false,
    is_shared: false,
    tags: [],
    user_id: 'u1',
    ...overrides,
  };
}

describe('computeInsightsAnalytics', () => {
  it('excludes an insight older than the range for 7d but includes it for all', () => {
    const old = makeInsight({ created_at: daysAgo(20) });
    const recent = makeInsight({ created_at: daysAgo(2) });

    expect(computeInsightsAnalytics([old, recent], '7d', NOW).total_insights).toBe(1);
    expect(computeInsightsAnalytics([old, recent], 'all', NOW).total_insights).toBe(2);
    expect(computeInsightsAnalytics([old, recent], '30d', NOW).total_insights).toBe(2);
  });

  it('totals favorites, shared, responses and interactions', () => {
    const data = computeInsightsAnalytics(
      [
        makeInsight({ is_favorite: true, is_shared: true, response_count: 3, interaction_count: 10 }),
        makeInsight({ is_favorite: true, response_count: 2 }),
        makeInsight({ is_shared: false, interaction_count: 10 }),
      ],
      'all',
      NOW
    );

    expect(data.total_insights).toBe(3);
    expect(data.total_favorites).toBe(2);
    expect(data.total_shared).toBe(1);
    expect(data.total_responses).toBe(5);
    expect(data.total_interactions).toBe(20);
    expect(data.engagement_metrics).toEqual({
      total_views: 50,
      total_likes: 12,
      total_shares: 1,
      total_downloads: 2,
    });
  });

  it('averages ratings, ignoring insights without one, and is 0 when none have one', () => {
    const rated = computeInsightsAnalytics(
      [makeInsight({ average_rating: 4 }), makeInsight({ average_rating: 5 }), makeInsight()],
      'all',
      NOW
    );
    expect(rated.average_rating).toBe(4.5);

    const unrated = computeInsightsAnalytics([makeInsight(), makeInsight()], 'all', NOW);
    expect(unrated.average_rating).toBe(0);
  });

  it('buckets months as YYYY-MM ascending and sorts versions by count descending', () => {
    const data = computeInsightsAnalytics(
      [
        makeInsight({ created_at: new Date(2026, 5, 10, 12).toISOString(), bible_version: 'KJV' }),
        makeInsight({ created_at: new Date(2026, 2, 10, 12).toISOString(), bible_version: 'NIV' }),
        makeInsight({ created_at: new Date(2026, 5, 3, 12).toISOString(), bible_version: 'NIV' }),
        makeInsight({ created_at: new Date(2025, 11, 10, 12).toISOString(), bible_version: 'NIV' }),
      ],
      'all',
      NOW
    );

    expect(data.insights_by_month).toEqual([
      { month: '2025-12', count: 1 },
      { month: '2026-03', count: 1 },
      { month: '2026-06', count: 2 },
    ]);
    for (const { month } of data.insights_by_month) {
      expect(month).toMatch(/^\d{4}-\d{2}$/);
    }
    expect(data.insights_by_version).toEqual([
      { version: 'NIV', count: 3 },
      { version: 'KJV', count: 1 },
    ]);
  });

  it('caps themes and tags at 10, sorted by count', () => {
    const names = Array.from({ length: 12 }, (_, i) => `t${i}`);
    const insights = [
      makeInsight({ key_themes: names, tags: names }),
      makeInsight({ key_themes: ['t11', 't5'], tags: ['t3'] }),
      makeInsight({ key_themes: ['t11'], tags: [] }),
    ];
    const data = computeInsightsAnalytics(insights, 'all', NOW);

    expect(data.top_themes).toHaveLength(10);
    expect(data.top_themes[0]).toEqual({ theme: 't11', count: 3 });
    expect(data.top_themes[1]).toEqual({ theme: 't5', count: 2 });
    expect(data.top_tags).toHaveLength(10);
    expect(data.top_tags[0]).toEqual({ tag: 't3', count: 2 });
    for (const list of [data.top_themes, data.top_tags]) {
      for (let i = 1; i < list.length; i++) {
        expect(list[i - 1].count).toBeGreaterThanOrEqual(list[i].count);
      }
    }
  });

  it('lists the last 10 insights as recent activity, newest first', () => {
    const insights = Array.from({ length: 12 }, (_, i) =>
      makeInsight({ created_at: daysAgo(12 - i), passage_reference: `Ps ${i}` })
    );
    const data = computeInsightsAnalytics(insights, 'all', NOW);

    expect(data.recent_activity).toHaveLength(10);
    expect(data.recent_activity[0]).toEqual({
      type: 'insight_created',
      description: 'Created insight for Ps 11',
      timestamp: insights[11].created_at,
    });
    expect(data.recent_activity[9].description).toBe('Created insight for Ps 2');
  });

  it('returns zeros and empty arrays for empty input', () => {
    expect(computeInsightsAnalytics([], '30d', NOW)).toEqual({
      total_insights: 0,
      total_favorites: 0,
      total_shared: 0,
      total_responses: 0,
      total_interactions: 0,
      average_rating: 0,
      insights_by_month: [],
      insights_by_version: [],
      top_themes: [],
      top_tags: [],
      engagement_metrics: { total_views: 0, total_likes: 0, total_shares: 0, total_downloads: 0 },
      recent_activity: [],
    });
  });
});
