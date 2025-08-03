# 🚀 Shield AI - Deployment Guide

## 📋 Prerequisites

- GitHub account
- Vercel account
- Supabase project (already configured)
- All API keys ready

## 🔧 Step 1: GitHub Repository Setup

### 1. Create GitHub Repository

1. **Go to [GitHub](https://github.com)**
2. **Create new repository:**
   - **Name**: `shieldai`
   - **Description**: AI-powered apologetics companion
   - **Visibility**: Public or Private
   - **Initialize**: Don't add README (we have one)

### 2. Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Shield AI - AI-powered apologetics companion"

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/shieldai.git

# Push to main branch
git push -u origin main
```

### 3. Create Branch Structure

```bash
# Create and push dev branch
git checkout -b dev
git push -u origin dev

# Create and push prod branch
git checkout -b prod
git push -u origin prod

# Return to main
git checkout main
```

## 🌐 Step 2: Vercel Deployment

### 1. Connect to Vercel

1. **Go to [Vercel](https://vercel.com)**
2. **Import your GitHub repository**
3. **Configure project settings:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2. Set Environment Variables in Vercel

Add these environment variables in Vercel dashboard:

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

### 3. Get Vercel Credentials

1. **Go to Vercel Dashboard > Settings > General**
2. **Copy:**
   - **Project ID**
   - **Team ID** (if using team)
3. **Go to Account Settings > Tokens**
4. **Create new token** with full access

## 🔐 Step 3: GitHub Secrets Setup

### 1. Add Repository Secrets

Go to your GitHub repository > Settings > Secrets and variables > Actions

Add these secrets:

```bash
# Vercel
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_team_id_here
VERCEL_PROJECT_ID=your_project_id_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yyfhspfqncogzitfpfbw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI
OPENAI_API_KEY=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

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Pinecone
PINECONE_API_KEY=pcsk_7EHeL4_MwuoUVnDmfAXDetkY8XzmJmaqcCHj2eeYyQ8j5pgrRvRGFm41NmaypZ9WsxGYa7
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=shieldai

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here
```

## 🔄 Step 4: Branch Strategy

### Development Workflow

```bash
# For new features
git checkout dev
git pull origin dev
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature
# Create PR to dev branch

# For hotfixes
git checkout main
git checkout -b hotfix/urgent-fix
# ... make changes ...
git commit -m "Fix urgent issue"
git push origin hotfix/urgent-fix
# Create PR to main branch
```

### Deployment Flow

- **`dev` branch** → Deploys to Vercel preview
- **`main` branch** → Deploys to production
- **`prod` branch** → Backup production branch

## 🧪 Step 5: Testing Deployment

### 1. Test Development Deployment

```bash
# Push to dev branch
git checkout dev
git merge main
git push origin dev
```

Check Vercel dashboard for dev deployment.

### 2. Test Production Deployment

```bash
# Push to main branch
git checkout main
git merge dev
git push origin main
```

Check Vercel dashboard for production deployment.

## 🔍 Step 6: Monitoring & Debugging

### 1. Vercel Analytics

- **Go to Vercel Dashboard > Analytics**
- **Monitor:**
  - Page views
  - Performance
  - Errors

### 2. GitHub Actions

- **Check Actions tab** in GitHub
- **Monitor:**
  - Build status
  - Test results
  - Deployment logs

### 3. Supabase Monitoring

- **Go to Supabase Dashboard**
- **Monitor:**
  - Database performance
  - Authentication logs
  - API usage

## 🚨 Troubleshooting

### Common Issues

1. **Build fails:**
   - Check environment variables
   - Verify API keys
   - Check TypeScript errors

2. **Deployment fails:**
   - Verify Vercel configuration
   - Check GitHub secrets
   - Review build logs

3. **Database connection fails:**
   - Verify Supabase credentials
   - Check network connectivity
   - Review RLS policies

### Debug Commands

```bash
# Local testing
npm run build
npm run start

# Check environment
echo $NEXT_PUBLIC_SUPABASE_URL

# Test API endpoints
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "mode": "fast"}'
```

## 📚 Next Steps

After deployment:

1. **Set up custom domain** in Vercel
2. **Configure SSL certificates**
3. **Set up monitoring** (Sentry, LogRocket)
4. **Implement analytics** (Google Analytics, Mixpanel)
5. **Set up backup strategies**

---

**Need help?** Check the Vercel and GitHub documentation for detailed guides. 