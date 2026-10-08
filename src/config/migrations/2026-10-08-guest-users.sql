-- Guest chat: Supabase anonymous sign-ins create auth.users rows with no email.
-- handle_new_user() copies NEW.email into public.users.email, which was NOT NULL,
-- so every anonymous sign-in would fail with "Database error saving new user".
--
-- When a guest converts (updateUser({ email }) + confirmation), auth.users.email
-- is set by an UPDATE, so mirror it into public.users with a second trigger.
--
-- Also pins search_path on the SECURITY DEFINER trigger function.

alter table public.users alter column email drop not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set email = new.email,
         updated_at = now()
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();
