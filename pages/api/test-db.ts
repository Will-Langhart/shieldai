import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    let serverSupabase = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      serverSupabase = createServerSupabaseClient(token);
      const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
      if (!authError && authUser) {
        user = authUser;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user profile exists
    const { data: userProfile, error: userError } = await serverSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User profile doesn't exist, create it
      const { data: newUser, error: createError } = await serverSupabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User'
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ 
          error: 'Failed to create user profile',
          details: createError
        });
      }

      return res.status(200).json({
        message: 'User profile created successfully',
        user: newUser,
        wasCreated: true
      });
    }

    if (userError) {
      return res.status(500).json({ 
        error: 'Failed to check user profile',
        details: userError
      });
    }

    // Check conversations
    const { data: conversations, error: convError } = await serverSupabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id);

    if (convError) {
      return res.status(500).json({ 
        error: 'Failed to get conversations',
        details: convError
      });
    }

    return res.status(200).json({
      message: 'Database check successful',
      user: userProfile,
      conversations: conversations,
      wasCreated: false
    });

  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({ 
      error: 'Database test failed',
      details: error
    });
  }
} 