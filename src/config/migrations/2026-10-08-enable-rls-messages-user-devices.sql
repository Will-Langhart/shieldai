-- `messages` had RLS disabled (disable-rls-for-dev.sql reached production) and
-- `user_devices` never had it, so anyone holding the public anon key could
-- read or modify every chat message and push token. Turn RLS on with
-- own-rows-only policies.
--
-- All app access already goes through API routes that use the caller's JWT
-- (createServerSupabaseClient(token)), so auth.uid() is set on every request.
-- Scripts using the service role bypass RLS and are unaffected.

-- ── messages ───────────────────────────────────────────────────────────────
-- Replaces the existing (inactive) policies. Insert/update additionally require
-- that the conversation belongs to the caller, so a user can't write messages
-- into someone else's conversation by guessing its id.

drop policy if exists "Users can view messages in own conversations" on public.messages;
drop policy if exists "Users can insert messages in own conversations" on public.messages;
drop policy if exists "Users can update messages in own conversations" on public.messages;
drop policy if exists "Users can delete messages in own conversations" on public.messages;

create policy "Users can view own messages" on public.messages
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert messages in own conversations" on public.messages
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can update own messages" on public.messages
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own messages" on public.messages
  for delete to authenticated
  using (user_id = (select auth.uid()));

alter table public.messages enable row level security;

-- ── user_devices ───────────────────────────────────────────────────────────
-- Written by POST /api/notifications/register via upsert, which needs
-- select + insert + update.

drop policy if exists "Users can view own devices" on public.user_devices;
drop policy if exists "Users can insert own devices" on public.user_devices;
drop policy if exists "Users can update own devices" on public.user_devices;
drop policy if exists "Users can delete own devices" on public.user_devices;

create policy "Users can view own devices" on public.user_devices
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own devices" on public.user_devices
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own devices" on public.user_devices
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own devices" on public.user_devices
  for delete to authenticated
  using (user_id = (select auth.uid()));

alter table public.user_devices enable row level security;
