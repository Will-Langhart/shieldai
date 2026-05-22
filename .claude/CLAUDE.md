# Shield AI — Claude Code Context

Christian apologetics chatbot and Bible study platform. Provides AI-powered responses to theological challenges, Bible reading tools, study notes, and church finder. Targets both web (deployed) and iOS (in active development).

---

## Repo layout

```
shieldai/                        ← you are here (git root)
├── src/
│   ├── apps/
│   │   ├── web/                 ← Next.js 14 web app (Pages Router)
│   │   └── mobile/              ← Expo 53 / React Native 0.79 iOS app
│   ├── shared/
│   │   ├── services_mobile-api.ts   ← shared API client (web + mobile)
│   │   ├── types_index.ts
│   │   └── ui_index.tsx
│   ├── config/
│   │   ├── migrations/          ← SQL migrations (run against Supabase)
│   │   └── env/                 ← local env files (gitignored)
│   ├── docs/                    ← feature/setup docs
│   └── scripts/                 ← dev/deploy/db scripts
├── package.json                 ← npm workspaces root
└── .claude/CLAUDE.md            ← this file
```

---

## Tech stack

| Layer | Web | Mobile |
|---|---|---|
| Framework | Next.js 14 (Pages Router) | Expo 53 + Expo Router |
| Language | TypeScript | TypeScript |
| Styling | Tailwind CSS (custom `shield-*` tokens) | NativeWind |
| Auth | Supabase (Bearer tokens) | Supabase via `expo-secure-store` |
| Database | Supabase (Postgres + RLS) | — (reads via API) |
| AI | OpenAI + LangChain + Pinecone RAG | — (calls web API) |
| Payments | Stripe (server-side only) | RevenueCat → Apple IAP (planned) |
| Deployment | Vercel (`shieldai.cloud`) | EAS Build → TestFlight (not yet built) |

---

## Running the project

```bash
# Web app (runs on port 3001 per next.config.js)
npm run dev:web

# Mobile app (Expo dev server)
npm run dev:mobile
# or directly:
cd src/apps/mobile && npx expo start

# Run with logging
npm run dev:web:logging
```

---

## Key architectural rules

**API secrets never leave the server.** OpenAI, Pinecone, Stripe secret key, Supabase service role key, Google Places — all server-side only in `src/apps/web/lib/` and `pages/api/`. Mobile communicates only with `https://shieldai.cloud` API.

**Mobile uses the shared API client.** All mobile API calls go through `src/shared/services_mobile-api.ts`. Babel alias `@services/mobile-api` resolves to this file. Do not add direct third-party SDK calls in mobile code.

**Auth flow.** Supabase handles auth. Mobile uses `expo-secure-store` for token persistence. All API routes expect `Authorization: Bearer <supabaseAccessToken>`.

**Payments on iOS = RevenueCat, not Stripe.** Apple App Store requires IAP for digital subscriptions. Stripe stays for web. The mobile subscription flow will use `react-native-purchases` (RevenueCat SDK) which bridges StoreKit. Do not wire up Stripe PaymentSheet for iOS subscriptions.

---

## Mobile app specifics

**Tabs:** Chat (`index.tsx`) · Bible (`bible.tsx`) · Notes (`notes.tsx`) · Church (`church.tsx`) · Settings (`settings.tsx`)

**Chat modes:** `'gentle' | 'scholarly' | 'debate'` — NOT `'fast' | 'accurate'` (old, removed).

**Babel aliases** (`src/apps/mobile/babel.config.js`):
```js
'@services/mobile-api' → '../../src/shared/services_mobile-api'
'@types'               → '../../src/shared/types_index'
'@ui'                  → '../../src/shared/ui_index'
```

**EAS project ID** is read from `process.env.EAS_PROJECT_ID`. Run `eas init` inside `src/apps/mobile/` to generate and then set it in a local `.env` there.

**Bundle ID:** `com.shieldai.app`  
**Deep link scheme:** `shieldai://`

---

## Subscription tiers

| Tier | Price | Key limits |
|---|---|---|
| Explorer (free) | $0 | 5 convos/day, gentle mode only, 5 notes/week |
| Bible Student | $9.99/mo | Unlimited convos, gentle + scholarly, advanced search |
| Bible Scholar | $19.99/mo | All modes, debate, mood verse, API access 1k/mo |
| Ministry | $49.99/mo | 25 team members, white-label, API 5k/mo |

Feature gating lives in `src/apps/web/pages/api/subscriptions/check-feature.ts` and the subscription middleware.

---

## Design system

Tailwind custom tokens (web) — NativeWind equivalents (mobile):

| Token | Value | Use |
|---|---|---|
| `shield-canvas` | `#1A1D24` | Page background |
| `shield-panel` | `#2C303A` | Cards / panels |
| `shield-fg` | `#E8EAED` | Primary text |
| `shield-muted` | `#9CA3AF` | Secondary text |
| `shield-brand` | `#46A1E2` | Primary blue accent |
| `shield-accent` | `#E8B44C` | Gold accent |

Splash screen background: `#1A6CF8`. App icon: `src/apps/mobile/assets/images/icon.png`.

---

## API surface (mobile-facing)

All routes live under `src/apps/web/pages/api/`. Key groups:

- `POST /api/chat` — streaming AI chat (gentle/scholarly/debate modes)
- `GET /api/conversations`, `GET /api/conversations/[id]`, `GET /api/messages`
- `GET /api/bible/*` — versions, passage, search, daily-verse, cross-references, study-questions, ai-insights
- `GET|POST /api/bible/notes`, `PUT /api/bible/notes`, `DELETE /api/bible/notes/[noteId]`
- `POST /api/churches/search`, `POST /api/geocode`
- `GET /api/subscriptions/status`, `GET /api/subscriptions/plans`, `POST /api/subscriptions/create`
- `POST /api/notifications/register`
- `GET /api/health`

---

## Environment variables

**Web / Vercel (server-only):**
```
OPENAI_API_KEY
STRIPE_SECRET_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PINECONE_API_KEY
GOOGLE_PLACES_API_KEY
BIBLE_API_KEY
```

**Mobile (Expo public — safe to bundle):**
```
EXPO_PUBLIC_API_BASE_URL=https://shieldai.cloud
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

**Mobile build (not bundled):**
```
EAS_PROJECT_ID=
EAS_UPDATE_URL=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=   # Android only
```

Local env files live in `src/config/env/` (gitignored). See `src/config/env.example`.

---

## Database

Supabase Postgres. Migrations are in `src/config/migrations/` — run manually with:
```bash
npm run db:migrate
```

Key tables: `conversations`, `messages`, `bible_notes`, `ai_insights`, `subscriptions`, `user_notifications`.

---

## Current iOS build status (as of 2026-05-22)

**Phase 1 complete** — build blockers cleared:
- Babel aliases fixed
- Chat mode types updated
- Church tab added
- Logo/assets updated

**Phase 2 — Figma wireframes** (in progress by Will)

**Phase 3 — Chat screens** (next to implement):
- `/chat/[id]` — conversation detail with streaming
- `/chat/new` — new conversation + mode selector modal

**Phase 4 — RevenueCat** (after chat screens):
- Replace `@stripe/stripe-react-native` PaymentSheet with `react-native-purchases`
- Create subscription products in App Store Connect matching the 4 tiers
- Add RevenueCat webhook → `/api/subscriptions/create`

**Phase 5** — Bible, Notes, Church, Settings sub-screens → EAS Build → TestFlight

---

## Known issues / gotchas

- `package-lock.json` at root is frequently dirty (workspace hoisting). Safe to leave unstaged unless intentionally updating deps.
- `src/apps/web/next.config.js` has `typescript: { ignoreBuildErrors: true }` — TypeScript errors won't fail the Vercel build. Fix errors but don't rely on build failure as a safety net.
- There is a `chat-enhanced.ts.backup` in `pages/api/` — not a real route, safe to ignore.
- `src/apps/web` has both a root-level `Header.tsx` / `Footer.tsx` AND `components/layout/Header.tsx` / `Footer.tsx`. The layout versions are the ones actually used. The root-level duplicates are dead code.
- 208 Dependabot alerts on GitHub: Next.js CVEs fixed by upgrading to `next@14.2.35`; Expo chain fixed by upgrading to Expo 56 (breaking — defer until after MVP).
