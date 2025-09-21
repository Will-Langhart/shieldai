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
- Redis (optional)

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   cd apps/web && npm install
   cd ../mobile && npm install
   ```

2. **Environment setup**
   ```bash
   cp config/env.example .env
   # Configure your environment variables
   # Additional env files are in config/env/
   ```

3. **Database setup**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed data
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   # Start all services
   npm run dev
   
   # Or start individually
   npm run dev:web      # Web app (port 3001)
   npm run dev:mobile   # Mobile app (port 8081)
   npm run dev:mcp      # MCP server (port 8000)
   ```

## 📱 Applications

### Web App (`apps/web`)
- **Framework**: Next.js 14
- **Features**: Full-stack web application with API routes
- **Port**: 3001
- **Tech Stack**: React, TypeScript, Tailwind CSS, Supabase

### Mobile App (`apps/mobile`)
- **Framework**: React Native with Expo
- **Features**: Cross-platform mobile application
- **Port**: 8081
- **Tech Stack**: React Native, TypeScript, Expo

### Backend (`backend/`)
- **Framework**: Python FastAPI
- **Features**: Main API server and MCP integration
- **Port**: 8000
- **Tech Stack**: Python, FastAPI, Pydantic
- **Files**: `app.py`, `requirements.txt`, `gunicorn.conf.py`, `mcp/`

### MCP Server (`backend/mcp`)
- **Framework**: Python FastAPI
- **Features**: Model Context Protocol server
- **Port**: 8000
- **Tech Stack**: Python, FastAPI, Pydantic

## 🗄️ Database

### Migrations
All database changes are managed through migration files in `database/migrations/`.

### Schema
Database schemas are defined in `database/schemas/`.

### Seeds
Test data and initial setup scripts are in `database/seeds/`.

## 🛠️ Development Tools

### Scripts
- **Database**: `tools/scripts/database/` - DB management scripts
- **Development**: `tools/scripts/development/` - Dev workflow scripts
- **Deployment**: `tools/scripts/deployment/` - Deployment scripts
- **Testing**: `tools/testing/` - Test utilities

### Monitoring
- **Logs**: `monitoring/logs/` - Application logs
- **Metrics**: `monitoring/metrics/` - Performance metrics

## 📚 Documentation

- **API**: `docs/api/` - API documentation
- **Architecture**: `docs/architecture/` - System architecture
- **Deployment**: `docs/deployment/` - Deployment guides
- **Features**: `docs/features/` - Feature documentation
- **Project Details**: `docs/PROJECT_README.md` - Comprehensive project documentation

## 🔧 Configuration

- **Environment**: `config/env.example` - Environment variables template
- **Environment Files**: `config/env/` - Local, test, and backup environment files
- **Secrets**: `config/secrets/` - Secret files (secure storage)
- **Deployment**: `config/vercel.json` - Vercel configuration

## 🧪 Testing

- **Integration Tests**: `tests/test_rag_integration.py` - RAG system tests
- **Connection Tests**: `tests/test-pinecone-*.js` - Database connection tests
- **Test Utilities**: `tools/testing/` - Additional test utilities

## 🚀 Deployment

### Production
```bash
npm run build
npm run start
```

### Docker
```bash
docker-compose up -d
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support, email support@shieldai.com or join our Discord community.

---

*For detailed project documentation, see [docs/PROJECT_README.md](docs/PROJECT_README.md)*
