import { NextApiRequest, NextApiResponse } from 'next';
import { MemoryService } from '../../../lib/memory-service';
import { createServerSupabaseClient } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, conversationId, topK = 10, minScore = 0.7 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get authenticated user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    let serverSupabase: any = undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        serverSupabase = createServerSupabaseClient(token);
        const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
        
        if (authUser) {
          user = authUser;
        } else {
          return res.status(401).json({ error: 'No user found in token' });
        }
      } catch (error) {
        console.error('Error creating Supabase client:', error);
        return res.status(401).json({ error: 'Authentication failed' });
      }
    } else {
      return res.status(401).json({ error: 'Authorization header required' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Search memories
    const memories = await MemoryService.retrieveRelevantMemories(
      query,
      user.id,
      conversationId,
      topK,
      minScore
    );

    return res.status(200).json({
      memories: memories.map(memory => ({
        content: memory.content,
        role: memory.role,
        conversationId: memory.conversationId,
        score: memory.score,
        timestamp: memory.timestamp,
        metadata: memory.metadata,
      })),
      query,
      totalResults: memories.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Memory search API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while searching memories' 
    });
  }
}

