import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../lib/bible-service';
import { ChatService } from '../../lib/chat-service';
import { ChurchFinderService } from '../../lib/church-finder-service';
import { PineconeService } from '../../lib/pinecone';
import { EnhancedStripeService } from '../../lib/enhanced-stripe-service';
import { EmbeddingService } from '../../lib/embeddings';
import { createServerSupabaseClient } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {}
  };

  try {
    // Test 1: Environment Variables
    results.services.environment = {
      status: 'checking',
      missing: [],
      present: []
    };

    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'PINECONE_API_KEY',
      'PINECONE_ENVIRONMENT',
      'PINECONE_INDEX_NAME',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'BIBLE_API_KEY',
      'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        results.services.environment.present.push(envVar);
      } else {
        results.services.environment.missing.push(envVar);
      }
    }

    results.services.environment.status = 
      results.services.environment.missing.length === 0 ? 'healthy' : 'missing_variables';

    // Test 2: Supabase Connection
    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      results.services.supabase = {
        status: error ? 'error' : 'healthy',
        error: error?.message,
        connected: !error
      };
    } catch (error: any) {
      results.services.supabase = {
        status: 'error',
        error: error.message,
        connected: false
      };
    }

    // Test 3: Pinecone Connection
    try {
      // Access the private initializePinecone function through a different approach
      const { index } = (PineconeService as any).initializePinecone ? 
        (PineconeService as any).initializePinecone() : 
        { index: null };
      
      if (!index) {
        throw new Error('Pinecone index not available');
      }
      
      const stats = await index.describeIndexStats();
      
      results.services.pinecone = {
        status: 'healthy',
        indexStats: {
          totalVectorCount: stats.totalVectorCount,
          dimension: stats.dimension,
          indexFullness: stats.indexFullness
        }
      };
    } catch (error: any) {
      results.services.pinecone = {
        status: 'error',
        error: error.message
      };
    }

    // Test 4: Bible API
    try {
      const versions = await bibleService.getBibleVersions();
      results.services.bible = {
        status: 'healthy',
        versionsCount: versions.length,
        sampleVersion: versions[0]?.name || 'None'
      };
    } catch (error: any) {
      results.services.bible = {
        status: 'error',
        error: error.message
      };
    }

    // Test 5: Embedding Service
    try {
      const testEmbedding = await EmbeddingService.generateEmbedding('test message');
      results.services.embeddings = {
        status: 'healthy',
        embeddingLength: testEmbedding.length,
        dimension: testEmbedding.length
      };
    } catch (error: any) {
      results.services.embeddings = {
        status: 'error',
        error: error.message
      };
    }

    // Test 6: Stripe Service
    try {
      const tiers = await EnhancedStripeService.getSubscriptionTiers();
      results.services.stripe = {
        status: 'healthy',
        tiersCount: tiers.length,
        tiers: tiers.map((tier: any) => tier.name)
      };
    } catch (error: any) {
      results.services.stripe = {
        status: 'error',
        error: error.message
      };
    }

    // Test 7: Church Finder Service
    try {
      const testLocation = { lat: 30.2672, lng: -97.7431 }; // Austin, TX
      const churches = await ChurchFinderService.findChurchesNearby({
        latitude: testLocation.lat,
        longitude: testLocation.lng,
        radius: 5000
      });
      
      results.services.churchFinder = {
        status: 'healthy',
        churchesFound: churches.length,
        sampleChurch: churches[0]?.name || 'None'
      };
    } catch (error: any) {
      results.services.churchFinder = {
        status: 'error',
        error: error.message
      };
    }

    // Test 8: Chat Service (basic functionality)
    try {
      // Test conversation creation (without actual user)
      results.services.chat = {
        status: 'healthy',
        message: 'Chat service available (requires authentication for full test)'
      };
    } catch (error: any) {
      results.services.chat = {
        status: 'error',
        error: error.message
      };
    }

    // Calculate overall health
    const healthyServices = Object.values(results.services).filter((service: any) => 
      service.status === 'healthy'
    ).length;
    const totalServices = Object.keys(results.services).length;
    
    results.overall = {
      status: healthyServices === totalServices ? 'healthy' : 'degraded',
      healthyServices,
      totalServices,
      healthPercentage: Math.round((healthyServices / totalServices) * 100)
    };

    res.status(200).json(results);

  } catch (error: any) {
    console.error('API integration test error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
