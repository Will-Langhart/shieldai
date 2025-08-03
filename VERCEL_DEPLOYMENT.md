# 🚀 Shield AI - Vercel Deployment Checklist

## 📋 Quick Deployment Steps

### 1. Create GitHub Repository
```bash
# Run the setup script
./setup-github.sh
```

### 2. Deploy to Vercel

1. **Go to [Vercel](https://vercel.com)**
2. **Click "New Project"**
3. **Import from GitHub:**
   - Select your `shieldai` repository
   - Choose the `prod` branch for production
4. **Configure project:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Set Environment Variables

In Vercel dashboard > Settings > Environment Variables, add:

```bash
# OpenAI
OPENAI_API_KEY=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

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Pinecone
PINECONE_API_KEY=pcsk_7EHeL4_MwuoUVnDmfAXDetkY8XzmJmaqcCHj2eeYyQ8j5pgrRvRGFm41NmaypZ9WsxGYa7
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=shieldai

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yyfhspfqncogzitfpfbw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.yyfhspfqncogzitfpfbw.supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here

# App
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NODE_ENV=production
```

### 4. Deploy

1. **Click "Deploy"**
2. **Wait for build to complete**
3. **Get your HTTPS URL!**

## 🎯 Branch Strategy

- **`main`** → Development/staging
- **`dev`** → Feature development
- **`prod`** → Production deployment

## 🔧 Custom Domain (Optional)

1. **Go to Vercel Dashboard > Domains**
2. **Add custom domain**
3. **Configure DNS records**

## 🧪 Test Your Deployment

```bash
# Test the API
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the problem of evil?", "mode": "fast"}'
```

## 🚨 Troubleshooting

### Build Fails
- Check environment variables
- Verify API keys
- Check TypeScript errors

### API Errors
- Verify all environment variables are set
- Check API key permissions
- Review Vercel function logs

### Database Connection
- Verify Supabase credentials
- Check RLS policies
- Test connection locally first

## 📊 Monitoring

- **Vercel Analytics**: Dashboard > Analytics
- **Function Logs**: Dashboard > Functions
- **Performance**: Dashboard > Performance

---

**Your Shield AI will be live at:** `https://your-domain.vercel.app` 🛡️✨ 