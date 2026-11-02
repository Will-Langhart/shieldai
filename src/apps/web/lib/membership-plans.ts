/**
 * Plan cards for the /pricing page (`pricing-page` flag). Pure data and
 * helpers: no React, no server imports. Don't import enhanced-stripe-service
 * here, it constructs Stripe at module load.
 */

export type PlanId = 'basic' | 'student' | 'scholar' | 'ministry';
export type ChatMode = 'gentle' | 'scholarly' | 'debate';
export type BillingPeriod = 'monthly' | 'yearly';

/** Shape of one tier in `GET /api/subscriptions/tiers` → `{ success, tiers }`. */
export type ApiTier = {
  name: PlanId;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    daily_conversations?: number | null;
    gentle_mode_enabled: boolean;
    scholarly_mode_enabled: boolean;
    debate_mode_enabled: boolean;
    max_team_members: number;
    [key: string]: unknown;
  };
};

export type PlanCard = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  /** null = unlimited */
  dailyConversations: number | null;
  modes: ChatMode[];
  highlights: string[];
};

export const PLAN_ORDER: readonly PlanId[] = ['basic', 'student', 'scholar', 'ministry'];

export const PLAN_NAMES: Readonly<Record<PlanId, string>> = {
  basic: 'Explorer',
  student: 'Bible Student',
  scholar: 'Bible Scholar',
  ministry: 'Ministry',
};

export const FALLBACK_PLANS: readonly PlanCard[] = [
  {
    id: 'basic',
    name: PLAN_NAMES.basic,
    tagline: 'Try Shield AI for everyday questions.',
    priceMonthly: 0,
    priceYearly: 0,
    dailyConversations: 5,
    modes: ['gentle'],
    highlights: ['5 conversations a day', 'Gentle mode', '5 notes a week'],
  },
  {
    id: 'student',
    name: PLAN_NAMES.student,
    tagline: 'For regular, deeper Bible study.',
    priceMonthly: 9.99,
    priceYearly: 99.99,
    dailyConversations: null,
    modes: ['gentle', 'scholarly'],
    highlights: ['Unlimited conversations', 'Gentle and scholarly modes', 'Advanced Bible search'],
  },
  {
    id: 'scholar',
    name: PLAN_NAMES.scholar,
    tagline: 'Every mode, including debate.',
    priceMonthly: 19.99,
    priceYearly: 199.99,
    dailyConversations: null,
    modes: ['gentle', 'scholarly', 'debate'],
    highlights: ['Everything in Bible Student', 'Debate mode', 'Mood verse', 'API access, 1,000 calls a month'],
  },
  {
    id: 'ministry',
    name: PLAN_NAMES.ministry,
    tagline: 'For churches and ministry teams.',
    priceMonthly: 49.99,
    priceYearly: 499.99,
    dailyConversations: null,
    modes: ['gentle', 'scholarly', 'debate'],
    highlights: [
      'Everything in Bible Scholar',
      'Up to 25 team members',
      'White-label',
      'API access, 5,000 calls a month',
    ],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPrice(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : fallback;
}

function toDailyConversations(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function tierToCard(tier: Record<string, unknown>, fallback: PlanCard): PlanCard {
  const limits = isRecord(tier.limits) ? tier.limits : {};
  const modes: ChatMode[] = [];
  if (limits.gentle_mode_enabled === true) modes.push('gentle');
  if (limits.scholarly_mode_enabled === true) modes.push('scholarly');
  if (limits.debate_mode_enabled === true) modes.push('debate');

  const features = Array.isArray(tier.features)
    ? tier.features.filter((f): f is string => typeof f === 'string' && f.trim() !== '')
    : [];

  return {
    id: fallback.id,
    name: PLAN_NAMES[fallback.id],
    tagline: typeof tier.description === 'string' && tier.description.trim() ? tier.description : fallback.tagline,
    priceMonthly: toPrice(tier.price_monthly, fallback.priceMonthly),
    priceYearly: toPrice(tier.price_yearly, fallback.priceYearly),
    dailyConversations: toDailyConversations(limits.daily_conversations),
    modes,
    highlights: features.length > 0 ? features : [...fallback.highlights],
  };
}

/**
 * Maps the tiers API list onto cards in plan order. Falls back to
 * FALLBACK_PLANS unless the input is an array holding all four plan ids.
 */
export function tiersToPlanCards(tiers: unknown): PlanCard[] {
  if (!Array.isArray(tiers) || tiers.length === 0) return [...FALLBACK_PLANS];

  const byId = new Map<PlanId, Record<string, unknown>>();
  for (const tier of tiers) {
    if (!isRecord(tier) || typeof tier.name !== 'string') continue;
    if ((PLAN_ORDER as readonly string[]).includes(tier.name) && !byId.has(tier.name as PlanId)) {
      byId.set(tier.name as PlanId, tier);
    }
  }
  if (PLAN_ORDER.some((id) => !byId.has(id))) return [...FALLBACK_PLANS];

  return FALLBACK_PLANS.map((fallback) => tierToCard(byId.get(fallback.id)!, fallback));
}

export function formatPlanPrice(card: PlanCard, period: BillingPeriod): { amount: string; suffix: string } {
  const price = period === 'yearly' ? card.priceYearly : card.priceMonthly;
  if (price === 0) return { amount: 'Free', suffix: '' };
  return { amount: `$${price.toFixed(2)}`, suffix: period === 'yearly' ? '/year' : '/month' };
}

export function planView(flagOn: boolean): 'page' | 'not-found' {
  return flagOn ? 'page' : 'not-found';
}
