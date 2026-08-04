# Scripts

Dev, database, deployment, and eval scripts. Files are named `<area>_<name>` (e.g.
`development_…`, `tests_integration_…`, `deployment_…`).

---

## Citation eval harness — `development_eval-citations.mjs`

Measures how often the AI layer **fabricates Scripture** and how well the
anti-hallucination guards catch it, across the chat pipelines and the Bible AI
endpoints. This is the instrument for the roadmap's "retire the old pipeline"
decision: it produces the numbers that say whether the LangGraph pipeline
(`chat:graph`) actually beats the flat tool loop (`chat:agentic`).

### What it does

Fires a fixed dataset at a **running** server and tabulates per endpoint/arm:

- **6 hard theological questions** (problem of evil, resurrection evidence, Gospel
  "contradictions", Genesis vs cosmology, hell, canon) through each chat arm.
- **5 well-known passages** through `ai-insights` and `study-questions`.

It reads the citation telemetry each endpoint returns and aggregates it — it does
**not** re-verify references itself, so it needs no API keys of its own.

### Prerequisites

1. **A running server with real keys.** Next only auto-loads `.env.local` in
   `src/apps/web/`. If the server logs `OPENAI_API_KEY … is not set`, the env
   isn't active. Then start it:
   ```bash
   npm run dev:web        # from repo root, serves on :3001
   ```
2. **Auth.**
   - **Bible endpoints** accept the literal token `test-token` — no login needed.
   - **Chat arms** do real Supabase auth (no bypass). You need a **Supabase access
     token** for a user who is either in `DEVELOPER_EMAILS` *or* on a tier that
     allows `debate`/`scholarly` mode. Grab one from the web app after logging in
     (browser devtools → the Supabase session's `access_token`).

### Running

```bash
# Everything (chat + bible):
EVAL_TOKEN=<supabase-access-token> node src/scripts/development_eval-citations.mjs

# Bible only (no token needed — uses test-token):
EVAL_ARMS= node src/scripts/development_eval-citations.mjs

# Self-test the harness with no server/keys:
EVAL_MOCK=1 node src/scripts/development_eval-citations.mjs
```

### Environment

| Var | Default | Purpose |
|---|---|---|
| `EVAL_BASE_URL` | `http://localhost:3001` | Server to hit |
| `EVAL_TOKEN` | — | Supabase access token; **required for chat arms** |
| `EVAL_BIBLE_TOKEN` | `test-token` | Auth for the Bible endpoints |
| `EVAL_BIBLE_VERSION` | `de4e12af7f28f599-02` | Bible translation id |
| `EVAL_ARMS` | `agentic,graph` | Which chat arms to run (empty = bible only) |
| `EVAL_MOCK` | — | `1` = synthetic responses, no HTTP |

### Reading the output

```
endpoint / arm         runs  err  avg ms  corrected  residual halluc.  refs
chat:agentic           6     0    1825    33%        0%                18
chat:graph             6     0    2625    17%        0%                18
bible:ai-insights      5     0    2220    40%        0%                15
```

| Column | Meaning | Want |
|---|---|---|
| **runs / err** | successful (HTTP 200) vs failed requests | `err` = 0 |
| **avg ms** | mean latency of successful runs | as low as tolerable |
| **corrected** | share of runs where the guard had to **regenerate** — i.e. the model's *raw* output contained an unresolvable reference. A proxy for the underlying hallucination rate. | lower is a better model/prompt |
| **residual halluc.** | share of runs whose **final** answer still contained a bad reference (the guard didn't fix it) | **~0** — anything above is a guard gap to investigate |
| **refs** | total Scripture references checked | context for the rates |

### Interpreting the comparison (chat arms)

- **`corrected` lower on `chat:graph`** → the multi-agent pipeline hallucinates
  less at the source (better retrieval grounding). This is the core payoff.
- **`residual` higher than ~0 on either arm** → the correction loop isn't
  catching everything; raise `GRAPH_MAX_CORRECTIONS` or inspect the failing refs
  in the server log (`Agentic chat complete` / `Graph chat complete` lines carry
  `citations.hallucinated`).
- **`avg ms` gap** → the graph's reflection loop + parallel specialists cost
  latency. Weigh it against the correction-rate improvement.

### Decision rule for retiring the old pipeline

Retire `chat-rag.ts` + the eager `chat.ts` path, and raise `GRAPH_ROLLOUT_PCT`,
once — on a real run — `chat:graph` shows a **lower or equal `corrected` rate**
and **`residual` ≈ 0** at a latency you're willing to ship. Until then, keep both
arms behind their flags (`?graph=1`, `?agentic=1`, `AGENT_ROLLOUT_PCT`,
`GRAPH_ROLLOUT_PCT`).

### Notes

- The harness makes ~22 real LLM calls per full run (6 chat × 2 arms + 5 × 2
  bible), plus a correction regeneration whenever the guard fires. Small but
  non-zero OpenAI cost.
- Telemetry sources it reads: `agentic.citations` + `agentic.citationCorrected`
  (chat-agentic), `graph.citations` + `graph.corrections` (chat-graph),
  `metadata.citations` + `metadata.citation_corrections` (Bible endpoints).
