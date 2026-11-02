// node --test .github/claude-agent/scripts/
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyMigrations, createdObjects, splitStatements } from "./db-gate.mjs";

const SENSITIVE =
  /\b(stripe|billing|checkout|payments?|payouts?|pricing|subscriptions?|invoices?|auth|log ?in|sign[- ]?(in|up)|passwords?|sessions?|admin|secrets?|api keys?|tokens?)\b/i;
const EXISTING = [
  `create table public.tools (id uuid primary key, name text not null);
   create table if not exists reviews (id uuid primary key, tool_id uuid);
   create or replace function public.search_tools(q text) returns setof tools language sql as $$ select * from tools $$;`,
];
const check = (sql, existing = EXISTING) => classifyMigrations([{ path: "0057_x.sql", sql }], existing, SENSITIVE);
const safe = (sql) => assert.deepEqual(check(sql).reasons, [], sql);
const unsafe = (sql, why) => {
  const r = check(sql);
  assert.equal(r.safe, false, `expected unsafe: ${sql}`);
  if (why) assert.match(r.reasons.join("\n"), why);
};

describe("splitStatements", () => {
  it("splits on semicolons outside strings, bodies and comments", () => {
    const s = splitStatements(`
      -- a comment; with a semicolon
      create function f() returns int language plpgsql as $body$ begin delete from tools; return 1; end $body$;
      insert into t values ('a;b'); /* drop table tools; */
      comment on table t is 'x';`);
    assert.equal(s.length, 3);
    assert.match(s[0].masked, /^create function f\(\) returns int language plpgsql as \$\$\$\$$/);
    assert.equal(s[1].masked, "insert into t values ('')");
  });
  it("unquotes identifiers", () => {
    assert.equal(splitStatements('create policy "Anyone can read" on "Tools" for select using (true)')[0].masked,
      "create policy anyone_can_read on tools for select using (true)");
  });
});

describe("createdObjects", () => {
  it("finds tables, functions and views, with or without guards", () => {
    const o = createdObjects(EXISTING);
    assert.deepEqual([...o.table].sort(), ["public.reviews", "public.tools"]);
    assert.deepEqual([...o.function], ["public.search_tools"]);
  });
});

describe("classifyMigrations: safe", () => {
  it("a new table with RLS, policies, grants, an index, a trigger and seed rows", () => {
    safe(`
      create table public.collections (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        name text not null,
        created_at timestamptz not null default now()
      );
      alter table public.collections enable row level security;
      create policy "owners read" on public.collections for select to authenticated using (auth.uid() = user_id);
      create policy "owners write" on public.collections for insert to authenticated with check (auth.uid() = user_id);
      grant select, insert on table public.collections to authenticated;
      create index collections_user_idx on public.collections (user_id);
      create unique index collections_name_idx on public.collections (user_id, name);
      create trigger collections_touch before update on public.collections for each row execute function public.touch_updated_at();
      insert into public.collections (user_id, name) values ('00000000-0000-0000-0000-000000000000', 'demo');
      comment on table public.collections is 'Saved tool lists';
      notify pgrst, 'reload schema';`);
  });
  it("additive columns and plain indexes on existing tables", () => {
    safe(`alter table tools add column if not exists tagline text;
          alter table public.tools add column popularity integer not null default 0, add column launched_on date;
          create index if not exists tools_name_idx on tools (name);`);
  });
  it("new functions and invoker views, with grants on them", () => {
    safe(`create function public.top_tools(n int) returns setof tools language sql stable as $$ select * from tools limit n $$;
          grant execute on function public.top_tools(int) to anon, authenticated;
          create view public.tool_names with (security_invoker = true) as select id, name from tools;
          grant select on public.tool_names to anon;`);
  });
  it("new types and sequences, and identity sequences of new tables", () => {
    safe(`create type public.badge_kind as enum ('new', 'hot');
          create table public.badges (id bigserial primary key, kind badge_kind);
          grant usage on sequence public.badges_id_seq to authenticated;`);
  });
});

describe("classifyMigrations: waits for the owner", () => {
  it("destructive and rewriting statements", () => {
    unsafe("drop table tools", /DROP/);
    unsafe("alter table tools drop column name", /changes existing table/);
    unsafe("alter table tools rename column name to title", /changes existing table/);
    unsafe("alter table tools alter column name type varchar(80)", /changes existing table/);
    unsafe("update tools set name = lower(name)", /UPDATE/);
    unsafe("delete from tools", /DELETE/);
    unsafe("truncate reviews", /TRUNCATE/);
    unsafe("insert into tools (id, name) values (gen_random_uuid(), 'x')", /existing table/);
  });
  it("column additions that touch existing rows", () => {
    unsafe("alter table tools add column slug text not null", /NOT NULL/);
    unsafe("alter table tools add column ref uuid default gen_random_uuid()", /rewrites/);
    unsafe("alter table tools add column slug text unique", /unique/);
    unsafe("alter table tools add constraint tools_name_uniq unique (name)", /changes existing table/);
    unsafe("create unique index tools_name_uniq on tools (name)", /unique index/);
  });
  it("access changes on existing tables", () => {
    unsafe("alter table tools enable row level security", /changes existing table/);
    unsafe(`create policy "anyone" on public.tools for select to anon using (true)`, /existing table/);
    unsafe("drop policy if exists x on tools", /existing table/);
    unsafe("grant select on tools to anon", /existing objects/);
    unsafe("grant select on all tables in schema public to anon", /more than new objects/);
    unsafe("revoke all on reviews from authenticated", /existing objects/);
    unsafe("create trigger t after insert on tools for each row execute function f()", /existing table/);
  });
  it("can't prove an object is new", () => {
    unsafe("create table if not exists collections (id uuid primary key)", /IF NOT EXISTS/);
    unsafe("create table tools (id uuid primary key)", /already exists/);
    unsafe("create or replace function public.search_tools(q text) returns int language sql as $$ select 1 $$", /OR REPLACE/);
    unsafe("create or replace view v with (security_invoker = true) as select 1", /OR REPLACE/);
  });
  it("RLS bypasses, platform schemas and database-level changes", () => {
    unsafe("create function public.leak() returns setof tools language sql security definer as $$ select * from tools $$", /SECURITY DEFINER/);
    unsafe("create view public.v as select * from tools", /security_invoker/);
    unsafe("create table auth.extra (id uuid primary key)", /auth schema/);
    unsafe("alter table auth.users add column nickname text", /auth schema/);
    unsafe("create index on storage.objects (name)", /storage schema/);
    unsafe("create extension if not exists pg_cron", /EXTENSION/);
    unsafe("create schema private", /SCHEMA/);
    unsafe("alter type badge add value 'gold'", /ALTER TYPE/);
    unsafe("do $$ begin perform 1; end $$", /DO/);
    unsafe("select cron.schedule('x', '* * * * *', 'delete from tools')", /SELECT/);
    unsafe("begin", /transaction control/);
    unsafe("create index concurrently tools_x on tools (name)", /CONCURRENTLY/);
    unsafe("create materialized view mv as select * from tools", /materialized/);
  });
  it("names about money, sign-in or secrets", () => {
    unsafe("create table public.stripe_events (id text primary key)", /money, sign-in or secrets/);
    unsafe("create table public.user_sessions (id uuid primary key)", /money, sign-in or secrets/);
    unsafe("alter table tools add column api_key text", /money, sign-in or secrets/);
    unsafe("create function public.admin_stats() returns int language sql as $$ select 1 $$", /money, sign-in or secrets/);
  });
  it("is empty", () => unsafe("-- nothing\n", /empty/));
});

describe("classifyMigrations: several files", () => {
  it("a later file may build on a table an earlier new file created", () => {
    const r = classifyMigrations(
      [
        { path: "0057_a.sql", sql: "create table public.lists (id uuid primary key);" },
        { path: "0058_b.sql", sql: "alter table public.lists enable row level security; create policy p on public.lists for select using (true);" },
      ],
      EXISTING,
      SENSITIVE,
    );
    assert.equal(r.safe, true, r.reasons.join("\n"));
    assert.deepEqual(r.creates.table, ["public.lists"]);
  });
  it("names each problem with its file", () => {
    const r = classifyMigrations([{ path: "0057_a.sql", sql: "drop table tools;" }], EXISTING, SENSITIVE);
    assert.match(r.reasons[0], /^0057_a\.sql: DROP TABLE/);
  });
});
