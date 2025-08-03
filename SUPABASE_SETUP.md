# 🛡️ Shield AI - Supabase & JWT Setup Guide

## 🚀 Step-by-Step Supabase Configuration

### 1. Create Supabase Project

1. **Go to [Supabase](https://supabase.com/)**
2. **Sign up/Login** with your account
3. **Create New Project:**
   - **Name**: `shieldai`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier (or Pro if needed)

### 2. Get Your Supabase Credentials

1. **Go to Project Settings** (gear icon in sidebar)
2. **Navigate to API tab**
3. **Copy these values:**
   - **Project URL** (starts with `https://`)
   - **Anon/Public Key** (starts with `eyJ`)

### 3. Set Up Environment Variables

Add these to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# JWT Secret (Generate a secure one)
JWT_SECRET=your-super-secure-jwt-secret-key-here
```

### 4. Set Up Database Schema

1. **Go to SQL Editor** in Supabase dashboard
2. **Copy and paste** the entire contents of `database/schema.sql`
3. **Click "Run"** to execute the schema

### 5. Configure Authentication

1. **Go to Authentication > Settings**
2. **Configure Email Templates:**
   - **Confirm signup**: Customize welcome message
   - **Reset password**: Customize reset message
3. **Enable Email Confirmations** (recommended)
4. **Set up SMTP** (optional, for custom email domain)

### 6. Set Up Row Level Security (RLS)

The schema already includes RLS policies, but verify:

1. **Go to Authentication > Policies**
2. **Ensure RLS is enabled** for all tables
3. **Verify policies** are created correctly

## 🔐 JWT Configuration

### Generate Secure JWT Secret

```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

### Update JWT Secret in Supabase

1. **Go to SQL Editor**
2. **Run this command:**
   ```sql
   ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-generated-jwt-secret';
   ```

## 🧪 Testing the Setup

### 1. Test User Registration

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### 2. Test User Login

```bash
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Protected API

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "What is the problem of evil?",
    "mode": "fast"
  }'
```

## 🔧 Environment Variables Checklist

Make sure your `.env.local` has all these:

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
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development
```

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid JWT" errors:**
   - Ensure JWT_SECRET is set correctly
   - Check that the secret matches in Supabase

2. **"RLS policy violation":**
   - Verify RLS policies are created
   - Check user authentication status

3. **"Supabase client not initialized":**
   - Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Restart development server

4. **"Database connection failed":**
   - Check Supabase project status
   - Verify database password

### Debug Steps

1. **Check Supabase Dashboard:**
   - Go to Authentication > Users
   - Verify user creation

2. **Check Database Tables:**
   - Go to Table Editor
   - Verify tables are created

3. **Check API Logs:**
   - Monitor browser console
   - Check server logs

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use different JWT secrets** for development/production
3. **Enable email confirmations** for production
4. **Set up proper CORS** for production deployment
5. **Monitor API usage** and set rate limits

## 📚 Next Steps

After setup, you can:

1. **Add user profiles** with avatars and preferences
2. **Implement conversation history** persistence
3. **Add user preferences** for AI model selection
4. **Create admin dashboard** for user management
5. **Add analytics** for conversation insights

---

**Need help?** Check the Supabase documentation or the console for detailed error messages. 