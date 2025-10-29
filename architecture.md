# ShieldAI Repository Architecture

```
shieldai/
│
├── .github/
│   ├── workflows/
│   │   ├── ci-cd.yml
│   │   ├── sync-vercel-domain.yml
│   │   ├── vercel-auto-deploy.yml.disabled
│   │   └── vercel-simple-deploy.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   ├── environments/
│   │   └── production.yml
│   ├── lighthouse/
│   │   └── lighthouserc.json
│   ├── CODEOWNERS
│   └── pull_request_template.md
│
├── apps/
│   └── web/                                 # Next.js app directory (symlink/output)
│
├── src/
│   │
│   ├── apps/
│   │   ├── mobile/                          # React Native/Expo mobile app
│   │   │   ├── app/
│   │   │   │   ├── (tabs)/                  # Tab-based navigation
│   │   │   │   │   ├── _layout.tsx
│   │   │   │   │   ├── bible.tsx
│   │   │   │   │   ├── church.tsx
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── notes.tsx
│   │   │   │   │   └── settings.tsx
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── +html.tsx
│   │   │   │   ├── +not-found.tsx
│   │   │   │   ├── auth.tsx
│   │   │   │   └── modal.tsx
│   │   │   ├── components/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── StyledText-test.js
│   │   │   │   ├── EditScreenInfo.tsx
│   │   │   │   ├── ExternalLink.tsx
│   │   │   │   ├── StyledText.tsx
│   │   │   │   ├── Themed.tsx
│   │   │   │   ├── useClientOnlyValue.ts
│   │   │   │   ├── useClientOnlyValue.web.ts
│   │   │   │   ├── useColorScheme.ts
│   │   │   │   └── useColorScheme.web.ts
│   │   │   ├── assets/
│   │   │   │   ├── fonts/
│   │   │   │   └── images/
│   │   │   ├── constants/
│   │   │   ├── contexts/
│   │   │   ├── utils/
│   │   │   ├── app.config.ts
│   │   │   ├── app.json
│   │   │   ├── babel.config.js
│   │   │   ├── global.css
│   │   │   ├── metro.config.js
│   │   │   ├── package.json
│   │   │   ├── tailwind.config.js
│   │   │   └── tsconfig.json
│   │   │
│   │   └── web/                             # Next.js web application
│   │       ├── components/
│   │       │   ├── auth/
│   │       │   │   ├── LoginForm.tsx
│   │       │   │   ├── SignUpForm.tsx
│   │       │   │   └── UserProfile.tsx
│   │       │   ├── common/
│   │       │   │   ├── ErrorBoundary.tsx
│   │       │   │   ├── LoadingSpinner.tsx
│   │       │   │   └── index.ts
│   │       │   ├── features/
│   │       │   │   ├── bible/              # Bible reading & study features
│   │       │   │   │   ├── AIBibleInsights.tsx
│   │       │   │   │   ├── AICrossReferences.tsx
│   │       │   │   │   ├── AIDiagnostics.tsx
│   │       │   │   │   ├── AIStudyQuestions.tsx
│   │       │   │   │   ├── Bible.tsx
│   │       │   │   │   ├── BibleBreadcrumbs.tsx
│   │       │   │   │   ├── BibleReader.tsx
│   │       │   │   │   ├── BibleSearch.tsx
│   │       │   │   │   ├── EnhancedBibleInterface.tsx
│   │       │   │   │   ├── EnhancedBibleNavigation.tsx
│   │       │   │   │   ├── EnhancedInsightsQuery.tsx
│   │       │   │   │   ├── InsightDetailView.tsx
│   │       │   │   │   ├── InsightsAnalytics.tsx
│   │       │   │   │   ├── InsightsHistory.tsx
│   │       │   │   │   ├── MobileBibleNavigation.tsx
│   │       │   │   │   ├── QuickNavigation.tsx
│   │       │   │   │   ├── SmartTextSelection.tsx
│   │       │   │   │   ├── UltimateBibleInterface.tsx
│   │       │   │   │   └── index.ts
│   │       │   │   ├── chat/               # Chat/conversation features
│   │       │   │   │   └── Chat.tsx
│   │       │   │   └── churches/            # Church finder features (empty)
│   │       │   ├── layout/
│   │       │   │   ├── Footer.tsx
│   │       │   │   ├── Header.tsx
│   │       │   │   └── index.ts
│   │       │   ├── ui/                      # Reusable UI components
│   │       │   │   ├── Button.tsx
│   │       │   │   ├── Input.tsx
│   │       │   │   ├── Modal.tsx
│   │       │   │   └── index.ts
│   │       │   ├── Footer.tsx
│   │       │   └── Header.tsx
│   │       │
│   │       ├── pages/
│   │       │   ├── api/                     # API routes (Next.js pages router)
│   │       │   │   ├── ai-insights/
│   │       │   │   │   ├── [id]/
│   │       │   │   │   │   ├── favorite.ts
│   │       │   │   │   │   └── share.ts
│   │       │   │   │   ├── by-passage-pinecone.ts
│   │       │   │   │   ├── by-passage.ts
│   │       │   │   │   ├── delete.ts
│   │       │   │   │   ├── feedback.ts
│   │       │   │   │   ├── generate-image.ts
│   │       │   │   │   ├── health-check.ts
│   │       │   │   │   ├── history.ts
│   │       │   │   │   ├── interactions.ts
│   │       │   │   │   ├── recommendations.ts
│   │       │   │   │   ├── responses.ts
│   │       │   │   │   ├── save.ts
│   │       │   │   │   ├── search-pinecone.ts
│   │       │   │   │   ├── search.ts
│   │       │   │   │   ├── statistics.ts
│   │       │   │   │   └── update.ts
│   │       │   │   ├── auth/
│   │       │   │   │   ├── signin.ts
│   │       │   │   │   └── signup.ts
│   │       │   │   ├── bible/
│   │       │   │   │   ├── notes/
│   │       │   │   │   │   ├── [noteId].ts
│   │       │   │   │   │   ├── history.ts
│   │       │   │   │   │   └── search.ts
│   │       │   │   │   ├── advanced-search.ts
│   │       │   │   │   ├── ai-insights.ts
│   │       │   │   │   ├── apologetics.ts
│   │       │   │   │   ├── concordance.ts
│   │       │   │   │   ├── context.ts
│   │       │   │   │   ├── cross-references.ts
│   │       │   │   │   ├── crossrefs.ts
│   │       │   │   │   ├── daily-verse.ts
│   │       │   │   │   ├── favorites.ts
│   │       │   │   │   ├── history.ts
│   │       │   │   │   ├── notes.ts
│   │       │   │   │   ├── passage.ts
│   │       │   │   │   ├── plan-steps.ts
│   │       │   │   │   ├── plans.ts
│   │       │   │   │   ├── popular.ts
│   │       │   │   │   ├── preferences.ts
│   │       │   │   │   ├── search.ts
│   │       │   │   │   ├── study-questions.ts
│   │       │   │   │   ├── suggestions.ts
│   │       │   │   │   └── versions.ts
│   │       │   │   ├── chat.ts
│   │       │   │   ├── chat-enhanced.ts.backup
│   │       │   │   ├── chat-rag.ts
│   │       │   │   ├── churches/
│   │       │   │   │   └── search.ts
│   │       │   │   ├── conversations/
│   │       │   │   │   ├── [id].ts
│   │       │   │   │   └── conversations.ts
│   │       │   │   ├── geocode/
│   │       │   │   │   └── autocomplete.ts
│   │       │   │   ├── memory/
│   │       │   │   │   ├── search.ts
│   │       │   │   │   └── stats.ts
│   │       │   │   ├── pinecone/
│   │       │   │   │   ├── admin.ts
│   │       │   │   │   ├── bible-import.ts
│   │       │   │   │   ├── env.ts
│   │       │   │   │   ├── indexes.ts
│   │       │   │   │   ├── memory.ts
│   │       │   │   │   ├── seed.ts
│   │       │   │   │   └── stats.ts
│   │       │   │   ├── subscriptions/
│   │       │   │   │   ├── cancel.ts
│   │       │   │   │   ├── check-feature.ts
│   │       │   │   │   ├── create.ts
│   │       │   │   │   ├── payments.ts
│   │       │   │   │   ├── plans.ts
│   │       │   │   │   ├── promo-code.ts
│   │       │   │   │   ├── reactivate.ts
│   │       │   │   │   ├── referral.ts
│   │       │   │   │   ├── status.ts
│   │       │   │   │   ├── tiers.ts
│   │       │   │   │   └── usage.ts
│   │       │   │   ├── videos/
│   │       │   │   │   └── search.ts
│   │       │   │   ├── webhooks/
│   │       │   │   │   └── stripe.ts
│   │       │   │   ├── analytics.ts
│   │       │   │   ├── feedback.ts
│   │       │   │   ├── geocode.ts
│   │       │   │   ├── health.ts
│   │       │   │   ├── messages.ts
│   │       │   │   ├── notifications/
│   │       │   │   │   └── register.ts
│   │       │   │   └── vector-response.ts
│   │       │   ├── _app.tsx                 # Next.js app wrapper
│   │       │   ├── _document.tsx            # Next.js document wrapper
│   │       │   ├── bible.tsx                # Bible page
│   │       │   ├── chat.tsx                 # Chat page
│   │       │   ├── churches.tsx             # Churches page
│   │       │   ├── ChurchFinder.tsx         # Church finder page
│   │       │   ├── EmailConfirm.tsx         # Email confirmation page
│   │       │   ├── Home.tsx                 # Home page
│   │       │   ├── index.tsx                # Index page
│   │       │   ├── insights-history.tsx     # Insights history page
│   │       │   └── test-insights.tsx         # Test insights page
│   │       │
│   │       ├── lib/                         # Core libraries & services
│   │       │   ├── ai-church-assistant.ts
│   │       │   ├── ai-church-recommendations.ts
│   │       │   ├── analytics-service.ts
│   │       │   ├── api-integration-hooks.ts
│   │       │   ├── apologetics-knowledge.ts
│   │       │   ├── auth-context.tsx
│   │       │   ├── auth.ts
│   │       │   ├── bible-fallback-service.ts
│   │       │   ├── bible-pinecone.ts
│   │       │   ├── bible-service.ts
│   │       │   ├── chat-service.ts
│   │       │   ├── church-finder-service.ts
│   │       │   ├── client-service.ts
│   │       │   ├── conversation-storage.ts
│   │       │   ├── dev-logging-config.ts
│   │       │   ├── embeddings.ts
│   │       │   ├── enhanced-prompt-engineering.ts.backup
│   │       │   ├── enhanced-stripe-service.ts
│   │       │   ├── gesture-service.ts
│   │       │   ├── image-generation.ts
│   │       │   ├── insights-pinecone.ts
│   │       │   ├── logger.ts
│   │       │   ├── memory-service.ts
│   │       │   ├── multilingual-service.ts
│   │       │   ├── multilingual-service.ts.backup
│   │       │   ├── notification-service.ts
│   │       │   ├── objection-classifier.ts
│   │       │   ├── pinecone-direct.ts
│   │       │   ├── pinecone.ts
│   │       │   ├── prompt-engineering.ts
│   │       │   ├── reference-utils.ts
│   │       │   ├── stripe.ts
│   │       │   ├── subscription-middleware.tsx
│   │       │   ├── supabase.ts
│   │       │   ├── video-client-service.ts
│   │       │   └── video-service.ts
│   │       │
│   │       ├── hooks/                        # React hooks
│   │       │   ├── useApi.ts
│   │       │   ├── useBibleNavigation.ts
│   │       │   └── useLocalStorage.ts
│   │       │
│   │       ├── contexts/                     # React contexts
│   │       │   ├── AuthContext.tsx
│   │       │   ├── ThemeContext.tsx
│   │       │   └── index.ts
│   │       │
│   │       ├── services/                     # Service layer
│   │       │   ├── api.ts
│   │       │   ├── bibleService.ts
│   │       │   ├── chatService.ts
│   │       │   ├── churchService.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── styles/                       # Stylesheets
│   │       │   └── [CSS files]
│   │       │
│   │       ├── types/                        # TypeScript types
│   │       │   ├── api.ts
│   │       │   ├── bible.ts
│   │       │   ├── chat.ts
│   │       │   ├── church.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── utils/                         # Utility functions
│   │       │   └── cn.ts
│   │       │
│   │       ├── public/                       # Static assets
│   │       │   └── [static files]
│   │       │
│   │       ├── .conversation-storage.json    # Conversation storage cache
│   │       ├── index.css                     # Main stylesheet
│   │       ├── middleware.ts                 # Next.js middleware
│   │       ├── next-env.d.ts                # Next.js type definitions
│   │       ├── next.config.js                # Next.js configuration
│   │       ├── package.json                  # Web app dependencies
│   │       ├── postcss.config.js             # PostCSS configuration
│   │       ├── server.log                    # Server log file
│   │       ├── tailwind.config.js            # Tailwind CSS configuration
│   │       ├── tsconfig.json                 # TypeScript configuration
│   │       ├── vercel.json                   # Vercel deployment config
│   │       ├── vite-env.d.ts                 # Vite type definitions
│   │       └── yarn.lock                     # Yarn lock file
│   │
│   ├── backend/                             # Python backend services
│   │   ├── __init__.py
│   │   ├── app.py                            # Flask/FastAPI application
│   │   ├── base_server.py                   # Base server implementation
│   │   ├── exceptions.py                    # Exception handlers
│   │   ├── gunicorn.conf.py                 # Gunicorn configuration
│   │   ├── utils.py                          # Utility functions
│   │   ├── mcp_README.md                     # MCP documentation
│   │   ├── mcp_backend_mcp_init.py          # MCP backend initialization
│   │   ├── mcp_config_init.py               # MCP config initialization
│   │   ├── mcp_config_logging_config.py     # MCP logging configuration
│   │   ├── mcp_config_settings.py            # MCP settings
│   │   ├── mcp_middleware_auth.py            # MCP auth middleware
│   │   ├── mcp_middleware_error_handling.py  # MCP error handling
│   │   ├── mcp_middleware_init.py            # MCP middleware initialization
│   │   ├── mcp_middleware_rate_limiting.py   # MCP rate limiting
│   │   ├── mcp_run_servers.py                # MCP server runner
│   │   ├── mcp_schemas_bible_schemas.py      # Bible API schemas
│   │   ├── mcp_schemas_init.py               # Schema initialization
│   │   ├── mcp_schemas_pinecone_schemas.py   # Pinecone schemas
│   │   ├── mcp_schemas_supabase_schemas.py   # Supabase schemas
│   │   ├── mcp_services_bible_api_server.py  # Bible API server
│   │   ├── mcp_services_init.py              # Services initialization
│   │   ├── mcp_services_pinecone_server.py   # Pinecone server
│   │   ├── mcp_services_supabase_server.py   # Supabase server
│   │   ├── mcp_tests_init.py                 # Tests initialization
│   │   └── mcp_tests_test_base_server.py     # Base server tests
│   │
│   ├── config/
│   │   ├── env/                              # Environment configuration
│   │   │   ├── .env.backup
│   │   │   ├── .env.local
│   │   │   ├── .env.local.backup
│   │   │   ├── .env.local.old
│   │   │   ├── .env.test
│   │   │   └── .gitkeep
│   │   ├── migrations/                       # Database migrations (SQL)
│   │   │   ├── add-user-id-to-messages.sql
│   │   │   ├── add-video-storage.sql
│   │   │   ├── ai-insights-schema.sql
│   │   │   ├── bible-notes.sql
│   │   │   ├── conversations-schema.sql
│   │   │   ├── create-test-conversation.sql
│   │   │   ├── create-test-user.sql
│   │   │   ├── disable-rls-for-dev.sql
│   │   │   ├── enhanced-analytics-schema.sql
│   │   │   ├── enhanced-bible-notes.sql
│   │   │   ├── enhanced-insights-responses.sql
│   │   │   ├── enhanced-subscription-schema.sql
│   │   │   ├── fix-ai-insights-rls-for-testing.sql
│   │   │   ├── fix-enum-additions.sql
│   │   │   ├── genesis-table.sql
│   │   │   ├── schema.sql
│   │   │   ├── setup-database.sql
│   │   │   ├── setup-storage.sql
│   │   │   └── study-plans.sql
│   │   ├── secrets/                          # Secrets (gitignored)
│   │   │   └── temp_key.txt
│   │   └── env.example                        # Environment template
│   │
│   ├── docs/                                 # Documentation
│   │   ├── api_GOOGLE_PLACES_SETUP.md
│   │   ├── API_INTEGRATION_GUIDE.md
│   │   ├── API_INTEGRATION_STATUS.md
│   │   ├── api_README.md
│   │   ├── architecture_README.md
│   │   ├── architecture.txt
│   │   ├── BIBLE_API_INTEGRATION.md
│   │   ├── BIBLE_FEATURE_ENHANCEMENT.md
│   │   ├── BIBLE_NOTES_ENHANCEMENT_SUMMARY.md
│   │   ├── BIBLE_UI_INTEGRATION_SUMMARY.md
│   │   ├── CHURCH_FINDER_SETUP.md
│   │   ├── CONVERSATION_PERSISTENCE.md
│   │   ├── DEPLOYMENT.md
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   ├── deployment_README.md
│   │   ├── docs_DEVELOPMENT_LOGGING.md
│   │   ├── docs_DOCUMENTATION_INDEX.md
│   │   ├── docs_RAG_INTEGRATION.md
│   │   ├── docs_vercel-auto-domain-sync.md
│   │   ├── ENHANCED_BIBLE_NOTES_FEATURES.md
│   │   ├── ENHANCED_BIBLE_NOTES_FIXES.md
│   │   ├── ENHANCED_BIBLE_NOTES_IMMUTABLE_FIX.md
│   │   ├── ENHANCED_NOTES_SUMMARY.md
│   │   ├── ENHANCED_SUBSCRIPTION_ENUM_FIX.md
│   │   ├── ENHANCED_SUBSCRIPTION_SETUP.md
│   │   ├── ENHANCED_VIDEO_SERVICE.md
│   │   ├── features_README.md
│   │   ├── FRONTEND_INTEGRATION_SUMMARY.md
│   │   ├── GAMIFICATION_FEATURES.md
│   │   ├── GOOGLE_PLACES_API_KEY_FIX.md
│   │   ├── GOOGLE_PLACES_SETUP.md
│   │   ├── IOS_BUILD_BLUEPRINT.md
│   │   ├── MEMORY_SYSTEM.md
│   │   ├── PINECONE_MEMORY_INTEGRATION.md
│   │   ├── PINECONE_SETUP.md
│   │   ├── PINECONE_TROUBLESHOOTING.md
│   │   ├── PROJECT_README.md
│   │   ├── README.md
│   │   ├── SETTINGS_ENHANCEMENT_SUMMARY.md
│   │   ├── setup_README.md
│   │   ├── SETUP.md
│   │   ├── SHIELD_AI_PROJECT_OVERVIEW.md
│   │   ├── STRIPE_SETUP.md
│   │   ├── SUPABASE_SETUP.md
│   │   ├── VERCEL_DEPLOYMENT.md
│   │   ├── VIDEO_INTEGRATION.md
│   │   └── VIDEO_INTEGRATION_SUMMARY.md
│   │
│   ├── scripts/                              # Utility scripts
│   │   ├── logs/                             # Log files
│   │   │   ├── api-integration-results.json
│   │   │   ├── dev-web.out
│   │   │   └── dev-web.pid
│   │   ├── metrics/                          # Metrics directory
│   │   │   └── .gitkeep
│   │   ├── tests/                            # Test scripts
│   │   │   └── test_rag_integration.py
│   │   ├── database_check-db-schema.js
│   │   ├── database_check-messages-structure.js
│   │   ├── database_fix-messages-table.js
│   │   ├── database_run-migration.sh
│   │   ├── database_run-video-storage-migration.sh
│   │   ├── database_test-conversation-flow.js
│   │   ├── database_test-messages-insert.js
│   │   ├── deployment_configure-vercel.sh
│   │   ├── deployment_sync-vercel-domain.sh
│   │   ├── deployment_verify-api-integration.js
│   │   ├── deployment_verify-pinecone.js
│   │   ├── development_check-pinecone-env.js
│   │   ├── development_create-index-simple.js
│   │   ├── development_create-pinecone-index-1536.js
│   │   ├── development_dev-with-logging.sh
│   │   ├── development_evaluate-retrieval.js
│   │   ├── development_generate-favicon.js
│   │   ├── development_setup-api-verification.sh
│   │   ├── development_setup-bible-api.sh
│   │   ├── development_setup-bible-enhancements.sh
│   │   ├── development_setup-github-secrets.md
│   │   ├── development_setup-github.sh
│   │   ├── development_setup-pinecone-index.js
│   │   ├── development_setup-pinecone-memory.sh
│   │   ├── development_setup-vercel-git-integration.sh
│   │   ├── development_setup-youtube-api.sh
│   │   ├── development_start-dev.sh
│   │   ├── development_update-env.js
│   │   ├── development_update-personal-pinecone.js
│   │   ├── logs_README.md
│   │   ├── tests_integration_create-test-conversation.js
│   │   ├── tests_integration_debug-pinecone-memory.js
│   │   ├── tests_integration_pinecone.config.js
│   │   ├── tests_integration_test-conversation-creation.js
│   │   ├── tests_integration_test-correct-env.js
│   │   ├── tests_integration_test-create-index.js
│   │   ├── tests_integration_test-direct-connection.js
│   │   ├── tests_integration_test-direct-http.js
│   │   ├── tests_integration_test-direct-index-access.js
│   │   ├── tests_integration_test-env-order.js
│   │   ├── tests_integration_test-exact-api-key.js
│   │   ├── tests_integration_test-fresh-pinecone.js
│   │   ├── tests_integration_test-index-direct.js
│   │   ├── tests_integration_test-network-config.js
│   │   ├── tests_integration_test-pinecone-correct-env.js
│   │   ├── tests_integration_test-pinecone-curl.js
│   │   ├── tests_integration_test-pinecone-direct.js
│   │   ├── tests_integration_test-pinecone-index-host.js
│   │   ├── tests_integration_test-pinecone-simple-init.js
│   │   ├── tests_integration_test-pinecone-simple.js
│   │   ├── tests_integration_test-production-integration.js
│   │   ├── tests_integration_test-updated-service.js
│   │   ├── tests_integration_test-v2-client.js
│   │   ├── tests_integration_test-v2-direct.js
│   │   ├── tests_integration_test-v2-with-env.js
│   │   ├── tests_integration_test-with-host.js
│   │   ├── tests_test-pinecone-connection.js
│   │   ├── tests_test-pinecone-direct.js
│   │   ├── tests_test-pinecone-simple.js
│   │   └── tests_test-vector-storage.js
│   │
│   ├── assets/                               # Shared assets
│   │   ├── icons/
│   │   ├── images/
│   │   └── themes/
│   │       ├── _pinecone-color-theme.json
│   │       ├── caffe-color-theme.json
│   │       └── caffe-latte-color-theme.json
│   │
│   └── shared/                               # Shared code between apps
│       ├── services/
│       │   └── tsconfig.json
│       ├── types/
│       │   └── tsconfig.json
│       ├── services_index.ts
│       ├── services_mobile-api.ts
│       ├── services_package.json
│       ├── types_index.ts
│       ├── types_package.json
│       ├── ui_index.tsx
│       └── ui_package.json
│
├── package.json                              # Root package.json
├── package-lock.json                         # NPM lock file
├── requirements.txt                          # Python dependencies
├── README.md                                 # Project README
└── vercel.json                               # Vercel deployment config
```

## Key Directories Overview

### Frontend Applications
- **`src/apps/web/`**: Next.js web application with React/TypeScript
  - Uses Pages Router for routing
  - Components organized by feature (bible, chat, churches)
  - Comprehensive API routes for backend integration
  - Services, hooks, and contexts for state management
- **`src/apps/mobile/`**: React Native/Expo mobile application
  - Tab-based navigation structure
  - Shared components with web adaptation hooks
  - Separate configuration for mobile platform

### Backend & Services
- **`src/backend/`**: Python backend with MCP (Model Context Protocol) services
  - Flask/FastAPI-based server
  - Separate servers for Bible API, Pinecone, and Supabase
  - Middleware for auth, error handling, and rate limiting
  - Comprehensive schema definitions
- **`src/config/`**: Configuration, migrations, and environment files
  - SQL migrations for database schema
  - Environment configuration templates
  - Secrets directory (gitignored)

### Core Features
- **Bible**: Reading, study, notes, AI insights, cross-references
  - Multiple Bible API integrations
  - Advanced search and concordance
  - Study plans and questions
  - AI-powered insights with Pinecone integration
- **Chat**: AI-powered conversations with RAG
  - Vector-based memory system
  - Conversation persistence
  - Enhanced prompts for contextual responses
- **Churches**: Church finder with Google Places integration
  - Location-based search
  - Geocoding and autocomplete
- **Subscriptions**: Stripe integration for payments
  - Multiple subscription tiers
  - Payment processing and management
  - Referral and promo code support

### Infrastructure
- **Pinecone**: Vector database for embeddings and memory
  - Bible verse embeddings
  - Conversation memory storage
  - AI insights retrieval
- **Supabase**: PostgreSQL database and auth
  - User authentication
  - Database tables for all features
  - Row-level security policies
- **Vercel**: Deployment platform
  - CI/CD workflows
  - Automatic deployments
- **Stripe**: Payment processing
  - Subscription management
  - Webhook handling

### Shared Resources
- **`src/shared/`**: Code shared between web and mobile
  - Service definitions
  - Type definitions
  - UI components
- **`src/assets/`**: Shared icons, images, themes
  - Icon library
  - Image assets
  - Color theme definitions
- **`src/docs/`**: Comprehensive documentation
  - Setup guides
  - API documentation
  - Feature summaries
  - Troubleshooting guides
- **`src/scripts/`**: Utility and setup scripts
  - Database migration scripts
  - Development setup scripts
  - Integration test scripts
  - Deployment automation

