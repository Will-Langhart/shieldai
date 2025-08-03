export function validateEnvironment() {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'PINECONE_API_KEY',
    'PINECONE_ENVIRONMENT',
    'PINECONE_INDEX_NAME',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName] || process.env[varName] === 'your_' + varName.replace(/_/g, '').toLowerCase() + '_here'
  );

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please copy env.example to .env.local and fill in your API keys');
    return false;
  }

  console.log('✅ Environment variables validated successfully');
  return true;
}

export function getEnvironmentConfig() {
  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    },
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
      indexName: process.env.PINECONE_INDEX_NAME!,
    },
    database: {
      url: process.env.DATABASE_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
      environment: process.env.NODE_ENV || 'development',
    },
  };
} 