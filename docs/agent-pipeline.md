
Claude plans and builds this repo on a schedule, and low-risk work ships to
production with no human step. Money, sign-in, admin, secrets, config,
dependencies, CI and any database change that isn't purely additive still wait
for the owner's merge (the gate in `.github/claude-agent/config.mjs`).

## The loop

| When (New York, winter; an hour later in summer) | Workflow | What it does |
|---|---|---|
| 12:17am | `agent-planner.yml` | Reads `ROADMAP.md`, files every step of the next item (up to 8 issues; 3 items at most in flight), queues flag flips whose feature passed Preview e2e |
| right after the planner, hourly 1:17am to 7:17am, 2:17pm | `agent-builder.yml` | Claude Code works up to 6 queued issues, one PR each, after passing every check in `config.mjs` locally, including the preview specs against its own build with all flags on. An item's steps build one per run, in order, each after the one before merged; a step blocked because its earlier step hadn't landed is retried automatically |
| every PR | `ci.yml`, `preview-e2e.yml` | Required checks: Agent rules, Typecheck, Lint, Unit tests, Build, Preview e2e (browser specs on the Vercel preview, all flags on) |
| every agent PR | `agent-automerge.yml` | Turns on auto-merge when the issue is `agent:low-risk`, nothing gated is touched, no flag turns on outside a flip, and the diff is within limits; otherwise labels it `agent:needs-review` and says why |
| after merge, hourly | `db-migrate.yml` | Applies new migrations to production when every pending one is purely additive; anything else waits for you to run it with mode `apply`. Refreshes the production schema snapshot nightly and after each apply |
| hourly | `flag-watch.yml` | For flags turned on in the last 72 hours, runs their specs on production; two failures 5 minutes apart open and merge a PR turning the flag off, and file a fix issue |
| Sundays 5am | `roadmap-refill.yml` | When fewer than 3 items are left, opens a PR proposing 3 to 5 more (never merges it) |
| Dependabot PRs | `dependabot-automerge.yml` | Patch updates (x.y.Z) auto-merge once checks pass; minor and major wait |

Every feature ships behind a flag that starts off (`flagsFile` in `config.mjs`),
so unfinished work can merge without visitors seeing it. Vercel previews turn
every flag on. When the planner judges an item built and every PR for it passed
Preview e2e, it queues a flip; the flip auto-merges unless the item is gated or
its roadmap notes say `Launch: owner` (for content you want to read before it
goes public).

## Database changes

A feature may add to the database without you: a new migration file in
`src/config/migrations` named `NNNN_snake_case.sql` that only creates new
tables (with their RLS and policies), new nullable columns, indexes, types,
`security invoker` functions and views. `scripts/db-gate.mjs` reads the SQL
and decides; its tests list what passes and what doesn't. Everything else
waits for your merge: drops, renames, type changes, backfills, policy or grant
changes on existing tables, `security definer`, extensions, anything in the
`auth` or `storage` schemas, and anything naming payments, sign-in or secrets.

Every PR with a new migration runs it in CI ("Agent rules" job) on a local
Supabase loaded with production's schema, so a migration that doesn't apply
can't merge. After merge, `db-migrate.yml` applies it, each file in one
transaction together with its `supabase_migrations.schema_migrations` row.

Setup, once:

1. Settings → Environments → New environment `db-auto`. Deployment branches:
   `main` only. No required reviewers. Add secret `SUPABASE_DB_URL` (Supabase →
   Connect → Session pooler URI).
2. Actions → db-migrate → Run workflow, mode `snapshot`, so CI has a schema to
   test against.
3. Settings → Variables → `DB_AUTO_APPLY` = `true`.

Until step 3, agent PRs with a migration wait for you, and nothing is applied
by itself. To apply a gated migration after you merge it: Actions → db-migrate
→ Run workflow, mode `apply` (mode `plan` lists what's pending first).

## Labels

| Label | Set by | Meaning |
|---|---|---|
| `agent` | owner or planner | Queue this issue for the builder |
| `agent:low-risk` | owner or planner | Its PR may merge without the owner |
| `agent:planned` | planner | Filed from `ROADMAP.md` or a TODO/lint fix |
| `agent:flip` | planner | Turns a finished feature's flag on |
| `agent:waiting-preview` | planner | Flip waits until the feature passed Preview e2e |
| `agent:blocked` | builder | Agent stopped; its comment says why. Remove to retry |
| `agent:needs-review` | guard | PR waits for the owner's merge; its comment says why |
| `agent:rollback` | flag-watch | A live feature was turned back off |

Only issues where the owner or `github-actions[bot]` added `agent` are built,
and only `agent:low-risk` added by them counts.

## Writing issues yourself

One small outcome per issue, the acceptance check in plain words, the files or
route if you know them. Label it `agent` (and `agent:low-risk` if it may merge
without you).

## Off switches (Settings → Secrets and variables → Actions → Variables)

- `AGENT_AUTOMERGE` not `true`: nothing merges by itself (agent, rollback or Dependabot PRs)
- `AGENT_PLANNER=false`: no planning. `AGENT_FLAG_FLIPS=false`: no flag flips
- `DB_AUTO_APPLY` not `true`: no migration merges or applies by itself
- `FLAG_WATCH=false`: no rollback watch. `ROADMAP_REFILL=false`: no weekly refill
- Stop building: Actions → agent-builder → Disable workflow
- Turn a live feature off fast: set its flag to `on: false` and merge, or force
  it off in Vercel's production env (`NEXT_PUBLIC_FEATURE_FLAGS=-key` or
  `VITE_FEATURE_FLAGS=-key`) and redeploy
- Bad deploy: Vercel → Deployments → Instant Rollback, then revert the PR

## Run things now

Actions → agent-planner / agent-builder (optionally one issue number) /
flag-watch / roadmap-refill (tick force) → Run workflow.
