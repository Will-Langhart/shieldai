import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, resolveFlag } from '../feature-flags';
import {
  FALLBACK_PLANS,
  PLAN_NAMES,
  formatPlanPrice,
  planView,
  tiersToPlanCards,
  type ApiTier,
} from '../membership-plans';

function tier(name: ApiTier['name'], overrides: Partial<ApiTier> = {}, limits: Partial<ApiTier['limits']> = {}): ApiTier {
  return {
    name,
    display_name: `API ${name}`,
    description: `${name} description`,
    price_monthly: 1,
    price_yearly: 10,
    features: [],
    ...overrides,
    limits: {
      gentle_mode_enabled: true,
      scholarly_mode_enabled: false,
      debate_mode_enabled: false,
      max_team_members: 1,
      ...limits,
    },
  };
}

const fullList: ApiTier[] = [
  // Out of order on purpose: cards must come back basic, student, scholar, ministry.
  tier('ministry', { price_monthly: 59, price_yearly: 590, features: ['Team seats'] }, {
    daily_conversations: null as unknown as number,
    scholarly_mode_enabled: true,
    debate_mode_enabled: true,
    max_team_members: 25,
  }),
  tier('basic', { price_monthly: 0, price_yearly: 0 }, { daily_conversations: 3 }),
  tier('student', { price_monthly: 12, price_yearly: 120, features: ['Deep search', 'Notes'] }, {
    scholarly_mode_enabled: true,
  }),
  tier('scholar', { price_monthly: 24, price_yearly: 240 }, {
    daily_conversations: -1,
    scholarly_mode_enabled: true,
    debate_mode_enabled: true,
  }),
];

describe('FALLBACK_PLANS', () => {
  it('has the four plans in order with their prices', () => {
    expect(FALLBACK_PLANS.map((p) => p.id)).toEqual(['basic', 'student', 'scholar', 'ministry']);
    expect(FALLBACK_PLANS.map((p) => p.name)).toEqual(['Explorer', 'Bible Student', 'Bible Scholar', 'Ministry']);
    expect(FALLBACK_PLANS.map((p) => [p.priceMonthly, p.priceYearly])).toEqual([
      [0, 0],
      [9.99, 99.99],
      [19.99, 199.99],
      [49.99, 499.99],
    ]);
  });

  it('limits Explorer to 5 conversations and gentle mode', () => {
    const [explorer, student, scholar, ministry] = FALLBACK_PLANS;
    expect(explorer.dailyConversations).toBe(5);
    expect(explorer.modes).toEqual(['gentle']);
    expect(student.dailyConversations).toBeNull();
    expect(student.modes).toEqual(['gentle', 'scholarly']);
    expect(scholar.modes).toEqual(['gentle', 'scholarly', 'debate']);
    expect(ministry.modes).toEqual(['gentle', 'scholarly', 'debate']);
  });
});

describe('tiersToPlanCards', () => {
  it('maps a full API list onto cards in plan order', () => {
    const cards = tiersToPlanCards(fullList);
    expect(cards.map((c) => c.id)).toEqual(['basic', 'student', 'scholar', 'ministry']);
    // Canonical names, never the API display_name.
    expect(cards.map((c) => c.name)).toEqual(Object.values(PLAN_NAMES));
    expect(cards.map((c) => [c.priceMonthly, c.priceYearly])).toEqual([
      [0, 0],
      [12, 120],
      [24, 240],
      [59, 590],
    ]);
  });

  it('treats missing, null or negative daily limits as unlimited', () => {
    const [basic, student, scholar, ministry] = tiersToPlanCards(fullList);
    expect(basic.dailyConversations).toBe(3);
    expect(student.dailyConversations).toBeNull(); // missing
    expect(scholar.dailyConversations).toBeNull(); // negative
    expect(ministry.dailyConversations).toBeNull(); // null
  });

  it('takes modes from the *_mode_enabled booleans', () => {
    const cards = tiersToPlanCards(fullList);
    expect(cards.map((c) => c.modes)).toEqual([
      ['gentle'],
      ['gentle', 'scholarly'],
      ['gentle', 'scholarly', 'debate'],
      ['gentle', 'scholarly', 'debate'],
    ]);
  });

  it('uses features when present, otherwise the fallback highlights', () => {
    const [basic, student, scholar, ministry] = tiersToPlanCards(fullList);
    expect(student.highlights).toEqual(['Deep search', 'Notes']);
    expect(ministry.highlights).toEqual(['Team seats']);
    expect(basic.highlights).toEqual(FALLBACK_PLANS[0].highlights);
    expect(scholar.highlights).toEqual(FALLBACK_PLANS[2].highlights);
  });

  it('returns the fallback for a non-array, an empty list, or a missing plan', () => {
    expect(tiersToPlanCards(null)).toEqual(FALLBACK_PLANS);
    expect(tiersToPlanCards({ tiers: fullList })).toEqual(FALLBACK_PLANS);
    expect(tiersToPlanCards([])).toEqual(FALLBACK_PLANS);
    expect(tiersToPlanCards(fullList.filter((t) => t.name !== 'ministry'))).toEqual(FALLBACK_PLANS);
  });

  it('ignores unknown tier names', () => {
    const withExtra = [...fullList, { ...tier('basic'), name: 'enterprise' }];
    const cards = tiersToPlanCards(withExtra);
    expect(cards.map((c) => c.id)).toEqual(['basic', 'student', 'scholar', 'ministry']);
    expect(cards).toEqual(tiersToPlanCards(fullList));
  });
});

describe('formatPlanPrice', () => {
  const [explorer, student] = FALLBACK_PLANS;

  it('shows Free for a $0 plan', () => {
    expect(formatPlanPrice(explorer, 'monthly')).toEqual({ amount: 'Free', suffix: '' });
    expect(formatPlanPrice(explorer, 'yearly')).toEqual({ amount: 'Free', suffix: '' });
  });

  it('formats monthly prices', () => {
    expect(formatPlanPrice(student, 'monthly')).toEqual({ amount: '$9.99', suffix: '/month' });
  });

  it('formats yearly prices', () => {
    expect(formatPlanPrice(student, 'yearly')).toEqual({ amount: '$99.99', suffix: '/year' });
  });
});

describe('planView', () => {
  it('shows the page only when the flag is on', () => {
    expect(planView(true)).toBe('page');
    expect(planView(false)).toBe('not-found');
  });
});

describe('pricing-page flag', () => {
  it('is off by default and on in Vercel previews', () => {
    expect(resolveFlag('pricing-page', FEATURE_FLAGS, {})).toBe(false);
    expect(resolveFlag('pricing-page', FEATURE_FLAGS, { vercelEnv: 'preview' })).toBe(true);
  });
});
