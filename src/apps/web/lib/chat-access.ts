import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

export type ChatMode = 'gentle' | 'scholarly' | 'debate';

export interface ChatAccess {
  allowed: boolean;
  plan: string;
  reason?: 'mode_locked' | 'daily_limit' | 'guest_limit';
  requiredPlan?: string;
  limit?: number;
  message?: string;
}

const FREE_PLAN = 'basic';
const GUEST_PLAN = 'guest';
const PAID_STATUSES = ['active', 'trialing', 'trial'];

/**
 * Tier gate for the production chat routes (chat-rag and its graph delegate).
 *
 * Unlike EnhancedStripeService.checkFeatureAccess, a user with no subscription
 * row is on the free plan rather than locked out, and every query runs as the
 * user (their bearer token) so RLS lets it see their own rows. Limits come from
 * the `subscription_limits` table.
 *
 * Fails open on infrastructure errors: a Supabase hiccup should not take chat
 * down for everyone, and the per-route rate limit still applies.
 *
 * Guests (Supabase anonymous users, `is_anonymous` on the auth user) get
 * gentle mode and GUEST_MESSAGE_LIMIT messages in total (default 5), then are
 * asked to create a free account. Signing up converts the same user, so their
 * conversation carries over.
 *
 * Set CHAT_TIER_GATING=off to disable without a code change.
 */
export async function checkChatAccess(
  db: SupabaseClient | undefined,
  userId: string,
  mode: ChatMode,
  isNewConversation: boolean,
  isGuest = false
): Promise<ChatAccess> {
  if (process.env.CHAT_TIER_GATING === 'off' || !db) {
    return { allowed: true, plan: 'ungated' };
  }

  try {
    if (isGuest) return await checkGuestAccess(db, userId, mode);

    const plan = await resolvePlan(db, userId);

    const { data: limits, error } = await db
      .from('subscription_limits')
      .select('daily_conversations, scholarly_mode_enabled, debate_mode_enabled')
      .eq('plan_name', plan)
      .maybeSingle();
    if (error) throw error;
    if (!limits) return { allowed: true, plan };

    if (mode === 'scholarly' && !limits.scholarly_mode_enabled) {
      return {
        allowed: false, plan, reason: 'mode_locked', requiredPlan: 'student',
        message: 'Scholarly mode is available on the Bible Student plan and above.',
      };
    }
    if (mode === 'debate' && !limits.debate_mode_enabled) {
      return {
        allowed: false, plan, reason: 'mode_locked', requiredPlan: 'scholar',
        message: 'Debate mode is available on the Bible Scholar plan and above.',
      };
    }

    if (isNewConversation && limits.daily_conversations != null) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const { count, error: countError } = await db
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString());
      if (countError) throw countError;

      if ((count ?? 0) >= limits.daily_conversations) {
        return {
          allowed: false, plan, reason: 'daily_limit', requiredPlan: 'student',
          limit: limits.daily_conversations,
          message: `You've started ${limits.daily_conversations} conversations today, the free plan's daily limit. You can keep going in an existing conversation, or upgrade for unlimited conversations.`,
        };
      }
    }

    return { allowed: true, plan };
  } catch (error) {
    logger.error('Chat access check failed; allowing request', { userId }, error);
    return { allowed: true, plan: 'unknown' };
  }
}

export function guestMessageLimit(): number {
  const n = Number(process.env.GUEST_MESSAGE_LIMIT);
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

async function checkGuestAccess(db: SupabaseClient, userId: string, mode: ChatMode): Promise<ChatAccess> {
  if (mode !== 'gentle') {
    return {
      allowed: false, plan: GUEST_PLAN, reason: 'guest_limit', requiredPlan: FREE_PLAN,
      message: 'Guest chat uses Gentle mode. Create a free account to explore more.',
    };
  }

  const limit = guestMessageLimit();
  const { count, error } = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user');
  if (error) throw error;

  if ((count ?? 0) >= limit) {
    return {
      allowed: false, plan: GUEST_PLAN, reason: 'guest_limit', requiredPlan: FREE_PLAN, limit,
      message: `You've used your ${limit} free guest questions. Create a free account to keep going. Your conversation will be saved.`,
    };
  }
  return { allowed: true, plan: GUEST_PLAN };
}

async function resolvePlan(db: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await db
    .from('subscriptions')
    .select('status, current_period_end, subscription_plans(name)')
    .eq('user_id', userId)
    .in('status', PAID_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  const name = (data as any)?.subscription_plans?.name as string | undefined;
  const expired = data?.current_period_end && new Date(data.current_period_end) < new Date();
  return name && !expired ? name : FREE_PLAN;
}

/** JSON body for a denied request; the client shows `message`. */
export function chatAccessDeniedBody(access: ChatAccess) {
  return {
    error: 'upgrade_required',
    reason: access.reason,
    message: access.message,
    current_tier: access.plan,
    required_tier: access.requiredPlan,
    limit: access.limit,
  };
}
