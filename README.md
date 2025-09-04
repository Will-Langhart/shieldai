# Shield AI - Christian AI Assistant

Shield AI is a comprehensive Christian AI assistant platform that combines modern technology with biblical wisdom. Built with Python FastAPI backend and React TypeScript frontend, it provides Bible study tools, AI chat assistance, and church finder capabilities.

## 🏗️ Architecture Overview

### Backend (Python FastAPI)
- **FastAPI** with Gunicorn for high-performance API server
- **MCP (Model Context Protocol)** servers for external service integration
- **Pinecone** for vector database and semantic search
- **Supabase** for PostgreSQL database operations
- **Bible API** integration for scripture access

### Frontend (React TypeScript)
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive UI
- **React Router** for client-side navigation

### Mobile (React Native)
- **Expo** for cross-platform mobile development
- **TypeScript** for consistent codebase

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm 8+

### Backend Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your API keys
```

3. **Start the backend:**
```bash
# Development
python app.py

# Production with Gunicorn
gunicorn -c gunicorn.conf.py app:app
```

### Frontend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start the frontend:**
```bash
npm run dev:frontend
```

3. **Open your browser:**
Navigate to `http://localhost:3000`

### Mobile Setup

1. **Install dependencies:**
```bash
cd apps/mobile
npm install
```

2. **Start the mobile app:**
```bash
npm start
```

## 📁 Project Structure

```
shieldai/
├── app.py                 # Main FastAPI application
├── requirements.txt       # Python dependencies
├── gunicorn.conf.py      # Gunicorn configuration
├── mcp/                  # MCP servers
│   ├── base_server.py    # Base MCP server class
│   ├── pinecone_server.py # Pinecone integration
│   ├── supabase_server.py # Supabase integration
│   └── bible_api_server.py # Bible API integration
├── apps/
│   ├── frontend/         # React TypeScript frontend
│   ├── web/             # Next.js web application
│   └── mobile/          # React Native mobile app
├── database/            # SQL schema files
├── docs/               # Documentation
├── scripts/            # Utility scripts
└── packages/           # Shared packages
```

## 🔧 Available Scripts

### Root Level
- `npm run dev:frontend` - Start React frontend
- `npm run dev:web` - Start Next.js web app
- `npm run dev:mobile` - Start React Native mobile app
- `npm run dev:backend` - Start Python backend
- `npm run start:backend` - Start backend with Gunicorn
- `npm run install:backend` - Install Python dependencies

### Frontend Specific
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌟 Features

### Bible Study
- Search and explore scripture
- AI-powered biblical insights
- Cross-reference tools
- Multiple Bible versions

### AI Chat Assistant
- Scripture-based responses
- Spiritual guidance
- Prayer support
- Biblical counseling

### Church Finder
- Local church discovery
- Service time information
- Contact details
- Denomination filtering

### Vector Search
- Semantic scripture search
- Contextual Bible study
- Related verse discovery
- AI-enhanced insights

## 🔌 API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /api/status` - API status

### Bible API
- `GET /api/bible/verses` - Get Bible verses
- `GET /api/bible/search` - Search scripture
- `GET /api/bible/books` - Get Bible books
- `GET /api/bible/chapters` - Get chapters

### Vector Search
- `POST /api/vector/search` - Semantic search
- `POST /api/vector/upsert` - Add vectors

### Database
- `GET /api/db/{table}` - Get table data
- `POST /api/db/{table}` - Insert data

### MCP Services
- `GET /api/mcp/{service}/status` - Service status
- `POST /api/mcp/{service}/query` - Query service

## 🔐 Environment Variables

Copy `env.example` to `.env` and configure:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=shieldai

# Database Configuration
DATABASE_URL=your_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Bible API Configuration
BIBLE_API_KEY=your_bible_api_key_here
BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Deployment

### Backend Deployment
1. Set up your Python environment
2. Install dependencies: `pip install -r requirements.txt`
3. Configure environment variables
4. Start with Gunicorn: `gunicorn -c gunicorn.conf.py app:app`

### Frontend Deployment
1. Build the project: `npm run build:frontend`
2. Deploy the `build` directory to your hosting service

### Mobile Deployment
1. Build for iOS/Android using Expo
2. Deploy to app stores

## 📚 Documentation

- [Frontend Documentation](apps/frontend/README.md)
- [API Documentation](docs/api/)
- [Setup Guides](docs/setup/)
- [Architecture Overview](docs/architecture/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Scripture

*"For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life."* - John 3:16

Built with ❤️ for the Kingdom of God.