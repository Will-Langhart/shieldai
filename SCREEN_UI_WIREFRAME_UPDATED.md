# Screen UX Wireframe Table - Updated to Match Current Implementation

## Overview
This table reflects the actual implementation of Shield AI based on repository analysis, current routes, components, API endpoints, and feature gating.

---

| Tab / Screen | User Flow | Key Components (from repo) | API Endpoints | Feature Gating | Notes / UI Design |
|--------------|-----------|----------------------------|---------------|-----------------|-------------------|
| **Home** | Landing → Explore features → Start Chat / Explore Bible | `Home.tsx`, `Header.tsx` | `/api/bible/popular`, `/api/bible/daily-verse` | None | Dark theme with blue accents, gradient banners, suggested query carousel |
| **Chat (Gentle/Scholarly/Debate)** | Conversation List → Select Conversation → View Messages → Compose → Toggle Mode | `Chat.tsx`, `EnhancedMessage.tsx`, `chatService.ts` | `POST /api/chat`, `GET /api/conversations`, `GET /api/messages`, `GET /api/conversations/[id]` | **Explorer (Free)**: 5 convos/day, gentle mode only (10/day)<br>**Student**: Unlimited, gentle + scholarly (10 scholarly/day)<br>**Scholar+**: All modes unlimited, debate mode enabled | Sidebar with conversation list, search chats, toggle sidebar collapse. Mode selection: gentle/scholarly/debate (not fast/accurate). Streaming responses. Dark theme bubbles, nativewind styling |
| **Bible** | Select Version → Search/Select Passage → Read → AI Insights / Questions / Cross-refs / Compare Verses | `Bible.tsx`, `UltimateBibleInterface.tsx`, `EnhancedBibleInterface.tsx`, `BibleSearch.tsx`, `MobileBibleNavigation.tsx`, `EnhancedBibleNavigation.tsx`, `AIBibleInsights.tsx`, `AIStudyQuestions.tsx`, `AICrossReferences.tsx` | `GET /api/bible/versions`, `GET /api/bible/search`, `GET /api/bible/passage`, `GET /api/bible/popular`, `GET /api/bible/daily-verse`, `GET /api/bible/suggestions`, `GET /api/bible/advanced-search`, `GET /api/bible/cross-references`, `GET /api/bible/context`, `GET /api/bible/concordance`, `GET /api/bible/study-questions`, `GET /api/bible/ai-insights` | **Explorer**: Basic search (20/day)<br>**Student+**: Advanced search + cross-refs enabled | Persistent version selector in navigation panel. Tabbed interface: Bible Text, AI Insights, Study Questions, Cross-References. Quick navigation panel (book/chapter/verse). Floating bookmark action for Save Verse |
| **Bible Search Results** | Query → Filter → Select Verse → Read / Save / Compare | `BibleSearch.tsx`, `AdvancedBibleSearch.tsx`, `BibleVerse.tsx`, `FilterModal.tsx` | `GET /api/bible/search`, `GET /api/bible/advanced-search`, `GET /api/bible/concordance`, `GET /api/bible/context`, `GET /api/bible/cross-references` | **Explorer**: Basic search only<br>**Student+**: Advanced search + concordance + cross-refs | Tag chips for filters. Search history saved in Supabase. Verses displayed with metadata |
| **Notes (within Bible)** | View all notes → Filter by tag/verse/date → Open/Edit Note → Link verse → Add tags → Save | `BibleStudyTools.tsx`, `EnhancedNoteModal.tsx`, `NoteCreationModal.tsx` (referenced in docs, may need verification), NotesManager component (referenced) | `GET /api/bible/notes`, `POST /api/bible/notes`, `PUT /api/bible/notes`, `DELETE /api/bible/notes/[noteId]`, `GET /api/bible/notes/search`, `GET /api/bible/notes/history` | **Explorer**: 5 notes/week (20/month)<br>**Student+**: Unlimited notes | Inline verse previews. Rich text input with tag autocomplete. Categories, colors, visibility settings. Notes integrated into Bible interface via BibleStudyTools component |
| **Note Editor** | Create/edit note → Link verse → Add tags → Save | `EnhancedNoteModal.tsx`, `NoteCreationModal.tsx` | `POST /api/bible/notes`, `PUT /api/bible/notes`, `GET /api/bible/notes/[noteId]` | Based on note quota per tier | Rich text editor. Tag autocomplete. Verse linking. Template system (Study, Sermon, Devotional, Apologetics). Color coding |
| **Mood Verse** | Select mood → Get AI-suggested verse | `MoodVerseSystem.tsx` (referenced, may need implementation) | Likely `/api/bible/mood-verse` (needs server route) | **Scholar+** only (if uses premium AI API) | Mood wheel selector with emoji icons. Not fully implemented yet |
| **Insights History** | View saved insights → Filter by passage/theme → Search → View analytics → Export | `InsightsHistory.tsx`, `EnhancedInsightsQuery.tsx`, `InsightsAnalytics.tsx`, `InsightDetailView.tsx` | `GET /api/ai-insights/history`, `GET /api/ai-insights/search`, `GET /api/ai-insights/statistics`, `GET /api/analytics`, `GET /api/ai-insights/[id]`, `POST /api/ai-insights/save`, `POST /api/ai-insights/feedback` | **All tiers** can view their own insights<br>**Analytics dashboard**: Staff/admin only (optional v1 mobile) | Card-based layout with passage reference, content snippet, tags, metadata. Filter modal for search by passage/theme/content. JSON/CSV export. Analytics dashboard with charts (InsightsAnalytics component). Refresh and Analytics buttons |
| **Churches** | Search location → Filter denomination → View results → Get directions | `ChurchFinder.tsx` (referenced) | `POST /api/churches/search` | **Explorer**: 5 searches/month<br>**Student+**: 50+ searches/month | Location-based search with Google Places API. Distance calculation. Church details and photos. Denomination filtering |
| **Settings** | Profile → Preferences → Subscription → Data Export | `UserProfile.tsx`, Settings screen in mobile only (`app/(tabs)/settings.tsx`) | `GET /api/subscriptions/status`, `GET /api/subscriptions/usage`, `POST /api/subscriptions/check-feature` | None for access, but subscription management gated | **Web**: UserProfile component (limited)<br>**Mobile**: Full settings screen with subscription, notifications, profile. Group sections with headers. Keep "Subscription" highlighted if Pro lapsed |
| **Profile** | Update name, email, password, verse defaults | `UserProfile.tsx`, `AuthModal.tsx`, `LoginForm.tsx`, `SignUpForm.tsx` | `/api/auth/signin`, `/api/auth/signup` (Supabase native auth) | None | Secure text for passwords. Supabase authentication integration |
| **Subscription** | View plans → Upgrade/downgrade → Payment → View usage → Payment history | `EnhancedSubscriptionModal.tsx`, `SubscriptionUsageDashboard.tsx`, `UpgradePrompt.tsx` (referenced in docs) | `GET /api/subscriptions/plans`, `GET /api/subscriptions/tiers`, `GET /api/subscriptions/status`, `POST /api/subscriptions/create`, `POST /api/subscriptions/cancel`, `POST /api/subscriptions/reactivate`, `GET /api/subscriptions/payments`, `GET /api/subscriptions/usage`, `POST /api/subscriptions/check-feature`, `POST /api/subscriptions/promo-code`, `POST /api/subscriptions/referral` | Pro features unlocked post-payment | **Tiers**: Explorer (Free Trial), Bible Student ($9.99/mo), Bible Scholar ($19.99/mo), Ministry ($49.99/mo). Integrate PaymentSheet/Stripe. Show usage progress bars. Enhanced subscription service with usage tracking |
| **Notifications Settings** | Toggle categories → Set times → DND | Settings screen (mobile) | `/api/notifications/preferences` (needs implementation) | None | RN Switch controls. Time picker for daily verse. Mobile-only feature currently |

---

## Key Changes from Original Wireframe

1. **Chat Modes**: Changed from "Fast/Accurate" to "Gentle/Scholarly/Debate" modes (matches actual implementation)
2. **Notes**: Not a separate tab; integrated into Bible interface via `BibleStudyTools` component
3. **Settings**: Web has limited `UserProfile`; full settings only in mobile app
4. **Subscription Tiers**: Actual tiers are Explorer (Free Trial), Bible Student, Bible Scholar, Ministry (not just Free/Pro)
5. **Insights**: Has dedicated page at `/insights-history` with full analytics dashboard
6. **API Endpoints**: Updated to match actual API routes found in `/pages/api`
7. **Components**: Updated component names to match actual files in repository
8. **Feature Gating**: Reflects actual limits from `enhanced-subscription-schema.sql`

---

## Navigation Structure

**Web App Main Navigation (Header.tsx)**:
- Home (`/`)
- Bible (`/bible`)
- Chat (`/chat`)
- Churches (`/churches`)
- Insights (`/insights-history`)

**Mobile App Tabs**:
- Chat (`app/(tabs)/index.tsx`)
- Bible (`app/(tabs)/bible.tsx`)
- Notes (`app/(tabs)/notes.tsx`)
- Church (`app/(tabs)/church.tsx`)
- Settings (`app/(tabs)/settings.tsx`)

---

## Subscription Tier Details

### Explorer (Free Trial - `basic`)
- 5 AI conversations per day (gentle mode only, 10/day)
- Basic Bible search (20 searches/day)
- 5 verse notes per week (20/month)
- Standard apologetics responses
- 1 export per month
- No cross-references, scholarly/debate modes

### Bible Student ($9.99/month - `student`)
- Unlimited AI conversations
- Gentle mode (20/day) + Scholarly mode (10/day)
- Advanced Bible search with cross-references (unlimited)
- Unlimited verse notes with templates
- Church finder with ratings (50 searches/month)
- Export study materials (10/month)
- Email support

### Bible Scholar ($19.99/month - `scholar`)
- Everything in Student +
- All modes unlimited (gentle, scholarly, debate enabled)
- Advanced apologetics knowledge base
- Mood-based verse recommendations
- Collaboration features
- Priority support
- Advanced analytics
- API access (1,000 calls/month)
- Max 3 team members

### Ministry ($49.99/month - `ministry`)
- Everything in Scholar +
- Multi-user accounts (up to 25 team members)
- Sermon preparation tools
- Bulk note management
- White-label options
- Advanced church finder
- Dedicated support
- API access (5,000 calls/month)
- Custom integrations

---

## API Endpoint Summary

### Chat & Conversations
- `POST /api/chat` - Main chat endpoint with streaming
- `GET /api/conversations` - List conversations
- `GET /api/conversations/[id]` - Get conversation messages
- `GET /api/messages` - Get messages by conversation ID
- `POST /api/conversations/track-interaction` - Track message interactions

### Bible
- `GET /api/bible/versions` - Available Bible versions
- `GET /api/bible/search` - Basic Bible search
- `GET /api/bible/advanced-search` - Advanced search with filters
- `GET /api/bible/passage` - Get specific passage
- `GET /api/bible/popular` - Popular verses
- `GET /api/bible/daily-verse` - Daily verse
- `GET /api/bible/cross-references` - Cross-references
- `GET /api/bible/concordance` - Concordance search
- `GET /api/bible/context` - Verse context
- `GET /api/bible/study-questions` - Generate study questions
- `POST /api/bible/ai-insights` - Generate AI insights
- `GET /api/bible/preferences` - User Bible preferences

### Notes
- `GET /api/bible/notes` - List notes (with filters)
- `POST /api/bible/notes` - Create note
- `PUT /api/bible/notes` - Update note
- `DELETE /api/bible/notes/[noteId]` - Delete note
- `GET /api/bible/notes/search` - Search notes
- `GET /api/bible/notes/history` - Note history

### AI Insights
- `GET /api/ai-insights/history` - Get saved insights
- `POST /api/ai-insights/save` - Save insight
- `GET /api/ai-insights/statistics` - Insight statistics
- `GET /api/ai-insights/search` - Search insights
- `POST /api/ai-insights/feedback` - Submit feedback
- `POST /api/ai-insights/interactions` - Track interactions

### Subscriptions
- `GET /api/subscriptions/plans` - Available plans
- `GET /api/subscriptions/tiers` - Subscription tiers with limits
- `GET /api/subscriptions/status` - User subscription status
- `POST /api/subscriptions/create` - Create subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/reactivate` - Reactivate subscription
- `GET /api/subscriptions/usage` - Usage metrics
- `POST /api/subscriptions/check-feature` - Check feature access
- `POST /api/subscriptions/promo-code` - Apply promo code
- `POST /api/subscriptions/referral` - Process referral
- `GET /api/subscriptions/payments` - Payment history

### Churches
- `POST /api/churches/search` - Search for churches

### Analytics
- `GET /api/analytics` - General analytics
- `GET /api/analytics/conversations` - Conversation analytics

---

## Component File Locations

**Chat Components**:
- `src/apps/web/components/features/chat/Chat.tsx`
- `src/apps/web/components/features/chat/EnhancedMessage.tsx`

**Bible Components**:
- `src/apps/web/components/features/bible/Bible.tsx`
- `src/apps/web/components/features/bible/UltimateBibleInterface.tsx`
- `src/apps/web/components/features/bible/EnhancedBibleInterface.tsx`
- `src/apps/web/components/features/bible/BibleSearch.tsx`
- `src/apps/web/components/features/bible/AIBibleInsights.tsx`
- `src/apps/web/components/features/bible/AIStudyQuestions.tsx`
- `src/apps/web/components/features/bible/AICrossReferences.tsx`
- `src/apps/web/components/features/bible/MobileBibleNavigation.tsx`
- `src/apps/web/components/features/bible/EnhancedBibleNavigation.tsx`

**Insights Components**:
- `src/apps/web/components/features/bible/InsightsHistory.tsx`
- `src/apps/web/components/features/bible/EnhancedInsightsQuery.tsx`
- `src/apps/web/components/features/bible/InsightsAnalytics.tsx`
- `src/apps/web/components/features/bible/InsightDetailView.tsx`

**Auth/Settings**:
- `src/apps/web/components/auth/UserProfile.tsx`
- `src/apps/web/components/auth/LoginForm.tsx`
- `src/apps/web/components/auth/SignUpForm.tsx`

**Layout**:
- `src/apps/web/components/Header.tsx`
- `src/apps/web/components/Footer.tsx`
- `src/apps/web/components/layout/Header.tsx`
- `src/apps/web/components/layout/Footer.tsx`

---

*Generated based on repository analysis - Last updated: Based on current codebase state*

