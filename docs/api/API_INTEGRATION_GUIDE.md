# Shield AI - API Integration Guide

This guide provides comprehensive information about all API services integrated into Shield AI and how to verify they are working correctly.

## Overview

Shield AI integrates with multiple external services to provide a comprehensive AI-powered Bible study and apologetics platform:

- **OpenAI API**: AI conversation and text generation
- **Pinecone**: Vector database for memory and similarity search
- **Supabase**: Database and authentication
- **Stripe**: Payment processing and subscriptions
- **Bible API**: Scripture content and search
- **Google Places API**: Church finder functionality

## Service Integration Status

### ✅ Core Services (Required)

| Service | Status | Purpose | Health Check |
|---------|--------|---------|--------------|
| OpenAI API | ✅ Integrated | AI conversations and responses | `/api/test-api-integration` |
| Pinecone | ✅ Integrated | Vector embeddings and memory | `/api/test-api-integration` |
| Supabase | ✅ Integrated | Database and authentication | `/api/test-api-integration` |
| Bible API | ✅ Integrated | Scripture content | `/api/bible/*` endpoints |

### ✅ Payment & Subscription Services

| Service | Status | Purpose | Health Check |
|---------|--------|---------|--------------|
| Stripe | ✅ Integrated | Payment processing | `/api/subscriptions/*` endpoints |
| Enhanced Stripe | ✅ Integrated | Subscription management | `/api/subscriptions/tiers` |

### ✅ Location Services

| Service | Status | Purpose | Health Check |
|---------|--------|---------|--------------|
| Google Places API | ✅ Integrated | Church finder | `/api/churches/search` |

## Environment Variables Required

All services require proper environment variable configuration:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=shieldai

# Database Configuration (Supabase)
DATABASE_URL=your_database_url_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Bible API Configuration
BIBLE_API_KEY=your_bible_api_key_here
BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development
```

## API Endpoints Overview

### Core Chat & AI Services

- **`POST /api/chat`**: Main AI conversation endpoint
- **`GET /api/test-api-integration`**: Comprehensive service health check
- **`GET /api/health`**: Basic health check

### Bible Services

- **`GET /api/bible/versions`**: Get available Bible versions
- **`GET /api/bible/search`**: Search Bible content
- **`GET /api/bible/passage`**: Get specific Bible passage
- **`GET /api/bible/popular`**: Get popular verses
- **`GET /api/bible/daily-verse`**: Get daily verse
- **`GET /api/bible/suggestions`**: Get verse suggestions
- **`GET /api/bible/advanced-search`**: Advanced Bible search
- **`GET /api/bible/cross-references`**: Get cross-references
- **`GET /api/bible/concordance`**: Get concordance
- **`GET /api/bible/apologetics`**: Get apologetics content
- **`GET /api/bible/context`**: Get verse context
- **`GET /api/bible/preferences`**: Get user preferences
- **`POST /api/bible/notes`**: Save Bible notes

### Subscription & Payment Services

- **`GET /api/subscriptions/plans`**: Get subscription plans
- **`GET /api/subscriptions/tiers`**: Get subscription tiers
- **`GET /api/subscriptions/status`**: Get user subscription status
- **`POST /api/subscriptions/create`**: Create subscription
- **`POST /api/subscriptions/cancel`**: Cancel subscription
- **`POST /api/subscriptions/reactivate`**: Reactivate subscription
- **`GET /api/subscriptions/usage`**: Get usage metrics
- **`POST /api/subscriptions/check-feature`**: Check feature access
- **`POST /api/subscriptions/promo-code`**: Apply promo code
- **`POST /api/subscriptions/referral`**: Process referral

### Church Finder Services

- **`POST /api/churches/search`**: Search for churches nearby

### Memory & Analytics Services

- **`GET /api/memory/search`**: Search conversation memory
- **`GET /api/memory/stats`**: Get memory statistics
- **`GET /api/analytics`**: Get analytics data
- **`POST /api/feedback`**: Submit feedback

### Pinecone Vector Database

- **`GET /api/pinecone/stats`**: Get Pinecone statistics
- **`GET /api/pinecone/indexes`**: List Pinecone indexes
- **`POST /api/pinecone/seed`**: Seed vector database
- **`GET /api/pinecone/env`**: Check Pinecone environment

## Verification Scripts

### 1. Quick Health Check

Run the comprehensive API integration test:

```bash
# Start the development server
npm run dev

# In another terminal, test the API integration
curl http://localhost:3001/api/test-api-integration
```

### 2. Automated Verification Script

Use the automated verification script:

```bash
# Make the script executable
chmod +x scripts/verify-api-integration.js

# Run the verification
node scripts/verify-api-integration.js
```

### 3. Manual Service Checks

#### Check OpenAI Integration
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Hello", "mode": "fast"}'
```

#### Check Bible API
```bash
curl http://localhost:3001/api/bible/versions
curl http://localhost:3001/api/bible/popular
```

#### Check Subscription Services
```bash
curl http://localhost:3001/api/subscriptions/plans
curl http://localhost:3001/api/subscriptions/tiers
```

#### Check Church Finder
```bash
curl -X POST http://localhost:3001/api/churches/search \
  -H "Content-Type: application/json" \
  -d '{"latitude": 30.2672, "longitude": -97.7431, "radius": 5000}'
```

## Troubleshooting Common Issues

### 1. Environment Variables Missing

**Symptoms**: Services return 500 errors or "Missing configuration" errors

**Solution**: 
1. Copy `env.example` to `.env.local`
2. Fill in all required API keys
3. Restart the development server

### 2. Pinecone Connection Issues

**Symptoms**: Vector search fails or memory features don't work

**Solution**:
1. Verify `PINECONE_API_KEY` is correct
2. Check `PINECONE_ENVIRONMENT` matches your index
3. Ensure `PINECONE_INDEX_NAME` exists
4. Test with: `curl http://localhost:3001/api/pinecone/stats`

### 3. Bible API Issues

**Symptoms**: Bible search and verse retrieval fails

**Solution**:
1. Verify `BIBLE_API_KEY` is valid
2. Check API quota and limits
3. Test with: `curl http://localhost:3001/api/bible/versions`

### 4. Stripe Integration Issues

**Symptoms**: Payment processing fails or subscription features don't work

**Solution**:
1. Verify Stripe keys are correct (test vs live)
2. Check webhook configuration
3. Test with: `curl http://localhost:3001/api/subscriptions/plans`

### 5. Supabase Connection Issues

**Symptoms**: Authentication fails or database operations error

**Solution**:
1. Verify Supabase URL and keys
2. Check database schema is properly set up
3. Test with: `curl http://localhost:3001/api/health`

## Service-Specific Configuration

### OpenAI Configuration

```typescript
// lib/chat-service.ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Required**: `OPENAI_API_KEY`
**Optional**: `OPENAI_MODEL` (defaults to gpt-4-turbo-preview)

### Pinecone Configuration

```typescript
// lib/pinecone.ts
const pc = new Pinecone({ 
  apiKey: process.env.PINECONE_API_KEY, 
  environment: process.env.PINECONE_ENVIRONMENT 
});
```

**Required**: 
- `PINECONE_API_KEY`
- `PINECONE_ENVIRONMENT`
- `PINECONE_INDEX_NAME`

### Supabase Configuration

```typescript
// lib/supabase.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Stripe Configuration

```typescript
// lib/enhanced-stripe-service.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
```

**Required**:
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Bible API Configuration

```typescript
// lib/bible-service.ts
this.apiKey = process.env.BIBLE_API_KEY || '';
this.baseUrl = process.env.BIBLE_API_BASE_URL || 'https://api.scripture.api.bible/v1';
```

**Required**: `BIBLE_API_KEY`
**Optional**: `BIBLE_API_BASE_URL`

### Google Places Configuration

```typescript
// lib/church-finder-service.ts
private static GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
```

**Required**: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

## Monitoring and Logs

### Log Locations

- **Application logs**: `logs/server/`
- **Vercel logs**: `logs/vercel/`
- **NPM logs**: `logs/npm/`
- **Debug logs**: `logs/debug/`

### Health Monitoring

1. **Real-time monitoring**: Use the verification script regularly
2. **Error tracking**: Monitor application logs
3. **Performance metrics**: Check API response times
4. **Usage analytics**: Monitor service quotas

## Best Practices

### 1. Environment Management

- Use `.env.local` for local development
- Use Vercel environment variables for production
- Never commit API keys to version control
- Use different keys for development and production

### 2. Error Handling

- All services include comprehensive error handling
- Graceful degradation when services are unavailable
- Detailed error logging for debugging
- User-friendly error messages

### 3. Rate Limiting

- Implement rate limiting for API endpoints
- Monitor service quotas
- Handle rate limit errors gracefully
- Provide user feedback for quota limits

### 4. Security

- Validate all API inputs
- Use HTTPS in production
- Implement proper authentication
- Sanitize user inputs

## Support and Resources

### Documentation

- [API Documentation](./README.md)
- [Deployment Guide](../deployment/README.md)
- [Setup Guide](../setup/README.md)

### Troubleshooting

- Check logs in `logs/` directory
- Use the verification script for diagnostics
- Monitor service health endpoints
- Review error messages in browser console

### Getting Help

1. Run the verification script to identify issues
2. Check environment variable configuration
3. Review service-specific documentation
4. Monitor application logs for errors
5. Test individual API endpoints

## Conclusion

This guide provides comprehensive information for verifying and maintaining all API integrations in Shield AI. Regular monitoring and testing ensure all services remain healthy and functional for users.

For additional support or questions, refer to the individual service documentation or run the automated verification script for diagnostics.

