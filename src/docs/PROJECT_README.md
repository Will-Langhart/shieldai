# Shield AI - Multi-Platform Bible Study Application

A comprehensive Bible study platform with AI-powered insights, available across web, mobile, and admin interfaces.

## 🏗️ Project Structure

```
shieldai/
├── 📱 apps/                          # All applications
│   ├── web/                         # Next.js web app (backend + frontend)
│   ├── mobile/                      # React Native mobile app
│   └── frontend/                    # React frontend (legacy)
├── 📦 packages/                     # Shared packages
│   ├── ui/                         # Shared UI components
│   ├── types/                      # Shared TypeScript types
│   ├── services/                   # Shared business logic
│   └── config/                     # Shared configurations
├── 🗄️ database/                     # Database related files
│   ├── migrations/                 # SQL migration files
│   ├── seeds/                      # Seed data
│   └── schemas/                    # Schema definitions
├── 🔧 tools/                       # Development tools
│   ├── scripts/                    # Development scripts
│   ├── mcp/                        # MCP server
│   └── testing/                    # Test utilities
├── 📚 docs/                        # Documentation
├── 🎨 assets/                      # Static assets
├── 📊 monitoring/                  # Logs and monitoring
└── 🔐 config/                      # Configuration files
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
   cp config/env/.env.example .env
   # Configure your environment variables
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

### MCP Server (`tools/mcp`)
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

## 🔧 Configuration

- **Environment**: `config/env/` - Environment files
- **Secrets**: `config/secrets/` - Secret templates

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