# 🛡️ Shield AI

An AI-powered apologetics companion designed to help believers, seekers, and faith leaders explore and defend the Christian worldview. Built with a sleek and minimalist interface inspired by Grok, Shield AI provides conversational, context-rich answers to challenging theological, philosophical, and cultural questions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)
- Vercel account (for deployment)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Will-Langhart/shieldai.git
   cd shieldai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # Bible API Configuration
   BIBLE_API_KEY=your_bible_api_key
   BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1
   
   # Google Places API (for church finder)
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
   ```

4. **Set up the database:**
   ```bash
   # Run the database setup scripts
   npm run setup:db
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🎨 Features

### 🤖 Core AI Features
- **Conversational AI**: Interactive chat with context-aware responses
- **Fast/Accurate Mode Toggle**: Choose between quick responses or detailed analysis
- **Voice Input**: Microphone support for hands-free interaction
- **Real-time Chat**: Interactive conversation with AI
- **Conversation History**: Save and manage your chat sessions

### 📖 Bible Study Suite
- **Advanced Bible Search**: Search across multiple translations
- **Verse Comparison**: Compare verses across different Bible versions
- **Study Tools**: Concordance, cross-references, and study notes
- **Auto-save Notes**: Automatic saving of study notes as you type
- **Tag System**: Organize notes with custom tags
- **Search History**: Track and review your Bible searches
- **Favorite Verses**: Save and manage your favorite Bible verses

### 🏛️ Church Finder
- **Location-based Search**: Find churches near you
- **Advanced Filtering**: Filter by denomination, size, and services
- **Interactive Map**: Visual church locations
- **Contact Information**: Direct access to church details


- **Mood Verse System**: Get personalized Bible verses based on your mood

### 🔐 Authentication & User Management
- **Secure Authentication**: Supabase-powered user management
- **Profile Management**: Update personal information and preferences
- **Subscription System**: Premium features with Stripe integration
- **Data Export**: Download your conversation history

### 🎨 User Interface
- **Dark Mode Interface**: Clean, distraction-free design
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: WCAG compliant design
- **Custom Theme System**: Light, dark, and auto modes

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context + Supabase
- **Forms**: React Hook Form

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4
- **Payments**: Stripe
- **Maps**: Google Places API
- **Bible API**: API.Bible

### Development Tools
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **Deployment**: Vercel
- **Version Control**: Git

## 📁 Project Structure

```
shieldai/
├── architecture.txt
├── components/
│   ├── AdminPanel.tsx
│   ├── AdvancedBibleSearch.tsx
│   ├── AnalyticsDashboard.tsx
│   ├── ApologeticsBible.tsx
│   ├── AuthModal.tsx
│   ├── BibleSearch.tsx
│   ├── BibleStudyTools.tsx
│   ├── BibleVerse.tsx
│   ├── ChurchFinder.tsx
│   ├── ConversationHistory.tsx
│   ├── EnhancedBibleInterface.tsx
│   ├── EnhancedBibleSearch.tsx
│   ├── EnhancedChurchFinder.tsx
│   ├── EnhancedNoteModal.tsx
│   ├── EnhancedSubscriptionModal.tsx
│   ├── FilterModal.tsx
│   ├── Header.tsx
│   ├── InputBar.tsx
│   ├── LanguageSelector.tsx
│   ├── LocationServicesTrigger.tsx
│   ├── MemoryInsights.tsx
│   ├── MessageActions.tsx
│   ├── MessageRenderer.tsx
│   ├── MobileMessage.tsx
│   ├── MobileNavigation.tsx
│   ├── MoodVerseSystem.tsx
│   ├── NoteCreationModal.tsx
│   ├── NotesManager.tsx
│   ├── SubscriptionModal.tsx
│   ├── SubscriptionStatus.tsx
│   ├── SubscriptionUsageDashboard.tsx
│   ├── UpgradePrompt.tsx
│   ├── UserSettings.tsx
│   └── VerseComparison.tsx
├── database/
│   ├── bible-notes.sql
│   ├── enhanced-bible-notes.sql
│   ├── enhanced-subscription-schema.sql
│   ├── fix-enum-additions.sql
│   └── schema.sql
├── docs/
│   ├── api/
│   │   ├── API_INTEGRATION_GUIDE.md
│   │   ├── API_INTEGRATION_STATUS.md
│   │   ├── FRONTEND_INTEGRATION_SUMMARY.md
│   │   ├── GOOGLE_PLACES_API_KEY_FIX.md
│   │   ├── GOOGLE_PLACES_SETUP.md
│   │   └── README.md
│   ├── architecture/
│   │   ├── README.md
│   │   └── SHIELD_AI_PROJECT_OVERVIEW.md
│   ├── deployment/
│   │   ├── DEPLOYMENT.md
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   ├── README.md
│   │   └── VERCEL_DEPLOYMENT.md
│   ├── DOCUMENTATION_INDEX.md
│   ├── features/
│   │   ├── BIBLE_API_INTEGRATION.md
│   │   ├── BIBLE_FEATURE_ENHANCEMENT.md
│   │   ├── BIBLE_NOTES_ENHANCEMENT_SUMMARY.md
│   │   ├── BIBLE_UI_INTEGRATION_SUMMARY.md
│   │   ├── ENHANCED_BIBLE_NOTES_FEATURES.md
│   │   ├── ENHANCED_NOTES_SUMMARY.md
│   │   ├── GAMIFICATION_FEATURES.md
│   │   ├── MEMORY_SYSTEM.md
│   │   ├── README.md
│   │   └── SETTINGS_ENHANCEMENT_SUMMARY.md
│   ├── README.md
│   └── setup/
│       ├── CHURCH_FINDER_SETUP.md
│       ├── ENHANCED_BIBLE_NOTES_FIXES.md
│       ├── ENHANCED_BIBLE_NOTES_IMMUTABLE_FIX.md
│       ├── ENHANCED_SUBSCRIPTION_ENUM_FIX.md
│       ├── ENHANCED_SUBSCRIPTION_SETUP.md
│       ├── GOOGLE_PLACES_SETUP.md
│       ├── PINECONE_SETUP.md
│       ├── README.md
│       ├── SETUP.md
│       ├── STRIPE_SETUP.md
│       └── SUPABASE_SETUP.md
├── env.example
├── lib/
│   ├── advanced-prompts.ts
│   ├── ai-church-assistant.ts
│   ├── ai-church-recommendations.ts
│   ├── analytics-service.ts
│   ├── api-integration-hooks.ts
│   ├── apologetics-knowledge.ts
│   ├── auth-context.tsx
│   ├── auth.ts
│   ├── bible-fallback-service.ts
│   ├── bible-service.ts
│   ├── chat-service.ts
│   ├── church-finder-service.ts
│   ├── client-service.ts
│   ├── embeddings.ts
│   ├── enhanced-stripe-service.ts
│   ├── gesture-service.ts
│   ├── memory-service.ts
│   ├── multilingual-service.ts
│   ├── multilingual-service.ts.backup
│   ├── notification-service.ts
│   ├── objection-classifier.ts
│   ├── pinecone.ts
│   ├── prompt-engineering.ts
│   ├── stripe.ts
│   ├── subscription-middleware.tsx
│   └── supabase.ts
├── logs/
│   ├── README.md
│   ├── api-integration-results.json
│   ├── debug/
│   ├── npm/
│   ├── server/
│   └── vercel/
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── api/
│   │   ├── analytics.ts
│   │   ├── auth/
│   │   │   ├── signin.ts
│   │   │   └── signup.ts
│   │   ├── bible/
│   │   │   ├── advanced-search.ts
│   │   │   ├── apologetics.ts
│   │   │   ├── concordance.ts
│   │   │   ├── context.ts
│   │   │   ├── cross-references.ts
│   │   │   ├── crossrefs.ts
│   │   │   ├── daily-verse.ts
│   │   │   ├── notes/
│   │   │   │   ├── [noteId].ts
│   │   │   │   ├── history.ts
│   │   │   │   └── search.ts
│   │   │   ├── notes.ts
│   │   │   ├── passage.ts
│   │   │   ├── popular.ts
│   │   │   ├── preferences.ts
│   │   │   ├── search.ts
│   │   │   ├── suggestions.ts
│   │   │   └── versions.ts
│   │   ├── chat.ts
│   │   ├── churches/
│   │   │   └── search.ts
│   │   ├── conversations.ts
│   │   ├── feedback.ts
│   │   ├── geocode/
│   │   │   └── autocomplete.ts
│   │   ├── geocode.ts
│   │   ├── health.ts
│   │   ├── memory/
│   │   │   ├── search.ts
│   │   │   └── stats.ts
│   │   ├── messages.ts
│   │   ├── pinecone/
│   │   │   ├── env.ts
│   │   │   ├── indexes.ts
│   │   │   ├── seed.ts
│   │   │   ├── stats.ts
│   │   │   └── test-key.ts
│   │   ├── subscriptions/
│   │   │   ├── cancel.ts
│   │   │   ├── check-feature.ts
│   │   │   ├── create.ts
│   │   │   ├── payments.ts
│   │   │   ├── plans.ts
│   │   │   ├── promo-code.ts
│   │   │   ├── reactivate.ts
│   │   │   ├── referral.ts
│   │   │   ├── status.ts
│   │   │   ├── tiers.ts
│   │   │   └── usage.ts
│   │   ├── test-api-integration.ts
│   │   ├── test-db.ts
│   │   ├── test-pinecone.ts
│   │   └── webhooks/
│   │       └── stripe.ts
│   ├── chat/
│   │   └── [conversationId].tsx
│   ├── index.tsx
│   ├── test-bible-api.tsx
│   ├── test-bible-enhancements.tsx
│   ├── test-bible-notes.tsx
│   ├── test-church-api.tsx
│   ├── test-church-finder.tsx
│   ├── test-memory.tsx
│   ├── test-notes-button.tsx
│   └── test.tsx
├── postcss.config.js
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   ├── logo.svg
│   ├── manifest.json
│   ├── robots.txt
│   └── sw.js
├── README.md
├── scripts/
│   ├── check-pinecone-env.js
│   ├── create-index-simple.js
│   ├── setup-api-verification.sh
│   ├── setup-pinecone-index.js
│   ├── test-create-index.js
│   ├── update-env.js
│   ├── update-personal-pinecone.js
│   ├── verify-api-integration.js
│   └── verify-pinecone.js
├── setup-bible-api.sh
├── setup-bible-enhancements.sh
├── setup-database.sql
├── setup-github.sh
├── setup-storage.sql
├── styles/
│   └── globals.css
├── tailwind.config.js
├── tsconfig.json
├── types/
│   └── notes.ts
├── utils/
│   └── env.ts
└── vercel.json
```

## 🎨 Design System

### Colors
- **Background**: `#000000` (Shield Black)
- **Text**: `#FFFFFF` (Shield White)  
- **Accent**: `#46A1E2` (Shield Blue)
- **Gray**: `#1a1a1a` (Shield Gray)
- **Light Gray**: `#2a2a2a` (Shield Light Gray)
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Yellow)
- **Error**: `#EF4444` (Red)

### Typography
- **Font Family**: Inter
- **Weights**: 300, 400, 500, 600, 700
- **Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 32px

### Components
- **Buttons**: Consistent styling with hover states
- **Cards**: Rounded corners with subtle shadows
- **Modals**: Backdrop blur with smooth animations
- **Forms**: Clean input fields with validation

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server (port 3001)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup:db` - Set up database tables

### Environment Setup

1. **Supabase Setup:**
   - Create a new Supabase project
   - Run the database schema scripts
   - Configure Row Level Security (RLS)

2. **Stripe Setup:**
   - Create a Stripe account
   - Configure webhook endpoints
   - Set up subscription products

3. **OpenAI Setup:**
   - Get API key from OpenAI
   - Configure usage limits

4. **Bible API Setup:**
   - Register at API.Bible
   - Get API key for Bible features

### Adding New Features

1. **Create component** in `components/` directory
2. **Add API route** in `pages/api/` if needed
3. **Update database schema** if required
4. **Add to navigation** in Header.tsx
5. **Update documentation** in README.md

## 🚀 Deployment

### Vercel Git Integration (Automated)

This project uses **Vercel's native Git integration** for automatic deployments:

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **Automatic deployment:**
   - Vercel automatically detects changes
   - Builds and deploys your application
   - Updates your production URL

3. **Preview deployments:**
   - Pull requests get automatic preview deployments
   - Test changes before merging

**Note:** GitHub Actions CI/CD has been removed to simplify the deployment process and avoid conflicts.

### Environment Variables for Production

Ensure all environment variables are set in Vercel:
- Supabase configuration
- OpenAI API key
- Stripe keys
- Bible API key
- Google Places API key

### Database Migration

1. **Run schema updates:**
   ```sql
   -- Execute database/schema.sql
   -- Execute database/bible-notes.sql
   ```

2. **Verify RLS policies** are active
3. **Test authentication** flow
4. **Verify payment processing**

## 📱 Mobile (iOS) App and Monorepo Plan

We are expanding Shield AI to a native iOS app built with Expo (React Native), while keeping the existing Next.js web app. The goal is to share TypeScript services and types across web and mobile and keep all secrets server-side.

### Monorepo layout (planned)

```text
shieldai/
├── apps/
│   ├── web/            # Existing Next.js app (current repo content will be moved here)
│   └── mobile/         # New Expo (React Native) app
└── packages/
    ├── services/       # Isomorphic client services (fetch-only)
    ├── types/          # Shared TypeScript types / API contracts
    ├── ui/             # Optional: shared UI primitives (react-native + react-native-web)
    └── config/         # Shared tsconfig/eslint/babel
```

Root workspaces (planned):

```json
{
  "name": "shieldai",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

Key principles:
- Mobile uses Supabase for auth; sends `Authorization: Bearer <supabaseAccessToken>` to server APIs.
- Mobile never ships secrets (OpenAI, Stripe secret, Pinecone). All sensitive work stays in `apps/web/pages/api/**`.
- Shared client-safe services (Bible, Chat, Church Finder helpers, etc.) live in `packages/services` and call our APIs.

### Mobile screens (scope)

- **Chat**
  - Conversation list, chat detail, composer with Fast/Accurate toggle
  - Endpoints: `POST /api/chat`, Supabase tables for conversations/messages via server services
  - Gating: Accurate mode and daily limits checked via `/api/subscriptions/usage` and feature checks

- **Bible**
  - Versions, search, passage reader, context/cross-references, daily verse
  - Endpoints: `/api/bible/versions`, `/api/bible/popular`, `/api/bible/daily-verse`, `/api/bible/passage`, `/api/bible/search`, `/api/bible/concordance`, `/api/bible/cross-references`, `/api/bible/context`, `/api/bible/crossrefs`

- **Notes**
  - Notes list, editor (linked to verses), tags, history, search
  - Endpoints: `/api/bible/notes` (CRUD), `/api/bible/notes/history`, `/api/bible/notes/search`

- **Church Finder**
  - Location/radius/denomination search, list/map view, church details
  - Endpoints: `POST /api/churches/search`, `POST /api/geocode`, `GET /api/geocode/autocomplete`

- **Settings**
  - Profile, preferences (language/theme/version), notifications, subscription, data export
  - Endpoints: `/api/subscriptions/plans`, `/api/subscriptions/status`, `/api/subscriptions/create`, `/api/subscriptions/cancel`, `/api/subscriptions/reactivate`, `/api/subscriptions/payments`, `/api/subscriptions/usage`, `/api/subscriptions/tiers`

### Push notifications (Expo)

- Categories: daily prayer/verse, biblical motivation, chat reminders/summaries, church reminders, subscription usage/status
- Device registration: mobile obtains Expo push token → `POST /api/notifications/register { expoPushToken, deviceInfo }` (to be added)
- Scheduling: Vercel cron jobs trigger server tasks to send via Expo Push API per user preferences
- Preferences: stored in Supabase (per-user settings) and managed in Settings → Notifications
- Content sources: daily verse (`/api/bible/daily-verse`), curated prompts or AI-assisted devotionals, chat summaries (server-side only)

### API usage from mobile (summary)

- Auth: Supabase in-app auth. Use Supabase access token as Bearer across APIs
- Chat: `POST /api/chat` with `{ message, mode, sessionId?, conversationId? }`
- Bible: versions/popular/daily-verse/passage/search/context/cross-refs endpoints as listed above
- Notes: `/api/bible/notes*` endpoints
- Church Finder: `/api/churches/search`, geocode endpoints
- Memory: `/api/memory/search`, `/api/memory/stats`
- Subscriptions: `/api/subscriptions/plans|create|status|usage|payments|tiers|cancel|reactivate`

### Environment (mobile + server)

- App (public; set in Expo):
  - `EXPO_PUBLIC_API_BASE_URL` (e.g., your Vercel deployment URL)
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Server-only (Vercel):
  - Continue existing secrets (OpenAI/Stripe/Pinecone/Bible)
  - Add `GOOGLE_PLACES_SERVER_API_KEY` and update server endpoints to use this instead of `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` when running on the server

### Branching and PR plan

1. Create integration branch from `prod`: `feat/monorepo-mobile-from-prod`
2. PR 1: Restructure to monorepo (move current app to `apps/web`, add workspaces and base tsconfig)
3. PR 2: Scaffold `apps/mobile` (Expo), metro config for monorepo, health-check screen calling `/api/health`
4. PR 3: Extract client-safe services from `lib/` to `packages/services`, add `packages/types`
5. PR 4+: Implement screens incrementally (Chat, Bible, Notes, Church Finder, Subscriptions)

### Build and run (after monorepo migration)

- Install deps from repo root: `npm install`
- Web: `npm run --workspace apps/web dev`
- Mobile: `npm run --workspace apps/mobile start` (Expo), or `cd apps/mobile && npx expo start`
- iOS build (EAS): `eas build -p ios --profile production`


## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Follow TypeScript conventions
   - Add proper error handling
   - Include tests if applicable

4. **Test thoroughly:**
   - Test on different devices
   - Verify all features work
   - Check for accessibility issues

5. **Submit a pull request:**
   - Include detailed description
   - Add screenshots if UI changes
   - Reference any related issues

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow linting rules
- **Prettier**: Consistent formatting
- **Comments**: Document complex logic
- **Error Handling**: Graceful error management

## 📊 Analytics & Monitoring

### User Analytics
- **Conversation tracking**: Monitor chat usage
- **Feature adoption**: Track Bible study usage
- **Performance metrics**: Response times and errors

### Error Monitoring
- **Client-side errors**: JavaScript exceptions
- **API errors**: Server-side issues
- **Payment errors**: Stripe integration issues

## 🔒 Security

### Data Protection
- **User data**: Encrypted at rest
- **API keys**: Secure environment variables
- **Authentication**: Supabase security best practices
- **Payments**: PCI compliant via Stripe

### Privacy
- **GDPR compliance**: User data controls
- **Data retention**: Configurable policies
- **Export rights**: User data download
- **Deletion rights**: Account removal

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for AI capabilities
- **Supabase** for backend infrastructure
- **Stripe** for payment processing
- **API.Bible** for Bible content
- **Google Places** for church data
- **Vercel** for deployment platform

---

**Shield AI** - Empowering believers with AI-powered apologetics insights and comprehensive Bible study tools.

*Built with ❤️ for the Christian community*

---

## 📱 iOS Build Blueprint (Expo + Monorepo)

See `docs/deployment/IOS_BUILD_BLUEPRINT.md` for the full mobile plan, API contracts, screens, notifications, env setup, and branching strategy.