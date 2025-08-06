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
├── components/

│   ├── AuthModal.tsx           # Authentication interface
│   ├── BibleSearch.tsx         # Bible search component
│   ├── BibleStudyTools.tsx     # Study tools and notes
│   ├── BibleVerse.tsx          # Individual verse display
│   ├── ChurchFinder.tsx        # Church search interface
│   ├── EnhancedBibleInterface.tsx # Main Bible suite
│   ├── Header.tsx              # Navigation and branding
│   ├── InputBar.tsx            # Main input interface
│   ├── MessageActions.tsx      # Message interaction buttons
│   ├── MoodVerseSystem.tsx     # Mood-based verse system
│   ├── NoteCreationModal.tsx   # Bible note creation
│   ├── SubscriptionModal.tsx   # Subscription management
│   ├── UserSettings.tsx        # User preferences and data
│   └── VerseComparison.tsx     # Verse comparison tool
├── lib/
│   ├── ai-church-assistant.ts  # Church finder AI
│   ├── ai-church-recommendations.ts # Church recommendations
│   ├── analytics-service.ts    # User analytics
│   ├── auth-context.tsx        # Authentication context
│   ├── bible-service.ts        # Bible API integration
│   ├── chat-service.ts         # Chat functionality
│   ├── church-finder-service.ts # Church search service

│   ├── prompt-engineering.ts   # AI prompt management
│   ├── stripe.ts               # Payment processing
│   └── supabase.ts             # Database connection
├── pages/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── bible/             # Bible API endpoints
│   │   ├── chat.ts            # Chat API
│   │   ├── churches/          # Church finder API
│   │   ├── subscriptions/     # Payment endpoints
│   │   └── webhooks/          # Webhook handlers
│   ├── _app.tsx               # App wrapper
│   ├── _document.tsx          # HTML structure
│   ├── chat/[conversationId].tsx # Individual chat sessions
│   └── index.tsx              # Main page
├── database/
│   ├── schema.sql             # Database schema
│   └── bible-notes.sql        # Bible study tables
├── styles/
│   └── globals.css            # Global styles
├── public/                    # Static assets
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
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