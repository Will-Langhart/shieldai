import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

export type ChatMode = 'gentle' | 'scholarly' | 'debate';

export interface ChatAccess {
  allowed: boolean;
  plan: string;
  reason?: 'mode_locked' | 'daily_limit';
  requiredPlan?: string;
  limit?: number;
  message?: string;
}

const FREE_PLAN = 'basic';
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
 * Set CHAT_TIER_GATING=off to disable without a code change.
 */
export async function checkChatAccess(
  db: SupabaseClient | undefined,
  userId: string,
  mode: ChatMode,
  isNewConversation: boolean
): Promise<ChatAccess> {
  if (process.env.CHAT_TIER_GATING === 'off' || !db) {
    return { allowed: true, plan: 'ungated' };
  }

  try {
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
      // Only count conversations that have messages. The chat route creates the
      // conversation before calling the model, so a failed answer leaves an empty
      // one behind and shouldn't use up the user's daily allowance.
      const { count, error: countError } = await db
        .from('conversations')
        .select('id, messages!inner(id)', { count: 'exact', head: true })
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
