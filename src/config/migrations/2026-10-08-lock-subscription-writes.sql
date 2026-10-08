-- Users could INSERT/UPDATE their own `subscriptions` rows through the public
-- anon key (RLS policies below), i.e. grant themselves any paid plan from the
-- browser. Subscription state must only be written server-side (Stripe /
-- RevenueCat webhooks using the service role, which bypasses RLS).
-- Users keep read access to their own subscription.

drop policy if exists "Users can insert own subscriptions" on public.subscriptions;
drop policy if exists "Users can update own subscriptions" on public.subscriptions;
