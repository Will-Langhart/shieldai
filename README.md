# Shield AI - Multi-Platform Bible Study Application

A comprehensive Bible study platform with AI-powered insights, available across web, mobile, and admin interfaces.

## 🏗️ Project Structure

```
shieldai/
├── 📱 apps/                          # Applications
│   ├── web/                         # Next.js web app (main)
│   └── mobile/                      # React Native mobile app
├── 🔧 backend/                      # Backend services
│   ├── app.py                       # Main FastAPI application
│   ├── requirements.txt             # Python dependencies
│   ├── gunicorn.conf.py             # Gunicorn configuration
│   ├── mcp/                         # MCP server
│   └── services/                    # Backend services
├── 📦 shared/                       # Shared code
│   ├── ui/                         # Shared UI components
│   ├── types/                      # Shared TypeScript types
│   └── services/                   # Shared business logic
├── 🗄️ database/                     # Database files
│   ├── migrations/                 # SQL migration files
│   ├── seeds/                      # Seed data
│   └── schemas/                    # Schema definitions
├── 🧪 tests/                       # All tests
│   ├── integration/                # Integration tests
│   ├── unit/                       # Unit tests
│   └── e2e/                        # End-to-end tests
├── 📚 docs/                        # Documentation (flattened)
│   ├── api.md                      # API documentation
│   ├── deployment.md               # Deployment guides
│   ├── features.md                 # Feature documentation
│   └── setup.md                    # Setup guides
├── 🛠️ scripts/                     # Development scripts
│   ├── dev/                        # Development scripts
│   ├── deploy/                     # Deployment scripts
│   └── db/                         # Database scripts
├── 🎨 assets/                      # Static assets
├── 📊 monitoring/                  # Logs and monitoring
└── 🔐 config/                      # Configuration files
    ├── env/                        # Environment files (gitignored)
    ├── secrets/                    # Secret files (secure)
    ├── env.example                 # Environment template
    ├── vercel.json                 # Vercel config
    ├── package.json                # Root package.json
    └── package-lock.json           # Package lock file
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
