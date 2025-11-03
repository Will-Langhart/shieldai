# Shield AI – iOS Build Blueprint (Expo + Monorepo)

## Goals
- Deliver a native iOS app via Expo, reusing existing Next.js APIs and TypeScript modules
- Leverage existing monorepo structure for structured code sharing
- Keep secrets server-side; mobile communicates only with Next.js API
- Maintain Vercel for web deployments; use EAS for iOS builds and OTA updates

---

## Current Repo Structure (Actual Implementation)

**Framework**: Next.js 14 (TypeScript)
**API**: Serverless routes in `pages/api/**`
**Auth**: Supabase (Bearer access tokens expected by server)
**Payments**: Stripe, handled server-side
**Data/AI**: Pinecone vector store (server-only), OpenAI integrations
**UI**: Tailwind CSS (web), NativeWind (mobile)

### Repository Structure

```
shieldai/
├── src/
│   ├── apps/
│   │   ├── web/              # Next.js web app (current)
│   │   │   ├── components/   # React components
│   │   │   ├── lib/         # Server-side services (Pinecone, embeddings, Stripe secrets)
│   │   │   ├── pages/       # Next.js pages & API routes
│   │   │   ├── services/    # Client-side services
│   │   │   └── types/       # TypeScript types
│   │   │
│   │   └── mobile/          # Expo React Native app (existing)
│   │       ├── app/         # Expo Router app directory
│   │       │   └── (tabs)/  # Tab navigation screens
│   │       ├── components/  # React Native components
│   │       ├── contexts/    # React contexts (auth, etc.)
│   │       ├── constants/   # App constants
│   │       └── utils/      # Utilities
│   │
│   ├── shared/               # Shared code (existing)
│   │   ├── services/        # Shared client-safe services
│   │   │   └── services_mobile-api.ts  # Mobile API client
│   │   ├── types/            # Shared TypeScript types
│   │   └── ui/              # Optional cross-platform components
│   │
│   ├── config/               # Database migrations, configs
│   ├── docs/                 # Documentation
│   └── scripts/              # Development scripts
│
└── package.json              # Root workspace config
```

**Current Workspace Setup** (from `package.json`):
```json
{
  "name": "shieldai",
  "private": true,
  "workspaces": [
    "src/apps/*",
    "packages/*"
  ]
}
```

---

## Code Sharing Strategy

### Current State
- ✅ Monorepo structure exists at `src/apps/web` and `src/apps/mobile`
- ✅ Shared services exist at `src/shared/services/services_mobile-api.ts`
- ✅ Mobile app is scaffolded with Expo Router

### Shared Services Location
**Keep server-only modules in `src/apps/web/lib/`**:
- Pinecone operations
- Embeddings generation
- Stripe secret key operations
- OpenAI API calls (server-side only)

**Shared client-safe services in `src/shared/services/`**:
- `services_mobile-api.ts` - Already contains mobile API client functions
  - ✅ Health check
  - ✅ Chat (needs update: change `mode: 'fast' | 'accurate'` to `'gentle' | 'scholarly' | 'debate'`)
  - ✅ Bible (versions, passage, search, cross-refs, daily verse)
  - ✅ Notes (CRUD, history, search)
  - ✅ Church Finder
  - ✅ Subscriptions (plans, create, status, usage, cancel/reactivate)

**Services need refactoring**:
- All services call Next.js API endpoints (no direct third-party calls)
- Mobile uses `services_mobile-api.ts` for all API communication
- Web can use same services or have its own implementations

---

## Mobile App Setup (Current State)

### ✅ Already Implemented

**Scaffold**: Expo app exists at `src/apps/mobile/`
- ✅ Expo Router configured (`expo-router` ~5.1.4)
- ✅ App structure with `app/(tabs)/` navigation
- ✅ TypeScript configured

**Dependencies** (from `package.json`):
- ✅ `expo-router` - File-based routing
- ✅ `@supabase/supabase-js` - Authentication
- ✅ `@react-native-async-storage/async-storage` - Local storage
- ✅ `@tanstack/react-query` - Data fetching
- ✅ `expo-secure-store` - Secure credential storage
- ✅ `@stripe/stripe-react-native` - Payment processing
- ✅ `react-native-svg` - SVG support
- ✅ `lucide-react-native` - Icons
- ✅ `expo-location` - Location services
- ✅ `react-native-maps` - Map components
- ✅ `nativewind` - Tailwind for React Native

**Configuration** (`app.config.ts`):
- ✅ Deep link scheme: `shieldai`
- ✅ Bundle ID: `com.shieldai.app`
- ✅ Supports tablet (`supportsTablet: true`)
- ✅ Stripe plugin configured
- ✅ React Native Maps plugin configured

**Babel Config** (`babel.config.js`):
- ✅ NativeWind configured
- ✅ Module resolver with aliases:
  - `@services` → `../../packages/services/src`
  - `@types` → `../../packages/types/src`
  - `@ui` → `../../packages/ui/src`

**Note**: Aliases point to `packages/` but actual shared code is in `src/shared/`. Needs update.

---

## Tab Structure (Current Implementation)

**Mobile App Tabs** (`app/(tabs)/_layout.tsx`):
1. **Chat** (`index.tsx`) - AI conversations
2. **Bible** (`bible.tsx`) - Bible reading and search
3. **Notes** (`notes.tsx`) - Bible notes management
4. **Church** (`church.tsx`) - Church finder
5. **Settings** (`settings.tsx`) - User settings, subscription, profile

**Note**: Insights History is web-only (`/insights-history`). Mobile may access via web view or future implementation.

---

## API Contracts for Mobile

### Auth
- **Method**: Supabase native auth
- **Headers**: `Authorization: Bearer <supabaseAccessToken>`
- **Endpoints**: 
  - Supabase auth endpoints (sign in/sign up)
  - All API endpoints require Bearer token

### Chat
- **Endpoint**: `POST /api/chat`
- **Request**: 
  ```typescript
  {
    message: string
    mode?: 'gentle' | 'scholarly' | 'debate'  // Updated from 'fast' | 'accurate'
    sessionId?: string
    conversationId?: string
  }
  ```
- **Response**: Streaming response or JSON
- **Additional**: 
  - `GET /api/conversations` - List conversations
  - `GET /api/conversations/[id]` - Get conversation messages
  - `GET /api/messages?conversationId=[id]` - Get messages

### Bible
- **Endpoints**:
  - `GET /api/bible/versions` - Available Bible versions
  - `GET /api/bible/passage?reference=[ref]&version=[ver]` - Get passage
  - `GET /api/bible/search?query=[query]&version=[ver]` - Search
  - `GET /api/bible/advanced-search?[filters]` - Advanced search
  - `GET /api/bible/popular?version=[ver]` - Popular verses
  - `GET /api/bible/daily-verse` - Daily verse
  - `GET /api/bible/suggestions` - Verse suggestions
  - `GET /api/bible/cross-references?reference=[ref]` - Cross-references
  - `GET /api/bible/context?reference=[ref]` - Verse context
  - `GET /api/bible/concordance?query=[query]` - Concordance
  - `GET /api/bible/study-questions?reference=[ref]` - Study questions
  - `POST /api/bible/ai-insights` - Generate AI insights

### Notes
- **Endpoints**:
  - `GET /api/bible/notes` - List notes (with filters)
  - `POST /api/bible/notes` - Create note
  - `PUT /api/bible/notes` - Update note
  - `DELETE /api/bible/notes/[noteId]` - Delete note
  - `GET /api/bible/notes/search?q=[query]` - Search notes
  - `GET /api/bible/notes/history` - Note history

### Church Finder
- **Endpoints**:
  - `POST /api/churches/search` - Search for churches
    ```typescript
    {
      location: { lat: number, lng: number }
      radius?: number
      denomination?: string
    }
    ```
  - `POST /api/geocode` - Geocode address
  - `GET /api/geocode/autocomplete?input=[query]` - Address autocomplete

### Subscriptions
- **Endpoints**:
  - `GET /api/subscriptions/plans` - Available plans
  - `GET /api/subscriptions/tiers` - Subscription tiers with limits
  - `GET /api/subscriptions/status` - User subscription status
  - `POST /api/subscriptions/create` - Create subscription
  - `POST /api/subscriptions/cancel` - Cancel subscription
  - `POST /api/subscriptions/reactivate` - Reactivate subscription
  - `GET /api/subscriptions/usage` - Usage metrics
  - `GET /api/subscriptions/payments` - Payment history
  - `POST /api/subscriptions/check-feature` - Check feature access
  - `POST /api/subscriptions/promo-code` - Apply promo code
  - `POST /api/subscriptions/referral` - Process referral

### AI Insights (Web-only, future mobile support)
- **Endpoints**:
  - `GET /api/ai-insights/history` - Get saved insights
  - `POST /api/ai-insights/save` - Save insight
  - `GET /api/ai-insights/search` - Search insights
  - `GET /api/ai-insights/statistics` - Insight statistics
  - `GET /api/analytics` - Analytics dashboard

### Health
- **Endpoint**: `GET /api/health`
- **Response**: `{ status: string, message: string }`

---

## Feature Gating & Subscription Mapping

### Subscription Tiers (Actual Implementation)

| Feature | Explorer (Free Trial) | Bible Student ($9.99/mo) | Bible Scholar ($19.99/mo) | Ministry ($49.99/mo) |
|---------|---------------------|-------------------------|--------------------------|---------------------|
| **Daily Verse** | ✅ | ✅ | ✅ | ✅ |
| **Chat - Gentle Mode** | ✅ (5 convos/day, 10 msgs/day) | ✅ (Unlimited, 20/day) | ✅ (Unlimited) | ✅ (Unlimited) |
| **Chat - Scholarly Mode** | ❌ | ✅ (10/day) | ✅ (Unlimited) | ✅ (Unlimited) |
| **Chat - Debate Mode** | ❌ | ❌ | ✅ (Unlimited) | ✅ (Unlimited) |
| **Bible Search - Basic** | ✅ (20/day) | ✅ (Unlimited) | ✅ (Unlimited) | ✅ (Unlimited) |
| **Bible Search - Advanced** | ❌ | ✅ (Unlimited) | ✅ (Unlimited) | ✅ (Unlimited) |
| **Cross-References** | ❌ | ✅ | ✅ | ✅ |
| **Concordance** | ❌ | ✅ | ✅ | ✅ |
| **Notes** | ✅ (5/week = 20/month) | ✅ (Unlimited) | ✅ (Unlimited) | ✅ (Unlimited) |
| **Church Finder** | ✅ (5/month) | ✅ (50/month) | ✅ (Unlimited) | ✅ (Unlimited) |
| **Export Materials** | ✅ (1/month) | ✅ (10/month) | ✅ (Unlimited) | ✅ (Unlimited) |
| **Mood Verse** | ❌ | ❌ | ✅ | ✅ |
| **AI Insights** | ✅ (View own) | ✅ (View own) | ✅ (View own + Analytics) | ✅ (View own + Analytics) |
| **API Access** | ❌ | ❌ | ✅ (1,000/mo) | ✅ (5,000/mo) |
| **Team Members** | 1 | 1 | 3 | 25 |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |

---

## Environment & Secrets

### Mobile Environment Variables

**Required** (in `.env` or Expo config):
```
EXPO_PUBLIC_API_BASE_URL=https://shieldai.cloud
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Optional**:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key  # For maps (Android)
EAS_PROJECT_ID=your_eas_project_id
EAS_UPDATE_URL=your_eas_update_url
```

### Server Environment Variables (Vercel)

**Keep server-side**:
- `OPENAI_API_KEY` - OpenAI API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `PINECONE_API_KEY` - Pinecone API key
- `GOOGLE_PLACES_API_KEY` - Google Places server key
- `BIBLE_API_KEY` - Bible API key
- All other secret keys

---

## Navigation & Flows

### Stack Flows

**Chat**:
```
ChatTab (List) → ChatDetail → Compose Message → Toggle Mode (Gentle/Scholarly/Debate)
```

**Bible**:
```
BibleTab (Home) → Search → Passage View → [AI Insights | Study Questions | Cross-Refs | Compare Versions]
```

**Notes**:
```
NotesTab (List) → NoteEditor → Link Verse → Add Tags → Save
```

**Church Finder**:
```
ChurchTab → Search → Map/List View → ChurchDetail → Directions
```

**Settings**:
```
SettingsTab → Profile | Preferences | Subscription | Notifications | Data Export
```

---

## Design Guidelines

### UI Kit
- **Mobile**: NativeWind (Tailwind for React Native) ✅ Already configured
- **Web**: Tailwind CSS
- **Alternative**: Tamagui (if NativeWind proves insufficient)

### Colors (Shield AI Brand Palette)
- **Background**: `#1A1D24` (main), `#2C303A` (panels)
- **Text**: `#E0E0E0` (primary), `#9CA3AF` (secondary)
- **Accents**: `#3B82F6` / `#2563EB` (blue)
- **Borders**: `#3A404B`

### Icons
- **Mobile**: `lucide-react-native` ✅ Already installed
- **Web**: `lucide-react` (matches mobile)

### Typography
- **iOS**: San Francisco (system font)
- **Android**: Roboto (system font)
- **Cross-platform fallback**: Inter
- **Implementation**: Use React Native Text component with system fonts

---

## Push Notifications

### Types
1. **Daily Verse** - Morning devotional verse
2. **Motivation/Devotional** - AI-generated devotionals
3. **Chat Reminders** - Encourage engagement
4. **Church Finder** - Weekend reminders for nearby churches
5. **Subscription Usage** - Usage alerts and limits
6. **Subscription Updates** - Payment confirmations, renewals

### Flow
1. Mobile registers Expo push token via `Expo.Notifications.getExpoPushTokenAsync()`
2. Send token to server: `POST /api/notifications/register`
3. Token stored in Supabase `user_notifications` table
4. Server sends notifications via Expo Push API (Vercel cron jobs or serverless functions)
5. Handle notifications in app via `Expo.Notifications.addNotificationReceivedListener()`

### Implementation Status
- ⚠️ **Needs Implementation**: Notification registration endpoint exists but needs mobile integration

---

## Testing Strategy

### Unit Tests
- **Location**: `src/shared/services/` tests
- **Framework**: Jest
- **Coverage**: API client functions, data transformations

### Integration Tests
- **Location**: `src/apps/web/pages/api/**` tests
- **Framework**: Jest + Supabase test client
- **Coverage**: API endpoints with Supabase auth simulation

### E2E Tests
- **Framework**: Detox (React Native)
- **Coverage**: 
  - Auth flow (sign in/sign up)
  - Chat flow (create conversation, send message)
  - Bible flow (search, read passage, generate insights)
  - Notes flow (create, edit, delete)
  - Payment flow (subscription creation)

### Staging Builds
- **Platform**: EAS Build
- **Distribution**: TestFlight (iOS internal distribution)
- **Update**: OTA updates via EAS Update

---

## Release Checklist

### Pre-Launch
- [x] Monorepo structure complete
- [x] Expo mobile app scaffolded
- [x] Supabase auth functional
- [ ] API client services updated (change chat mode from `fast/accurate` to `gentle/scholarly/debate`)
- [ ] API calls tested: `/api/health`, `/api/chat`, `/api/bible/passage`
- [ ] PaymentSheet tested with Stripe sandbox
- [ ] Push notifications tested in dev
- [ ] Privacy Policy & Terms URLs ready
- [ ] App Store Connect setup with bundle ID `com.shieldai.app`
- [ ] App icon, splash screen finalized
- [ ] NativeWind styles match web design
- [ ] Tab navigation implemented and tested
- [ ] Subscription feature gating tested

### Post-Launch
- [ ] Analytics tracking implemented
- [ ] Crash reporting (Sentry or similar)
- [ ] App Store listing optimized
- [ ] OTA updates configured

---

## Post-Launch Growth Plan

### Month 1–2
- Collect analytics on screen usage (Chat, Bible, Notes, Church, Settings)
- A/B test onboarding flow
- Launch social media promo with "Daily Verse" push as lead magnet
- Monitor subscription conversion rates

### Month 3–4
- Add reading plans & progress tracking
- Expand notifications with AI-generated devotionals
- Launch referral rewards for Pro subscriptions
- Implement Insights History in mobile (currently web-only)

### Month 5+
- Introduce iPad layout (supportsTablet already enabled)
- Offline full Bible storage for Pro users
- Explore Android port via Expo EAS
- Mood Verse feature (Scholar+ tier)
- Enhanced analytics dashboard in mobile

---

## Branching & PR Plan

### Current Status
- ✅ PR 1: Monorepo structure exists (`src/apps/web`, `src/apps/mobile`, `src/shared/`)
- ✅ PR 2: Expo app scaffolded with `/api/health` capability
- ⚠️ PR 3: Shared services exist but need updates:
  - Update `services_mobile-api.ts` chat mode from `'fast' | 'accurate'` to `'gentle' | 'scholarly' | 'debate'`
  - Verify Babel aliases point to correct paths (`src/shared/` vs `packages/`)

### Upcoming PRs
- **PR 4**: Implement Chat tab (conversation list, detail, mode toggle)
- **PR 5**: Implement Bible tab (navigation, passage view, AI insights)
- **PR 6**: Implement Notes tab (list, editor, tags)
- **PR 7**: Implement Church Finder tab (search, map, list)
- **PR 8**: Implement Settings tab (profile, subscription, notifications)
- **PR 9**: Implement subscription feature gating across all tabs
- **PR 10**: Implement push notifications
- **Final PR**: Polish UI, payment flow, testing, App Store submission

---

## Key Changes from Original Blueprint

1. **Repository Structure**: Already uses `src/apps/` instead of `apps/`
2. **Shared Services**: Exist at `src/shared/services/` (not `packages/services/`)
3. **Mobile App**: Already scaffolded with Expo Router
4. **Chat Modes**: Changed from "Fast/Accurate" to "Gentle/Scholarly/Debate" (needs service update)
5. **Subscription Tiers**: Updated to Explorer, Bible Student, Bible Scholar, Ministry (not just Free/Pro)
6. **Tab Structure**: Chat, Bible, Notes, Church, Settings (no Insights tab - web-only)
7. **Babel Aliases**: Need updating to point to `src/shared/` instead of `packages/`
8. **API Endpoints**: Complete list matches actual implementation

---

## Next Steps

1. **Update shared services**:
   - Fix chat mode types in `services_mobile-api.ts`
   - Verify Babel aliases point to `src/shared/`
   - Add any missing API endpoints

2. **Implement mobile screens**:
   - Chat tab with conversation list and mode toggle
   - Bible tab with navigation and passage view
   - Notes tab with list and editor
   - Church Finder tab with search and map
   - Settings tab with subscription management

3. **Feature gating**:
   - Implement subscription checks in each screen
   - Show upgrade prompts when limits reached
   - Display usage progress bars

4. **Testing**:
   - Unit tests for API client
   - Integration tests for API endpoints
   - E2E tests for critical flows

5. **Deployment**:
   - EAS Build configuration
   - TestFlight setup
   - OTA update configuration

---

*Last updated: Based on current codebase analysis and UI wireframes*

