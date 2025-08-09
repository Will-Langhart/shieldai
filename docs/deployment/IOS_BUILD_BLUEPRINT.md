## 🛡️ Shield AI – iOS Build Blueprint (Expo + Monorepo)

### Goals
- Deliver a native iOS app via Expo, reusing existing Next.js APIs and TypeScript modules.
- Introduce a monorepo for structured code sharing.
- Keep secrets server-side; mobile communicates only with your Next.js API.
- Maintain Vercel for web deployments; use EAS for iOS builds and OTA updates.

### Current Repo Highlights
- Framework: Next.js 14 (TypeScript)
- API: Serverless routes in `pages/api/**`
- Auth: Supabase (Bearer access tokens expected by server)
- Payments: Stripe, handled server-side
- Data/AI: Pinecone vector store (server-only), OpenAI integrations
- UI: Tailwind CSS
- No existing mobile artifacts — fresh mobile setup required.

### Repository Restructure

Monorepo layout:
```text
apps/
  web/         # current Next.js app
  mobile/      # new Expo app
packages/
  services/    # shared client-safe services
  types/       # shared TypeScript types
  ui/          # optional cross-platform components
  config/      # shared ESLint, tsconfig, Babel presets
```

Root package.json (npm workspaces):
```json
{
  "name": "shieldai",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

### Code Sharing Strategy
- Keep server-only modules in `apps/web` (Pinecone, embeddings, Stripe secret logic).
- Move isomorphic client services to `packages/services/` (refactor to call our own APIs).

### Mobile App Setup (Expo)
- Scaffold: `npx create-expo-app apps/mobile --template expo-router`
- Install: expo-router, supabase-js, async-storage, react-query, expo-secure-store, stripe-react-native, svg, lucide-react-native, expo-location, react-native-maps, nativewind
- Configure: app.config.ts (scheme, bundle ID), babel aliases, Metro monorepo watch

### API Contracts for Mobile
- Auth via Supabase; Bearer token for all endpoints
- Chat: `POST /api/chat`
- Bible: versions, passage, search, cross-refs, daily-verse
- Notes: CRUD/history/search
- Church Finder: `/api/churches/search`, geocode
- Subscriptions: plans/create/status/usage/payments/cancel/reactivate
- Health: `/api/health`

### Environment & Secrets
- Mobile (public): `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Server (Vercel): OpenAI/Stripe/Pinecone/Bible, `GOOGLE_PLACES_SERVER_API_KEY`

### Push Notifications
- Types: daily verse, motivation, chat reminders, church reminder, subscription usage
- Device register: `POST /api/notifications/register`
- Server send: Vercel cron → Expo Push API

### Branching & PR Plan
- PR1: Monorepo restructure
- PR2: Expo app + `/api/health`
- PR3: Extract services to `packages/services`
- PR4+: Feature screens


