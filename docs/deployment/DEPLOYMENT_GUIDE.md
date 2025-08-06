# 🚀 Shield AI Deployment Guide

## 📋 Prerequisites

### Required Accounts
- [Vercel](https://vercel.com) - Hosting and deployment
- [Supabase](https://supabase.com) - Database and authentication
- [OpenAI](https://openai.com) - AI services
- [Pinecone](https://pinecone.io) - Vector database
- [Stripe](https://stripe.com) - Payment processing
- [API.Bible](https://api.scripture.api.bible) - Bible content

### Development Environment
- Node.js 18+ 
- npm or yarn
- Git
- Code editor (VS Code recommended)

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/Will-Langhart/shieldai.git
cd shieldai
npm install
```

### 2. Environment Variables
Create `.env.local` file:
```env
# AI Services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_claude_api_key

# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Bible APIs
BIBLE_API_KEY=your_bible_api_key
BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1
BIBLIA_API_KEY=your_biblia_api_key

# Vector Database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# PWA & Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=your_ga_id
MIXPANEL_TOKEN=your_mixpanel_token

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_MULTILINGUAL=true
ENABLE_AUDIO_BIBLE=true
```

## 🗄️ Database Setup

### 1. Supabase Project Creation
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Note down URL and keys

### 2. Database Schema
Run the SQL scripts in `database/` folder:

```sql
-- Main schema
\i database/schema.sql

-- Bible notes
\i database/bible-notes.sql

-- Storage setup
\i database/setup-storage.sql
```

### 3. Row Level Security (RLS)
Enable RLS on all tables and configure policies:

```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add similar policies for other tables
```

## 🤖 AI Services Configuration

### 1. OpenAI Setup
1. Create account at [OpenAI](https://openai.com)
2. Generate API key
3. Set up billing (required for GPT-4)

### 2. Anthropic (Claude) Setup
1. Create account at [Anthropic](https://anthropic.com)
2. Generate API key
3. Add to environment variables

### 3. Pinecone Setup
1. Create account at [Pinecone](https://pinecone.io)
2. Create index with dimension 1536 (OpenAI embeddings)
3. Note down API key and environment

## 📚 Bible API Configuration

### 1. API.Bible Setup
1. Register at [API.Bible](https://api.scripture.api.bible)
2. Generate API key
3. Test with sample requests

### 2. Fallback APIs
Configure additional Bible APIs for redundancy:
- Bible-API.com (no key required)
- wldeh's Bible API (GitHub CDN)
- Biblia.com API (optional)

## 💳 Payment Processing

### 1. Stripe Setup
1. Create account at [Stripe](https://stripe.com)
2. Generate API keys
3. Set up webhook endpoint
4. Configure products and pricing

### 2. Webhook Configuration
Set webhook endpoint in Stripe dashboard:
```
https://your-domain.com/api/webhooks/stripe
```

## 🔐 Security Configuration

### 1. JWT Configuration
Generate secure JWT secret:
```bash
openssl rand -base64 32
```

### 2. Encryption Key
Generate encryption key for sensitive data:
```bash
openssl rand -base64 32
```

### 3. CORS Configuration
Update `next.config.js`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

## 🚀 Deployment to Vercel

### 1. Vercel Setup
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

### 2. Environment Variables in Vercel
Add all environment variables to Vercel dashboard:
1. Go to project settings
2. Navigate to Environment Variables
3. Add each variable from `.env.local`

### 3. Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📱 PWA Configuration

### 1. Manifest File
Update `public/manifest.json`:
```json
{
  "name": "Shield AI - AI-powered apologetics companion",
  "short_name": "Shield AI",
  "description": "Explore and defend the Christian worldview with AI-powered insights",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en",
  "categories": ["education", "lifestyle", "productivity"],
  "icons": [
    {
      "src": "/logo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 2. Service Worker
Verify `public/sw.js` is properly configured for caching and push notifications.

## 🔔 Push Notifications

### 1. VAPID Keys
Generate VAPID keys for push notifications:
```bash
# Install web-push
npm install web-push -g

# Generate keys
web-push generate-vapid-keys
```

### 2. Service Worker Registration
Ensure service worker is registered in `pages/_app.tsx`.

## 📊 Analytics Setup

### 1. Google Analytics
1. Create GA4 property
2. Add tracking ID to environment variables
3. Configure events in `lib/analytics-service.ts`

### 2. Custom Analytics
Implement custom analytics tracking for:
- User engagement
- Feature usage
- Conversion tracking
- Error monitoring

## 🔍 Monitoring & Logging

### 1. Error Tracking
Set up error tracking with Sentry or similar:
```bash
npm install @sentry/nextjs
```

### 2. Performance Monitoring
Configure Vercel Analytics or similar for performance monitoring.

### 3. Health Checks
Implement health check endpoint at `/api/health`.

## 🧪 Testing

### 1. Unit Tests
```bash
npm run test
```

### 2. Integration Tests
```bash
npm run test:integration
```

### 3. E2E Tests
```bash
npm run test:e2e
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Environment Secrets
Add required secrets to GitHub repository:
- `VERCEL_TOKEN`
- `ORG_ID`
- `PROJECT_ID`

## 🔧 Post-Deployment

### 1. Domain Configuration
1. Add custom domain in Vercel
2. Configure DNS records
3. Set up SSL certificate

### 2. CDN Configuration
Configure CDN for static assets:
- Images
- Fonts
- JavaScript bundles

### 3. Database Optimization
1. Set up database backups
2. Configure connection pooling
3. Monitor query performance

### 4. Rate Limiting
Implement rate limiting for API endpoints:
```javascript
// Example with express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Environment Variables
- Ensure all variables are set in Vercel
- Check for typos in variable names
- Verify API keys are valid

#### 2. Database Connection
- Verify Supabase URL and keys
- Check RLS policies
- Monitor connection limits

#### 3. AI Service Errors
- Verify OpenAI/Anthropic API keys
- Check rate limits
- Monitor usage quotas

#### 4. Payment Issues
- Verify Stripe webhook configuration
- Check webhook endpoint URL
- Monitor payment logs

### Debug Commands
```bash
# Check build locally
npm run build

# Test API endpoints
curl https://your-domain.com/api/health

# Check environment variables
vercel env ls

# View deployment logs
vercel logs
```

## 📈 Performance Optimization

### 1. Image Optimization
- Use Next.js Image component
- Implement lazy loading
- Optimize image formats

### 2. Code Splitting
- Implement dynamic imports
- Use React.lazy for components
- Optimize bundle size

### 3. Caching Strategy
- Implement service worker caching
- Use CDN for static assets
- Configure database query caching

## 🔒 Security Checklist

- [ ] Environment variables secured
- [ ] API keys rotated regularly
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF protection configured
- [ ] Security headers set

## 📞 Support

### Getting Help
- **Documentation**: Check project README
- **Issues**: Create GitHub issue
- **Discord**: Join community server
- **Email**: Contact support team

### Monitoring Tools
- **Vercel Analytics**: Performance monitoring
- **Supabase Dashboard**: Database monitoring
- **Stripe Dashboard**: Payment monitoring
- **Sentry**: Error tracking

---

**🎉 Congratulations!** Your Shield AI deployment is now live and ready to serve the global Christian community.

*For additional support, refer to the project documentation or contact the development team.* 