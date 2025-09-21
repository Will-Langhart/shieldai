-- Study Plans schema for Shield AI
-- Run this file against your Supabase/Postgres to create tables for plans CRUD

create extension if not exists pgcrypto;

create table if not exists study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  duration_days integer,
  visibility text default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_study_plans_user_id on study_plans(user_id);

create table if not exists study_plan_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references study_plans(id) on delete cascade,
  day_index integer not null,
  reference text,
  title text,
  notes text,
  is_completed boolean not null default false,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_study_plan_steps_plan_id on study_plan_steps(plan_id);

-- Optional: simple trigger to update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_study_plans_updated_at on study_plans;
create trigger trg_study_plans_updated_at
before update on study_plans
for each row execute procedure set_updated_at();

-- trigger to update updated_at on steps
drop trigger if exists trg_study_plan_steps_updated_at on study_plan_steps;
create trigger trg_study_plan_steps_updated_at
before update on study_plan_steps
for each row execute procedure set_updated_at();


