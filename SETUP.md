# 🛡️ Shield AI - Setup Guide

## 🚀 Quick Setup

### 1. Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp env.example .env.local
   ```

2. **Fill in your API keys in `.env.local`:**
   ```bash
   # OpenAI (Required)
   OPENAI_API_KEY=sk-your-openai-key-here
   
   # Anthropic Claude (Required)
   ANTHROPIC_API_KEY=sk-ant-your-claude-key-here
   
   # Pinecone (Required for vector search)
   PINECONE_API_KEY=your-pinecone-key-here
   PINECONE_ENVIRONMENT=your-environment-here
   PINECONE_INDEX_NAME=shieldai-apologetics
   ```

### 2. API Key Setup

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key to your `.env.local` file

#### Anthropic Claude API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key to your `.env.local` file

#### Pinecone Vector Database
1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create an account or sign in
3. Create a new index:
   - **Name**: `shieldai-apologetics`
   - **Dimensions**: `1536` (for OpenAI embeddings)
   - **Metric**: `cosine`
4. Copy your API key and environment to `.env.local`

### 3. Database Setup (Optional)

#### Option A: Supabase (Recommended)
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Get your project URL and anon key
4. Add to `.env.local`:
   ```
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   ```

#### Option B: PostgreSQL
1. Set up a PostgreSQL database
2. Add connection string to `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/shieldai
   ```

### 4. Run the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3001` to see Shield AI in action!

## 🔧 Configuration Options

### AI Models
- **Fast Mode**: Uses Claude 3 Haiku for quick responses
- **Accurate Mode**: Uses GPT-4 Turbo for detailed analysis

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4 |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key for Claude |
| `PINECONE_API_KEY` | ✅ | Pinecone API key for vector search |
| `PINECONE_ENVIRONMENT` | ✅ | Pinecone environment (e.g., "us-east-1-aws") |
| `PINECONE_INDEX_NAME` | ✅ | Pinecone index name |
| `SUPABASE_URL` | ❌ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ❌ | Supabase anonymous key |
| `DATABASE_URL` | ❌ | PostgreSQL connection string |

## 🧪 Testing the Setup

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Test the API:**
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What is the problem of evil?", "mode": "fast"}'
   ```

3. **Check the UI:**
   - Open `http://localhost:3001`
   - Try asking a theological question
   - Test both Fast and Accurate modes

## 🚨 Troubleshooting

### Common Issues

1. **"Missing API keys" error:**
   - Ensure all required API keys are in `.env.local`
   - Restart the development server after adding keys

2. **"Rate limit exceeded":**
   - Check your API usage in the respective platforms
   - Consider upgrading your API plans

3. **"Pinecone index not found":**
   - Verify your Pinecone index name matches exactly
   - Ensure the index is created in the correct environment

### Environment Validation

The app includes automatic environment validation. Check the console for any missing variables when starting the server.

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use environment-specific API keys for production
- Consider using API key rotation for enhanced security
- Monitor API usage to control costs

## 📚 Next Steps

After setup, you can:
1. **Add more AI models** to the chat API
2. **Implement user authentication** with Supabase Auth
3. **Add conversation history** to the database
4. **Create custom embeddings** for apologetics content
5. **Deploy to Vercel** for production use

---

**Need help?** Check the console for detailed error messages or refer to the API documentation for each service. 