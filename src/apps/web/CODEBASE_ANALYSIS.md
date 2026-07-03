# Shield AI Web App — Codebase Analysis

**Date:** 2026-06-05  
**Scope:** `src/apps/web/`

---

## 1. Pages

| Route | File | Auth | State |
|---|---|---|---|
| `/` | `pages/index.tsx` → `pages/Home.tsx` | Public | Complete. Landing page with hero, rotating question showcase, feature cards, CTA. |
| `/chat` | `pages/chat.tsx` | Protected | Complete. Wraps `Chat` component in `ProtectedRoute`. |
| `/bible` | `pages/bible.tsx` | Protected | Complete. Wraps `Bible` component in `ProtectedRoute`. |
| `/journal` | `pages/journal.tsx` | Protected | Complete. Lists saved AI insights grouped by date; local search + filters; inline note editing via `JournalNoteEditor`. |
| `/insights-history` | `pages/insights-history.tsx` | Protected | Thin page wrapping `EnhancedInsightsQuery`. `getServerSideProps` exists but does nothing — `userId` prop is always undefined. |
| `/test-insights` | `pages/test-insights.tsx` | **None** | **Dev/test debug page left in production build.** Calls `/api/ai-insights/test-save` (route does not exist). No auth guard. |
| `/email-confirm` | `pages/EmailConfirm.tsx` | Public | Not linked from `_app.tsx` page routing; only referenced in Supabase auth `emailRedirectTo`. |

**Gap:** No `/settings`, `/pricing`, `/church`, or `/account` pages. The CLAUDE.md spec references church finder and subscription UI; neither exists on web. No 404 page defined.

---

## 2. API Routes

### Chat

| Route | Method | Notes |
|---|---|---|
| `/api/chat` | POST | **Primary.** Full orchestration: auth → rate limit → subscription gate → parallel RAG (Pinecone + Bible API + memory + videos) → OpenAI → streaming or JSON. Used by `Chat` component. |
| `/api/chat-rag` | POST | **Duplicate/secondary.** Lighter RAG-only chat; accepts `test-token`. Used by nothing in the current web UI (no import found). Likely dead code or legacy. |

### Bible

| Route | Method | Notes |
|---|---|---|
| `/api/bible/passage` | GET | Fetches passage by reference from Bible API. Used. |
| `/api/bible/search` | GET | Full-text search via Bible API. |
| `/api/bible/versions` | GET | Returns available Bible versions. |
| `/api/bible/ai-insights` | POST | Generates AI insight for a passage; saves to Supabase. Accepts `test-token`. |
| `/api/bible/cross-references` | GET | AI-generated cross-references for a passage. Accepts `test-token`. |
| `/api/bible/study-questions` | GET | AI-generated study questions. Accepts `test-token`. |
| `/api/bible/daily-verse` | GET | Returns a daily verse. |
| `/api/bible/notes` | GET/POST/PUT | CRUD for bible notes. GET uses `?userId=` query param (not auth header — inconsistent pattern). |
| `/api/bible/notes/[noteId]` | PUT/DELETE | Per-note operations. |
| `/api/bible/notes/history` | GET | Note history. |
| `/api/bible/notes/search` | GET | Note search. |
| `/api/bible/concordance` | GET | Concordance lookup. |
| `/api/bible/advanced-search` | GET | Subscription-gated advanced search. |
| `/api/bible/context` | GET | Passage context. |
| `/api/bible/crossrefs` | GET | Duplicate of `cross-references`? Both exist. |
| `/api/bible/apologetics` | GET | Apologetics-specific passage lookup. |
| `/api/bible/favorites` | GET/POST | Favorites management. |
| `/api/bible/history` | GET | Reading history. |
| `/api/bible/popular` | GET | Popular passages. |
| `/api/bible/preferences` | GET/PUT | User Bible preferences. |
| `/api/bible/plan-steps` | GET/POST | Reading plan steps. |
| `/api/bible/plans` | GET/POST | Reading plans. |
| `/api/bible/suggestions` | GET | Passage suggestions. |

### AI Insights (separate namespace)

| Route | Notes |
|---|---|
| `/api/ai-insights/history` | Paginated history of saved insights. Used by `/journal` and `/insights-history`. |
| `/api/ai-insights/save` | Saves generated insight to `ai_insights` table. |
| `/api/ai-insights/by-passage` | Fetch insights for a passage (Supabase). |
| `/api/ai-insights/by-passage-pinecone` | Same but via Pinecone vector search. |
| `/api/ai-insights/search` | Text search over insights. |
| `/api/ai-insights/search-pinecone` | Vector search over insights. |
| `/api/ai-insights/[id]/favorite` | Toggle favorite. |
| `/api/ai-insights/[id]/share` | Share insight. |
| `/api/ai-insights/delete` | Delete insight. |
| `/api/ai-insights/update` | Update insight. |
| `/api/ai-insights/feedback` | User feedback on insight. Accepts `test-token`. |
| `/api/ai-insights/interactions` | Track interactions. Accepts `test-token`. |
| `/api/ai-insights/recommendations` | Insight recommendations. Accepts `test-token`. |
| `/api/ai-insights/responses` | Track responses. Accepts `test-token`. |
| `/api/ai-insights/statistics` | Usage statistics. Accepts `test-token`. |
| `/api/ai-insights/health-check` | DB health check; used by `test-insights` page. |
| `/api/ai-insights/generate-image` | DALL-E image generation for insights. Accepts `test-token`. |

**Gap:** `/api/ai-insights/test-save` does not exist but is called by `pages/test-insights.tsx`.

### Conversations & Messages

| Route | Notes |
|---|---|
| `/api/conversations` | GET/POST. Accepts `test-token`. |
| `/api/conversations/[id]` | GET/PUT/DELETE. |
| `/api/conversations/track-interaction` | Tracks interaction metadata. |
| `/api/messages` | GET messages for a conversation. Accepts `test-token`. |

### Subscriptions

| Route | Notes |
|---|---|
| `/api/subscriptions/status` | Uses `StripeService` (old `basic/premium` plan model). |
| `/api/subscriptions/create` | Validates `basic` or `premium` plan — **does not match the 4-tier model** (explorer/student/scholar/ministry). |
| `/api/subscriptions/plans` | Returns plan list. |
| `/api/subscriptions/tiers` | Returns `EnhancedStripeService` tiers (4-tier model). |
| `/api/subscriptions/check-feature` | Feature gate check via `EnhancedStripeService`. |
| `/api/subscriptions/cancel` | Cancel subscription. |
| `/api/subscriptions/reactivate` | Reactivate subscription. |
| `/api/subscriptions/payments` | Payment history. |
| `/api/subscriptions/usage` | Usage metrics. |
| `/api/subscriptions/promo-code` | Promo code redemption. |
| `/api/subscriptions/referral` | Referral tracking. |
| `/api/webhooks/stripe` | Stripe webhook handler. Validates signature, delegates to `StripeService.handleWebhookEvent`. |

**Critical gap:** `/api/subscriptions/create` accepts only `'basic' | 'premium'` plan names — mismatched with the 4-tier system defined in `enhanced-stripe-service.ts` and CLAUDE.md. Payment flow is effectively broken unless the Supabase `subscription_plans` table happens to have records named `basic` and `premium`.

### Other

| Route | Notes |
|---|---|
| `/api/auth/signin` | Thin wrapper around `lib/auth.ts`. |
| `/api/auth/signup` | Calls `lib/auth.ts#signUp`. |
| `/api/health` | Returns `{status:'ok'}`. No checks. |
| `/api/geocode` | Google Geocoding API with hardcoded city fallback for 40+ US cities. Uses `GOOGLE_PLACES_SERVER_API_KEY`. |
| `/api/geocode/autocomplete` | Autocomplete via Google Places. |
| `/api/videos/search` | YouTube video search via `VideoService`. Requires auth. |
| `/api/analytics` | Analytics tracking. |
| `/api/analytics/conversations` | Conversation analytics. |
| `/api/feedback` | General feedback. |
| `/api/vector-response` | Vector-based response generation (standalone). |
| `/api/memory/search` | Search long-term memory vectors. |
| `/api/memory/stats` | Memory service stats. |
| `/api/pinecone/admin` | Admin ops on Pinecone index. |
| `/api/pinecone/bible-import` | Import Bible verses into Pinecone. |
| `/api/pinecone/env` | Exposes Pinecone env var names (not values). |
| `/api/pinecone/indexes` | List Pinecone indexes. |
| `/api/pinecone/memory` | Memory namespace ops. |
| `/api/pinecone/seed` | Seed Pinecone with data. |
| `/api/pinecone/stats` | Pinecone stats. |
| `/api/user/preferences` | User preferences CRUD. |
| `/api/notifications/register` | Push notification registration. |

**No `/api/churches/search` route exists** despite being listed in CLAUDE.md's API surface and referenced in the mobile app. This is a missing route for the church finder feature.

---

## 3. Components

### `components/features/chat/`

- **`Chat.tsx`** (~600+ lines): Full chat UI. Sidebar with conversation list (pinned/unpinned), conversation rename, delete, mode selector (`gentle/scholarly/debate`), streaming message display, denomination selector. Uses `chatService` from `services/chatService.ts`.
- **`EnhancedMessage.tsx`**: Renders individual messages with reaction buttons, copy, share, bookmark, feedback forms, video thumbnails, Bible verse cards. Substantial inline CSS. No props type exported.

### `components/features/bible/`

The active Bible component tree is: `Bible.tsx` → `MarginNotes`, `DenominationSelector`. Everything else in this directory is either imported by a single component or **unused by any page**.

**Used by pages/active components:**
- `Bible.tsx` — core reader with book/chapter/verse navigation, search, AI insight panel, margin notes
- `MarginNotes.tsx` — verse-level notes (imported by `Bible`)
- `AIBibleInsights.tsx` — insight generator (imported by `Bible` and `AIDiagnostics`)
- `AIStudyQuestions.tsx`, `AICrossReferences.tsx` — imported by `AIBibleInsights`
- `JournalNoteEditor.tsx` — imported by `journal.tsx` and `AIBibleInsights`
- `EnhancedInsightsQuery.tsx` — imported by `insights-history.tsx`
- `InsightDetailView.tsx` — imported by `EnhancedInsightsQuery`
- `InsightsAnalytics.tsx` — imported by `EnhancedInsightsQuery`
- `AIDiagnostics.tsx` — imported by `AIBibleInsights`
- `BibleBreadcrumbs.tsx` — imported by `EnhancedBibleNavigation`
- `EnhancedBibleNavigation.tsx`, `MobileBibleNavigation.tsx`, `QuickNavigation.tsx` — imported by `AIBibleInsights` or `EnhancedInsightsQuery`

**Zero imports — dead code:**
- `EnhancedBibleInterface.tsx` (432 lines) — never imported anywhere
- `InsightsHistory.tsx` (1208 lines) — never imported anywhere; superseded by `EnhancedInsightsQuery`
- `SmartTextSelection.tsx` (451 lines) — never imported anywhere
- `UltimateBibleInterface.tsx` (553 lines) — never imported anywhere
- `BibleReader.tsx` — exported from `index.ts` but only used there; not imported by any page or component that renders

**`index.ts` exports:** Only `BibleSearch` and `BibleReader`. Neither is imported by any page directly — pages import directly from `Bible.tsx`.

### `components/auth/`
- `ProtectedRoute.tsx` — renders inline login/signup form if no user (no redirect). Auth state comes from `AuthContext`.
- `LoginForm.tsx`, `SignUpForm.tsx` — call `useAuth()` directly; do not call `/api/auth/signin` or `/api/auth/signup` — those routes are unused by the frontend.
- `UserButton.tsx`, `UserProfile.tsx` — header user menu.
- `AuthModal.tsx` — exists but is **never imported** by any component.

### `components/layout/`
- `Header.tsx` — nav with logo, links to `/chat` and `/bible`, `UserButton`. This is the canonical version.
- `Footer.tsx` — minimal footer.

**Dead code:** `components/Header.tsx` and `components/Footer.tsx` (root-level duplicates). Both pages and the journal use `../components/Header` which resolves to the root-level `Header.tsx`, NOT `components/layout/Header.tsx`. This means the root-level files ARE used and the layout/ versions are the duplicates. Verify by checking: `journal.tsx`, `bible.tsx`, `insights-history.tsx`, `test-insights.tsx` all import from `../components/Header` (root), while `pages/index.tsx` also imports `../components/Header`. The `components/layout/Header.tsx` is imported only by `components/layout/index.ts` and `Footer.tsx` from layout — but nothing imports from `components/layout/index.ts` in any page. **`components/layout/` may be dead.**

### `components/ui/`
- `Button.tsx`, `Input.tsx`, `Modal.tsx` — generic UI components, lightly used.
- `DenominationSelector.tsx` — used in `Bible` and `Chat` for selecting denomination preference.

### `components/common/`
- `ErrorBoundary.tsx`, `LoadingSpinner.tsx` — used in `ProtectedRoute`.

---

## 4. Auth & Data Flow

### Auth mechanism
- **Client-side:** `contexts/AuthContext.tsx` wraps Supabase client. If `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, falls back to a **hardcoded mock user** (`test@example.com`, UUID `550e8400-...0001`) and sets `localStorage.auth_token = 'test-token'`. This mock path is active in environments without env vars.
- **Route protection:** `ProtectedRoute` component renders an inline login/signup modal when no user; no server-side redirect.
- **API routes:** Each route manually extracts `Authorization: Bearer <token>`, calls `createServerSupabaseClient(token)`, and calls `supabase.auth.getUser()`. No shared auth middleware — each handler re-implements auth.
- **Middleware:** `middleware.ts` only logs request metadata and injects correlation IDs. It does NOT enforce authentication.

### Test token bypass
12+ API routes accept `'test-token'` as a valid bearer token and return a hardcoded user (`id: 550e8400-...0000`). This is a security gap if deployed to production without being removed.

### Protected pages
`/chat`, `/bible`, `/journal`, `/insights-history` — all guarded by `ProtectedRoute`.  
`/test-insights` — **unguarded**, publicly accessible.

### Supabase tables referenced

| Table | Used by |
|---|---|
| `conversations` | `ChatService`, `/api/conversations` |
| `messages` | `ChatService`, `/api/messages` |
| `bible_notes` | `/api/bible/notes`, `MarginNotes`, `JournalNoteEditor` |
| `ai_insights` | `/api/ai-insights/*`, `AIBibleInsights`, insights pages |
| `users` | preferences, denomination, stripe_customer_id |
| `subscriptions` | `StripeService`, `EnhancedStripeService` |
| `subscription_plans` | `EnhancedStripeService.getSubscriptionTiers()` |
| `subscription_limits` | `EnhancedStripeService.getSubscriptionTiers()` |
| `user_notifications` | `/api/notifications/register` |

**`lib/supabase.ts` Database type definition** only covers `users`, `conversations`, `messages` and uses old `mode: 'fast' | 'accurate'` type for messages (stale — actual modes are `gentle/scholarly/debate`).

---

## 5. AI/LLM Layer

### OpenAI
- **Model:** `gpt-4o-mini` for gentle mode; `gpt-4o` for scholarly/debate (downgraded to `gpt-4o-mini` if user lacks advanced model subscription access).
- **Embeddings:** `lib/embeddings.ts` uses `text-embedding-3-small`. Called from `chat.ts` and `chat-rag.ts` to embed user messages before Pinecone search.
- **Image generation:** `lib/image-generation.ts` + `/api/ai-insights/generate-image.ts` uses DALL-E for insight image generation.
- **All OpenAI calls are lazy-initialized** with a module-level singleton. No connection pooling concern.

### Pinecone
- **Two client implementations exist:**
  - `lib/pinecone.ts` — HTTP-based direct calls to `api.pinecone.io`, uses `shieldai` named index.
  - `lib/pinecone-direct.ts` — similar HTTP approach.
  - `lib/bible-pinecone.ts` — `BiblePineconeService` class, uses `bible-verses` namespace (or same index with namespace filtering). Handles Bible verse import and semantic search.
  - `lib/insights-pinecone.ts` — insight-specific Pinecone operations.
- **Two Pinecone namespaces in use:** conversation memory vectors and Bible verse vectors, both in the `shieldai` index.
- **`@pinecone-database/pinecone` v1.1.3** is installed but the HTTP implementation bypasses it entirely in favor of raw `fetch` calls to avoid client library issues.

### LangChain
- `@langchain/openai` and `@langchain/pinecone` and `langchain` are installed.
- `lib/memory-service.ts` uses `MemoryService` which appears to use LangChain for conversation memory.
- **Actual usage is minimal.** Most AI logic uses the OpenAI SDK directly.

### Prompt engineering
- `lib/prompt-engineering.ts` — `analyzeQuestion()`, `generateSpecializedPrompt()`, `generateDenominationContext()`. Classifies theological question type and builds system prompts.
- `lib/objection-classifier.ts` — classifies apologetics objections into types: logical, moral, scientific, historical, emotional, philosophical, cultural, personal.
- `lib/advanced-prompts.ts` — specialized prompt generators for problem of evil, moral objections, scientific objections, etc.
- `lib/apologetics-knowledge.ts` — static in-memory knowledge base of apologetics topics with content and scripture references.

### Video integration
- `lib/video-service.ts` — `VideoService.searchRelevantVideos()`. Uses `YOUTUBE_API_KEY` to search YouTube. Falls back to **3 hardcoded curated video IDs** (William Lane Craig, Lee Strobel, C.S. Lewis) when YouTube search returns nothing. Relevant videos are injected into chat responses and displayed in `EnhancedMessage`.

### RAG pipeline in `/api/chat`
1. Embed user message via `EmbeddingService.generateEmbeddingForIndex()`
2. Parallel: Pinecone Bible content search + Bible API verse suggestions + conversation history from Supabase + long-term memory from `MemoryService` + subscription check
3. YouTube video search (Wave 2, uses memory context from Wave 1)
4. Build messages array with all context injected as system messages
5. Stream or non-stream OpenAI call
6. Save messages + update memory (with 10s timeout protection)

---

## 6. Subscription / Payments

### Tier model mismatch
Two parallel tier models exist and are inconsistently used:

**Old model** (`lib/stripe.ts`, `StripeService`):
- Plans: `'basic' | 'premium'`
- Used by: `/api/subscriptions/status`, `/api/subscriptions/create`

**New model** (`lib/enhanced-stripe-service.ts`, `EnhancedStripeService`):
- Tiers: `'basic' | 'student' | 'scholar' | 'ministry'` (maps to CLAUDE.md's Explorer/Bible Student/Bible Scholar/Ministry)
- Used by: `/api/subscriptions/check-feature`, `/api/subscriptions/tiers`, `SubscriptionMiddleware`

`/api/subscriptions/create` validates against `['basic', 'premium']` — the old model. If a user tries to subscribe to `student` or `scholar`, it returns a 400 error.

### Feature gating
`SubscriptionMiddleware` in `lib/subscription-middleware.tsx` delegates to `EnhancedStripeService.checkFeatureAccess()`. This hits Supabase tables `subscription_plans` and `subscription_limits`. The feature names used in middleware: `ai_conversation`, `scholarly_mode`, `debate_mode`, `advanced_bible_search`, `bible_search`, `note_creation`, `export`, `collaboration`, `api_access`.

The feature gating **is wired into `/api/chat`** — gentle mode checks `ai_conversation` usage, scholarly/debate check their respective features and downgrade model if access denied. Developers bypass gating via `DEVELOPER_EMAILS` env var.

### What's not implemented
- No pricing/plans UI page
- No checkout flow in the web UI (no Stripe PaymentSheet or hosted checkout)
- No subscription management UI
- Stripe webhook handles events but no UI feedback loop
- Trial period logic: `StripeService.isInTrialPeriod()` exists but `/api/chat` returns `isInTrial: false` hardcoded (TODO comment in chat.ts:735)

---

## 7. Dead Code, Backups, Gaps

### Backup files (not routes)
- `pages/api/chat-enhanced.ts.backup` — not loaded by Next.js, safe to delete
- `lib/enhanced-prompt-engineering.ts.backup` — not loaded, safe to delete
- `lib/multilingual-service.ts.backup` — duplicate of `lib/multilingual-service.ts`

### Unused components
- `components/features/bible/EnhancedBibleInterface.tsx` (432 lines) — zero imports
- `components/features/bible/InsightsHistory.tsx` (1208 lines) — zero imports, superseded by `EnhancedInsightsQuery`
- `components/features/bible/SmartTextSelection.tsx` (451 lines) — zero imports
- `components/features/bible/UltimateBibleInterface.tsx` (553 lines) — zero imports
- `components/auth/AuthModal.tsx` — zero imports
- `components/layout/Header.tsx` and `components/layout/Footer.tsx` — may be unused (pages import root-level `components/Header.tsx` not `components/layout/Header.tsx`)

### Duplicate API routes
- `/api/bible/cross-references` and `/api/bible/crossrefs` — both exist, likely duplicates
- `/api/chat` and `/api/chat-rag` — parallel implementations; `chat-rag` appears unused by the web UI

### `.conversation-storage.json`
A committed file at the web app root. Likely persisted test conversation data; should be gitignored.

### `logs/` directory
Dev log files (`logs/dev/2026-06-04.log`, `2026-06-05.log`) are committed. Should be gitignored.

### Missing routes referenced in CLAUDE.md
- `POST /api/churches/search` — **does not exist**. Referenced as part of the API surface for mobile. The church finder tab in mobile will fail.

### `test-insights.tsx` page
Calls `/api/ai-insights/test-save` which does not exist. No auth guard. Should be removed before production.

---

## 8. Quality Signals

### TypeScript
- `tsconfig.json` has `"strict": true` — good baseline.
- **`next.config.js` sets `typescript: { ignoreBuildErrors: true }`** (confirmed in CLAUDE.md). TypeScript errors do not fail builds. This nullifies the strict config as a safety net.
- `lib/supabase.ts` Database types use `mode: 'fast' | 'accurate'` — stale, actual enum is `gentle | scholarly | debate`.
- `any` is used heavily in API routes, especially for Supabase query results and OpenAI chunk parsing: `(chunk as any)?.choices?.[0]?.delta?.content`.
- `useApi.ts` hook exists but appears unused.

### Error handling
- API routes: try/catch with structured `logger.error()` calls. Consistent pattern across newer routes. Older routes (`subscriptions/status`, `subscriptions/create`) use `console.error` directly.
- Memory service failures are gracefully degraded with a circuit-breaker (module-level `memoryServiceDisabled` flag, `MAX_MEMORY_FAILURES = 3`) in `chat.ts`. This state is **process-level** — resets on cold start/deploy, does not persist.
- Streaming errors: on failure, writes a newline and calls `res.end()` — may result in truncated responses with no client-side error indication.
- `AuthContext.tsx` has `console.log` statements in production code logging Supabase config status (lines 7–8, 15–16).

### Logging
- `lib/logger.ts`: structured JSON to console + file (`logs/dev/YYYY-MM-DD.log` in development). Correlation IDs via `withCorrelationId()`. Used consistently in newer routes (`chat.ts`, `bible/passage.ts`, etc.). Older subscription routes still use `console.error`.
- `lib/dev-logging-config.ts` — dev-specific logging config for chat/video operations.

### Rate limiting
- `lib/rate-limit.ts` uses `express-rate-limit` adapted for Next.js API routes.
- Chat: 20 req/15min per IP. Bible AI: 60 req/15min per IP.
- Rate limiting is IP-based only; authenticated users get the same limit as anonymous IPs.
- **`/api/chat-rag` applies rate limiting but `/api/bible/ai-insights`, `/api/ai-insights/generate-image`, etc. only apply `applyBibleRateLimit`** — the AI insight generation routes at `/api/bible/ai-insights` and `/api/ai-insights/` have rate limiting but it's the lighter 60 req/15min limit despite making OpenAI calls.

### Testing
`package.json` test script: `echo 'No tests yet' && exit 0`. Zero test files exist.

### Security notes
- `test-token` bypass is present in 12+ production API routes. Maps to a hardcoded user ID.
- `.env.local.backup` file exists at the web root — should verify it contains no live credentials and add to `.gitignore` if not already.
- `.conversation-storage.json` contains conversation data committed to the repo.
- Pinecone admin routes (`/api/pinecone/admin`, `/api/pinecone/seed`, `/api/pinecone/bible-import`) have no auth checks visible — exposing database seeding operations.
