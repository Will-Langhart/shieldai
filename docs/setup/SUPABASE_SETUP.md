# Supabase Setup Guide for Shield AI

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `shieldai`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### 3. Configure Environment Variables

#### For Local Development:
1. Copy `.env.example` to `.env.local`
2. Update the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### For Production (Vercel):
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `database/schema.sql`
3. Paste it into the SQL editor
4. Click "Run" to execute the schema

### 5. Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:

#### Email Templates:
- **Confirm signup**: Customize the email template
- **Reset password**: Customize the email template

#### Site URL:
- Set to your production URL (e.g., `https://your-app.vercel.app`)
- For local development: `http://localhost:3001`

#### Redirect URLs:
- Add your production URL: `https://your-app.vercel.app`
- Add local development URL: `http://localhost:3001`

### 6. Test Authentication

1. Start your development server: `npm run dev`
2. Try to sign up with a test email
3. Check your email for confirmation
4. Sign in with your credentials

## 🔧 Troubleshooting

### Common Issues:

#### 1. "Failed to fetch" Error
- **Cause**: Supabase URL or API key is incorrect
- **Solution**: Double-check your environment variables

#### 2. "Invalid API key" Error
- **Cause**: Wrong API key or project URL
- **Solution**: Verify your Supabase project settings

#### 3. Email Not Received
- **Cause**: Email service not configured
- **Solution**: Check Supabase email settings

#### 4. Database Connection Issues
- **Cause**: Schema not properly set up
- **Solution**: Run the database schema again

### Environment Variables Checklist:

```bash
# Required for Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required for Chat API
OPENAI_API_KEY=sk-...

# Optional for Production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📊 Database Schema Overview

The application uses the following tables:

### `users`
- Extends Supabase auth.users
- Stores user profiles and preferences

### `conversations`
- Stores chat sessions
- Links to user accounts

### `messages`
- Stores individual chat messages
- Links to conversations

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **JWT Authentication**: Secure token-based auth
- **Email Verification**: Required for new accounts
- **Password Reset**: Secure password recovery

## 🚀 Deployment Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema executed
- [ ] Authentication settings configured
- [ ] Email templates customized
- [ ] Site URLs configured
- [ ] Local testing completed
- [ ] Production deployment tested

## 📞 Support

If you encounter issues:

1. Check the Supabase dashboard logs
2. Verify environment variables
3. Test with a fresh browser session
4. Check browser console for errors
5. Review this setup guide

## 🔄 Updates

Keep your Supabase project updated:
- Regularly check for security updates
- Monitor usage and limits
- Backup important data
- Test authentication flows after updates