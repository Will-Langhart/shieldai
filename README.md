# Shield AI - Multi-Platform Bible Study Application

A comprehensive Bible study platform with AI-powered insights, available across web, mobile, and admin interfaces.

## 🏗️ Project Structure

```
shieldai/
├── .DS_Store                        # macOS system file
├── .cache-bust                      # Cache busting file
├── .env                             # Environment variables
├── .eslintrc.json                   # ESLint configuration
├── .git/                            # Git repository
├── .github/                         # GitHub workflows
├── .vercel/                         # Vercel deployment cache
│   ├── README.txt                   # Vercel README
│   └── project.json                 # Vercel project config
├── package.json                     # Root package configuration
├── package-lock.json                # Package lock file
├── README.md                        # Project documentation
└── vercel.json                      # Vercel deployment config
└── src/                             # ALL source code and configuration
    ├── apps/                        # Applications
    │   ├── web/                     # Next.js web app (main)
    │   │   ├── .conversation-storage.json # Conversation storage
    │   │   ├── .env                 # Web app environment
    │   │   ├── .env.local.backup    # Environment backup
    │   │   ├── .vercel/             # Vercel web app config
    │   │   │   ├── README.txt       # Vercel README
    │   │   │   └── project.json     # Vercel project config
    │   │   ├── components/          # React components
    │   │   │   ├── auth/            # Authentication components
    │   │   │   │   ├── LoginForm.tsx
    │   │   │   │   ├── SignUpForm.tsx
    │   │   │   │   └── UserProfile.tsx
    │   │   │   ├── common/          # Common UI components
    │   │   │   │   ├── ErrorBoundary.tsx
    │   │   │   │   ├── LoadingSpinner.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── features/        # Feature-specific components
    │   │   │   │   ├── bible/       # Bible study components
    │   │   │   │   │   ├── AIBibleInsights.tsx
    │   │   │   │   │   ├── AICrossReferences.tsx
    │   │   │   │   │   ├── AIDiagnostics.tsx
    │   │   │   │   │   ├── AIStudyQuestions.tsx
    │   │   │   │   │   ├── Bible.tsx
    │   │   │   │   │   ├── BibleBreadcrumbs.tsx
    │   │   │   │   │   ├── BibleReader.tsx
    │   │   │   │   │   ├── BibleSearch.tsx
    │   │   │   │   │   ├── EnhancedBibleInterface.tsx
    │   │   │   │   │   ├── EnhancedBibleNavigation.tsx
    │   │   │   │   │   ├── InsightsHistory.tsx
    │   │   │   │   │   ├── MobileBibleNavigation.tsx
    │   │   │   │   │   ├── QuickNavigation.tsx
    │   │   │   │   │   ├── SmartTextSelection.tsx
    │   │   │   │   │   ├── UltimateBibleInterface.tsx
    │   │   │   │   │   └── index.ts
    │   │   │   │   └── chat/        # Chat components
    │   │   │   │       └── Chat.tsx
    │   │   │   ├── layout/          # Layout components
    │   │   │   │   ├── Footer.tsx
    │   │   │   │   ├── Header.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── ui/              # UI components
    │   │   │   │   ├── Button.tsx
    │   │   │   │   ├── Input.tsx
    │   │   │   │   ├── Modal.tsx
    │   │   │   │   └── index.ts
    │   │   │   ├── Footer.tsx       # Root footer component
    │   │   │   └── Header.tsx       # Root header component
    │   │   ├── contexts/            # React contexts
    │   │   │   ├── AuthContext.tsx
    │   │   │   ├── ThemeContext.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/               # Custom React hooks
    │   │   │   ├── useApi.ts
    │   │   │   ├── useBibleNavigation.ts
    │   │   │   └── useLocalStorage.ts
    │   │   ├── lib/                 # Library functions
    │   │   │   ├── advanced-prompts.ts
    │   │   │   ├── ai-church-assistant.ts
    │   │   │   ├── ai-church-recommendations.ts
    │   │   │   ├── analytics-service.ts
    │   │   │   ├── api-integration-hooks.ts
    │   │   │   ├── apologetics-knowledge.ts
    │   │   │   ├── auth-context.tsx
    │   │   │   ├── auth.ts
    │   │   │   ├── bible-fallback-service.ts
    │   │   │   ├── bible-pinecone.ts
    │   │   │   ├── bible-service.ts
    │   │   │   ├── chat-service.ts
    │   │   │   ├── church-finder-service.ts
    │   │   │   ├── client-service.ts
    │   │   │   ├── conversation-storage.ts
    │   │   │   ├── dev-logging-config.ts
    │   │   │   ├── embeddings.ts
    │   │   │   ├── enhanced-prompt-engineering.ts.backup
    │   │   │   ├── enhanced-stripe-service.ts
    │   │   │   ├── gesture-service.ts
    │   │   │   ├── image-generation.ts
    │   │   │   ├── insights-pinecone.ts
    │   │   │   ├── logger.ts
    │   │   │   ├── memory-service.ts
    │   │   │   ├── multilingual-service.ts
    │   │   │   ├── multilingual-service.ts.backup
    │   │   │   ├── notification-service.ts
    │   │   │   ├── objection-classifier.ts
    │   │   │   ├── pinecone-direct.ts
    │   │   │   ├── pinecone.ts
    │   │   │   ├── prompt-engineering.ts
    │   │   │   ├── reference-utils.ts
    │   │   │   ├── stripe.ts
    │   │   │   ├── subscription-middleware.tsx
    │   │   │   ├── supabase.ts
    │   │   │   ├── video-client-service.ts
    │   │   │   └── video-service.ts
    │   │   ├── logs/                # Development logs
    │   │   │   └── dev/             # Daily dev logs
    │   │   │       ├── 2025-09-07.log
    │   │   │       ├── 2025-09-08.log
    │   │   │       ├── 2025-09-09.log
    │   │   │       ├── 2025-09-10.log
    │   │   │       ├── 2025-09-11.log
    │   │   │       ├── 2025-09-12.log
    │   │   │       ├── 2025-09-14.log
    │   │   │       ├── 2025-09-15.log
    │   │   │       ├── 2025-09-16.log
    │   │   │       ├── 2025-09-17.log
    │   │   │       └── 2025-09-18.log
    │   │   ├── pages/               # Next.js pages
    │   │   │   ├── api/             # API routes
    │   │   │   │   ├── ai-insights/ # AI insights API
    │   │   │   │   │   ├── by-passage-pinecone.ts
    │   │   │   │   │   ├── by-passage.ts
    │   │   │   │   │   ├── delete.ts
    │   │   │   │   │   ├── feedback.ts
    │   │   │   │   │   ├── generate-image.ts
    │   │   │   │   │   ├── history.ts
    │   │   │   │   │   ├── interactions.ts
    │   │   │   │   │   ├── recommendations.ts
    │   │   │   │   │   ├── responses.ts
    │   │   │   │   │   ├── save.ts
    │   │   │   │   │   ├── search-pinecone.ts
    │   │   │   │   │   ├── search.ts
    │   │   │   │   │   ├── statistics.ts
    │   │   │   │   │   └── update.ts
    │   │   │   │   ├── auth/        # Authentication API
    │   │   │   │   │   ├── signin.ts
    │   │   │   │   │   └── signup.ts
    │   │   │   │   ├── bible/       # Bible API
    │   │   │   │   │   ├── advanced-search.ts
    │   │   │   │   │   ├── ai-insights.ts
    │   │   │   │   │   ├── apologetics.ts
    │   │   │   │   │   ├── concordance.ts
    │   │   │   │   │   ├── context.ts
    │   │   │   │   │   ├── cross-references.ts
    │   │   │   │   │   ├── crossrefs.ts
    │   │   │   │   │   ├── daily-verse.ts
    │   │   │   │   │   ├── favorites.ts
    │   │   │   │   │   ├── history.ts
    │   │   │   │   │   ├── notes.ts
    │   │   │   │   │   ├── notes/[noteId].ts
    │   │   │   │   │   ├── notes/history.ts
    │   │   │   │   │   ├── notes/search.ts
    │   │   │   │   │   ├── passage.ts
    │   │   │   │   │   ├── plan-steps.ts
    │   │   │   │   │   ├── plans.ts
    │   │   │   │   │   ├── popular.ts
    │   │   │   │   │   ├── preferences.ts
    │   │   │   │   │   ├── search.ts
    │   │   │   │   │   ├── study-questions.ts
    │   │   │   │   │   ├── suggestions.ts
    │   │   │   │   │   ├── test-ai-insights.ts
    │   │   │   │   │   └── versions.ts
    │   │   │   │   ├── churches/    # Church finder API
    │   │   │   │   │   └── search.ts
    │   │   │   │   ├── memory/      # Memory API
    │   │   │   │   │   ├── search.ts
    │   │   │   │   │   └── stats.ts
    │   │   │   │   ├── notifications/ # Notifications API
    │   │   │   │   │   └── register.ts
    │   │   │   │   ├── pinecone/    # Pinecone API
    │   │   │   │   │   ├── admin.ts
    │   │   │   │   │   ├── bible-import.ts
    │   │   │   │   │   ├── env.ts
    │   │   │   │   │   ├── indexes.ts
    │   │   │   │   │   ├── memory.ts
    │   │   │   │   │   ├── seed.ts
    │   │   │   │   │   ├── stats.ts
    │   │   │   │   │   └── test-key.ts
    │   │   │   │   ├── subscriptions/ # Subscription API
    │   │   │   │   │   ├── cancel.ts
    │   │   │   │   │   ├── check-feature.ts
    │   │   │   │   │   ├── create.ts
    │   │   │   │   │   ├── payments.ts
    │   │   │   │   │   ├── plans.ts
    │   │   │   │   │   ├── promo-code.ts
    │   │   │   │   │   ├── reactivate.ts
    │   │   │   │   │   ├── referral.ts
    │   │   │   │   │   ├── status.ts
    │   │   │   │   │   ├── tiers.ts
    │   │   │   │   │   └── usage.ts
    │   │   │   │   ├── videos/      # Video API
    │   │   │   │   │   └── search.ts
    │   │   │   │   ├── webhooks/    # Webhook handlers
    │   │   │   │   │   └── stripe.ts
    │   │   │   │   ├── analytics.ts
    │   │   │   │   ├── chat-enhanced.ts.backup
    │   │   │   │   ├── chat-rag.ts
    │   │   │   │   ├── chat.ts
    │   │   │   │   ├── conversations.ts
    │   │   │   │   ├── conversations/[id].ts
    │   │   │   │   ├── feedback.ts
    │   │   │   │   ├── geocode.ts
    │   │   │   │   ├── geocode/autocomplete.ts
    │   │   │   │   ├── health.ts
    │   │   │   │   ├── messages.ts
    │   │   │   │   ├── test-api-integration.ts
    │   │   │   │   ├── test-db-schema.ts
    │   │   │   │   ├── test-db-simple.ts
    │   │   │   │   ├── test-enum-exists.ts
    │   │   │   │   ├── test-env.ts
    │   │   │   │   ├── test-insert.ts
    │   │   │   │   ├── test-pinecone.ts
    │   │   │   │   ├── test-rag.ts
    │   │   │   │   └── vector-response.ts
    │   │   │   ├── ChurchFinder.tsx
    │   │   │   ├── EmailConfirm.tsx
    │   │   │   ├── Home.tsx
    │   │   │   ├── _app.tsx
    │   │   │   ├── _document.tsx
    │   │   │   ├── bible.tsx
    │   │   │   ├── chat.tsx
    │   │   │   ├── churches.tsx
    │   │   │   ├── index.tsx
    │   │   │   └── insights-history.tsx
    │   │   ├── public/              # Static assets
    │   │   │   ├── browserconfig.xml
    │   │   │   ├── favicon-16x16.png
    │   │   │   ├── favicon-32x32.png
    │   │   │   ├── favicon-48x48.png
    │   │   │   ├── favicon.ico
    │   │   │   ├── icon-192x192.png
    │   │   │   ├── icon-512x512.png
    │   │   │   ├── logo.png
    │   │   │   ├── logo.svg
    │   │   │   ├── manifest.json
    │   │   │   ├── placeholder-video.jpg
    │   │   │   ├── robots.txt
    │   │   │   └── sw.js
    │   │   ├── services/            # Service layer
    │   │   │   ├── api.ts
    │   │   │   ├── bibleService.ts
    │   │   │   ├── chatService.ts
    │   │   │   ├── churchService.ts
    │   │   │   └── index.ts
    │   │   ├── styles/              # CSS styles
    │   │   │   ├── components.css
    │   │   │   ├── globals.css
    │   │   │   ├── landing.css
    │   │   │   └── utilities.css
    │   │   ├── types/               # TypeScript types
    │   │   │   ├── api.ts
    │   │   │   ├── bible.ts
    │   │   │   ├── chat.ts
    │   │   │   ├── church.ts
    │   │   │   └── index.ts
    │   │   ├── utils/               # Utility functions
    │   │   │   └── cn.ts
    │   │   ├── index.css            # Main CSS file
    │   │   ├── middleware.ts        # Next.js middleware
    │   │   ├── next.config.js       # Next.js configuration
    │   │   ├── package.json         # Web app dependencies
    │   │   ├── postcss.config.js    # PostCSS configuration
    │   │   ├── tailwind.config.js   # Tailwind CSS configuration
    │   │   ├── tsconfig.json        # TypeScript configuration
    │   │   ├── vercel.json          # Vercel web app config
    │   │   ├── vite-env.d.ts        # Vite environment types
    │   │   └── yarn.lock            # Yarn lock file
    │   └── mobile/                  # React Native mobile app
    │       ├── .expo/               # Expo configuration
    │       │   ├── README.md
    │       │   └── devices.json
    │       ├── app/                 # App screens
    │       │   ├── (tabs)/          # Tab navigation
    │       │   │   ├── _layout.tsx
    │       │   │   ├── bible.tsx
    │       │   │   ├── church.tsx
    │       │   │   ├── index.tsx
    │       │   │   ├── notes.tsx
    │       │   │   └── settings.tsx
    │       │   ├── +html.tsx
    │       │   ├── +not-found.tsx
    │       │   ├── _layout.tsx
    │       │   ├── auth.tsx
    │       │   └── modal.tsx
    │       ├── assets/              # Mobile assets
    │       │   ├── fonts/           # Font files
    │       │   │   └── SpaceMono-Regular.ttf
    │       │   └── images/          # Image assets
    │       │       ├── adaptive-icon.png
    │       │       ├── favicon.png
    │       │       ├── icon.png
    │       │       └── splash-icon.png
    │       ├── components/          # Mobile components
    │       │   ├── __tests__/       # Component tests
    │       │   │   └── StyledText-test.js
    │       │   ├── EditScreenInfo.tsx
    │       │   ├── ExternalLink.tsx
    │       │   ├── StyledText.tsx
    │       │   ├── Themed.tsx
    │       │   ├── useClientOnlyValue.ts
    │       │   ├── useClientOnlyValue.web.ts
    │       │   ├── useColorScheme.ts
    │       │   └── useColorScheme.web.ts
    │       ├── constants/           # App constants
    │       │   └── Colors.ts
    │       ├── contexts/            # Mobile contexts
    │       │   └── auth.tsx
    │       ├── utils/               # Mobile utilities
    │       │   └── supabase.ts
    │       ├── app.config.ts        # Expo configuration
    │       ├── app.json             # App configuration
    │       ├── babel.config.js      # Babel configuration
    │       ├── global.css           # Global styles
    │       ├── metro.config.js      # Metro bundler config
    │       ├── package.json         # Mobile dependencies
    │       ├── tailwind.config.js   # Tailwind CSS config
    │       └── tsconfig.json        # TypeScript configuration
    ├── backend/                     # Backend services
    │   ├── __init__.py
    │   ├── app.py                   # Main FastAPI application
    │   ├── base_server.py
    │   ├── exceptions.py
    │   ├── gunicorn.conf.py         # Gunicorn configuration
    │   ├── mcp_README.md            # MCP documentation
    │   ├── mcp_backend_mcp_init.py
    │   ├── mcp_config_init.py
    │   ├── mcp_config_logging_config.py
    │   ├── mcp_config_settings.py
    │   ├── mcp_middleware_auth.py
    │   ├── mcp_middleware_error_handling.py
    │   ├── mcp_middleware_init.py
    │   ├── mcp_middleware_rate_limiting.py
    │   ├── mcp_run_servers.py
    │   ├── mcp_schemas_bible_schemas.py
    │   ├── mcp_schemas_init.py
    │   ├── mcp_schemas_pinecone_schemas.py
    │   ├── mcp_schemas_supabase_schemas.py
    │   ├── mcp_services_bible_api_server.py
    │   ├── mcp_services_init.py
    │   ├── mcp_services_pinecone_server.py
    │   ├── mcp_services_supabase_server.py
    │   ├── mcp_tests_init.py
    │   ├── mcp_tests_test_base_server.py
    │   ├── requirements.txt         # Python dependencies
    │   └── utils.py
    ├── shared/                      # Shared code (flattened)
    │   ├── services/                # Shared services
    │   │   └── tsconfig.json
    │   ├── types/                   # Shared types
    │   │   └── tsconfig.json
    │   ├── services_index.ts        # Shared business logic
    │   ├── services_mobile-api.ts   # Mobile API services
    │   ├── services_package.json    # Services package config
    │   ├── types_index.ts           # Shared TypeScript types
    │   ├── types_package.json       # Types package config
    │   ├── ui_index.tsx             # Shared UI components
    │   └── ui_package.json          # UI package config
    ├── scripts/                     # All scripts and tests (flattened)
    │   ├── logs/                    # Application logs
    │   │   ├── api-integration-results.json
    │   │   ├── dev-web.out
    │   │   ├── dev-web.pid
    │   │   └── logs_README.md
    │   ├── tests/                   # Test files
    │   │   └── test_rag_integration.py
    │   ├── tests_integration_*.js   # Integration test files (20+ files)
    │   ├── tests_test-*.js          # Test files (4 files)
    │   ├── database_*.js            # Database scripts (7 files)
    │   ├── database_*.sh            # Database shell scripts (2 files)
    │   ├── deployment_*.sh          # Deployment scripts (2 files)
    │   ├── deployment_*.js          # Deployment verification (2 files)
    │   └── development_*.sh         # Development scripts (8 files)
    │   └── development_*.js         # Development utilities (8 files)
    ├── docs/                        # Documentation (flattened)
    │   ├── API_INTEGRATION_GUIDE.md
    │   ├── API_INTEGRATION_STATUS.md
    │   ├── BIBLE_API_INTEGRATION.md
    │   ├── BIBLE_FEATURE_ENHANCEMENT.md
    │   ├── BIBLE_NOTES_ENHANCEMENT_SUMMARY.md
    │   ├── BIBLE_UI_INTEGRATION_SUMMARY.md
    │   ├── CHURCH_FINDER_SETUP.md
    │   ├── CONVERSATION_PERSISTENCE.md
    │   ├── DEPLOYMENT.md
    │   ├── DEPLOYMENT_GUIDE.md
    │   ├── ENHANCED_BIBLE_NOTES_FEATURES.md
    │   ├── ENHANCED_BIBLE_NOTES_FIXES.md
    │   ├── ENHANCED_BIBLE_NOTES_IMMUTABLE_FIX.md
    │   ├── ENHANCED_NOTES_SUMMARY.md
    │   ├── ENHANCED_SUBSCRIPTION_ENUM_FIX.md
    │   ├── ENHANCED_SUBSCRIPTION_SETUP.md
    │   ├── ENHANCED_VIDEO_SERVICE.md
    │   ├── FRONTEND_INTEGRATION_SUMMARY.md
    │   ├── GAMIFICATION_FEATURES.md
    │   ├── GOOGLE_PLACES_API_KEY_FIX.md
    │   ├── GOOGLE_PLACES_SETUP.md
    │   ├── IOS_BUILD_BLUEPRINT.md
    │   ├── MEMORY_SYSTEM.md
    │   ├── PINECONE_MEMORY_INTEGRATION.md
    │   ├── PINECONE_SETUP.md
    │   ├── PINECONE_TROUBLESHOOTING.md
    │   ├── PROJECT_README.md
    │   ├── README.md
    │   ├── SETTINGS_ENHANCEMENT_SUMMARY.md
    │   ├── SETUP.md
    │   ├── SHIELD_AI_PROJECT_OVERVIEW.md
    │   ├── STRIPE_SETUP.md
    │   ├── SUPABASE_SETUP.md
    │   ├── VERCEL_DEPLOYMENT.md
    │   ├── VIDEO_INTEGRATION.md
    │   ├── VIDEO_INTEGRATION_SUMMARY.md
    │   ├── api_GOOGLE_PLACES_SETUP.md
    │   ├── api_README.md
    │   ├── architecture.txt
    │   ├── architecture_README.md
    │   ├── deployment_README.md
    │   ├── docs_DEVELOPMENT_LOGGING.md
    │   ├── docs_DOCUMENTATION_INDEX.md
    │   ├── docs_RAG_INTEGRATION.md
    │   ├── docs_vercel-auto-domain-sync.md
    │   ├── features_README.md
    │   └── setup_README.md
    ├── assets/                      # Static assets
    │   └── themes/                  # Color themes
    │       ├── _pinecone-color-theme.json
    │       ├── caffe-color-theme.json
    │       └── caffe-latte-color-theme.json
    └── config/                      # ALL configuration
        ├── .vercel/                 # Vercel config cache
        │   ├── README.txt
        │   └── project.json
        ├── env/                     # Environment files (gitignored)
        │   ├── .env.backup
        │   ├── .env.local
        │   ├── .env.local.backup
        │   ├── .env.local.old
        │   └── .env.test
        ├── migrations/              # Database migrations
        │   ├── add-user-id-to-messages.sql
        │   ├── add-video-storage.sql
        │   ├── ai-insights-schema.sql
        │   ├── bible-notes.sql
        │   ├── conversations-schema.sql
        │   ├── create-test-conversation.sql
        │   ├── create-test-user.sql
        │   ├── disable-rls-for-dev.sql
        │   ├── enhanced-analytics-schema.sql
        │   ├── enhanced-bible-notes.sql
        │   ├── enhanced-insights-responses.sql
        │   ├── enhanced-subscription-schema.sql
        │   ├── fix-ai-insights-rls-for-testing.sql
        │   ├── fix-enum-additions.sql
        │   ├── genesis-table.sql
        │   ├── schema.sql
        │   ├── setup-database.sql
        │   ├── setup-storage.sql
        │   └── study-plans.sql
        ├── secrets/                 # Secret files (secure)
        │   └── temp_key.txt
        └── env.example              # Environment template
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL/Supabase
- Pinecone account (for vector storage)
- OpenAI API key

### Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Will-Langhart/shieldai.git
   cd shieldai
   npm install
   ```

2. **Environment setup**
   ```bash
   # Copy environment template
   cp src/config/env.example .env
   
   # Configure your environment variables
   # Edit .env with your API keys and database URLs
   ```

3. **Database setup**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   # Start all services (web + MCP)
   npm run dev
   
   # Or start individually
   npm run dev:web      # Web app (http://localhost:3001)
   npm run dev:mobile   # Mobile app (http://localhost:8081)
   npm run dev:mcp      # MCP server (http://localhost:8000)
   ```

## 📱 Applications

### Web App (`src/apps/web`)
- **Framework**: Next.js 14 with TypeScript
- **Features**: Full-stack web application with 80+ API routes
- **Port**: 3001
- **Tech Stack**: React, TypeScript, Tailwind CSS, Supabase, Pinecone
- **Key Features**:
  - AI-powered Bible study insights
  - Real-time chat with RAG integration
  - Church finder with Google Places API
  - User authentication and profiles
  - Subscription management with Stripe

### Mobile App (`src/apps/mobile`)
- **Framework**: React Native with Expo
- **Features**: Cross-platform mobile application
- **Port**: 8081
- **Tech Stack**: React Native, TypeScript, Expo, Supabase
- **Key Features**:
  - Native mobile Bible study experience
  - Offline reading capabilities
  - Push notifications
  - Cross-platform compatibility

### Backend (`src/backend/`)
- **Framework**: Python FastAPI
- **Features**: Main API server and MCP integration
- **Port**: 8000
- **Tech Stack**: Python, FastAPI, Pydantic, Pinecone, Supabase
- **Key Features**:
  - RESTful API endpoints
  - MCP (Model Context Protocol) server
  - Vector database integration
  - Authentication middleware
  - Rate limiting and error handling

## 🗄️ Database

### Migrations
All database changes are managed through migration files in `src/config/migrations/`:
```bash
# Run all migrations
npm run db:migrate

# Run specific migration
node src/scripts/database_run-migration.sh
```

### Available Migrations
- `schema.sql` - Main database schema
- `ai-insights-schema.sql` - AI insights tables
- `bible-notes.sql` - Bible notes functionality
- `conversations-schema.sql` - Chat conversations
- `enhanced-subscription-schema.sql` - Subscription management
- `study-plans.sql` - Bible study plans

## 🛠️ Development Tools

### Available Scripts
```bash
# Development
npm run dev                    # Start all services
npm run dev:web               # Web app only
npm run dev:mobile            # Mobile app only
npm run dev:mcp               # MCP server only
npm run dev:web:logging       # Web app with enhanced logging

# Building
npm run build:web             # Build web app for production
npm run start:web             # Start production web app

# Database
npm run db:migrate            # Run database migrations
npm run db:seed               # Seed database with test data

# Testing
npm run test                  # Run all tests
npm run lint:web              # Lint web app code

# Deployment
npm run deploy-auto           # Deploy to Vercel with domain sync
npm run deploy-branch         # Deploy specific branch
npm run sync-domain           # Sync custom domain
npm run configure-vercel      # Configure Vercel settings
npm run setup-vercel          # Setup Vercel Git integration

# Utilities
npm run favicon               # Generate favicon
npm run clean                 # Clean node_modules
```

### Scripts Directory (`src/scripts/`)
- **Development**: 16+ development and setup scripts
- **Database**: 9+ database migration and test scripts  
- **Deployment**: 4+ deployment and verification scripts
- **Testing**: 25+ integration and test files

## 📚 Documentation

Comprehensive documentation is available in `src/docs/`:
- **API Integration**: Setup guides for all external services
- **Features**: Detailed feature documentation
- **Deployment**: Production deployment guides
- **Architecture**: System design and structure
- **Troubleshooting**: Common issues and solutions

## 🔧 Configuration

### Environment Variables
- **Main**: `.env` - Primary environment configuration
- **Web App**: `src/apps/web/.env` - Web-specific variables
- **Backup Files**: `src/config/env/` - Various environment backups
- **Template**: `src/config/env.example` - Environment template

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_index_name

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Google Places
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

## 🧪 Testing

### Test Files
- **Integration Tests**: `src/scripts/tests/test_rag_integration.py`
- **Connection Tests**: `src/scripts/tests_test-pinecone-*.js`
- **Database Tests**: `src/scripts/database_*.js`
- **API Tests**: `src/scripts/tests_integration_*.js`

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test files
node src/scripts/tests_test-pinecone-connection.js
python src/scripts/tests/test_rag_integration.py
```

## 🚀 Deployment

### Production Build
```bash
# Build web application
npm run build:web

# Start production server
npm run start:web
```

### Vercel Deployment
```bash
# Deploy to production
npm run deploy-auto

# Deploy with domain sync
npm run deploy-branch && npm run sync-domain
```

### Manual Deployment
```bash
# Build and deploy
npm run build:web
vercel --prod

# Sync custom domain
npm run sync-domain
```

## 🔐 Security

### Environment Security
- All sensitive files are in `src/config/env/` (gitignored)
- Secrets are stored in `src/config/secrets/`
- Environment templates are provided for easy setup

### API Security
- Rate limiting on all endpoints
- Authentication middleware
- CORS configuration
- Input validation with Pydantic

## 📊 Monitoring

### Logs
- **Development Logs**: `src/apps/web/logs/dev/` - Daily development logs
- **Application Logs**: `src/scripts/logs/` - Application and API logs
- **Build Logs**: Available in Vercel dashboard

### Metrics
- **Performance**: Built-in Next.js analytics
- **API Usage**: Supabase dashboard
- **Vector Queries**: Pinecone dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: Check `src/docs/` for detailed guides
- **Issues**: Create an issue on GitHub
- **Discord**: Join our community for real-time support
- **Email**: support@shieldai.com

## 🙏 Acknowledgments

- **Bible API**: [Bible API](https://bible-api.com/) for Scripture access
- **Supabase**: Backend-as-a-Service platform
- **Pinecone**: Vector database for AI embeddings
- **OpenAI**: AI language models
- **Vercel**: Deployment platform
- **Next.js**: React framework
- **Expo**: React Native development platform

---

*"For the word of God is living and active, sharper than any two-edged sword, piercing to the division of soul and of spirit, of joints and of marrow, and discerning the thoughts and intentions of the heart." - Hebrews 4:12*

*For detailed project documentation, see [src/docs/PROJECT_README.md](src/docs/PROJECT_README.md)*