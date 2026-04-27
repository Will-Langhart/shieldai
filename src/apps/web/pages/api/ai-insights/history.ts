import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';
import { createClient } from '@supabase/supabase-js';

// Service role client that bypasses RLS
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'your_supabase_service_role_key') {
    // Fallback to regular client if service role key is not available
    return supabase;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `insights_history_${Date.now()}`);
  
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/history', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      limit = '50',
      offset = '0',
      sort_by = 'created_at',
      sort_order = 'desc',
      search_query,
      bible_version,
      tags,
      key_themes,
      is_favorite,
      is_shared,
      date_from,
      date_to,
      passage_reference
    } = req.query;

    // Get authenticated user
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      {
        try {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
          
          if (authError || !authUser) {
            logger.error('Authentication failed', { cid, error: authError?.message });
            return res.status(401).json({ error: 'Invalid authentication token' });
          }
          user = authUser;
          logger.info('Authenticated user', { cid, userId: user.id, email: user.email });
        } catch (error) {
          logger.error('Authentication failed', { cid }, error);
          return res.status(401).json({ error: 'Authentication failed' });
        }
      }
    } else {
      logger.warn('No authorization header provided', { cid });
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Parse array parameters
    const tagsArray = tags ? (Array.isArray(tags) ? tags : [tags]) : null;
    const keyThemesArray = key_themes ? (Array.isArray(key_themes) ? key_themes : [key_themes]) : null;
    const isFavorite = is_favorite === 'true' ? true : is_favorite === 'false' ? false : null;
    const isShared = is_shared === 'true' ? true : is_shared === 'false' ? false : null;

    // Parse date parameters
    const dateFrom = date_from ? new Date(date_from as string) : null;
    const dateTo = date_to ? new Date(date_to as string) : null;

    // Use service client to ensure we can retrieve insights for all users
    const serviceClient = createServiceClient();
    
    // Use the authenticated user's ID directly
    logger.info('Retrieving insights for authenticated user', { cid, user_id: user.id });
    
    // Use the search function from the database
    const { data: insights, error: searchError } = await serviceClient
      .rpc('search_ai_insights', {
        p_user_id: user.id,
        p_search_query: search_query as string || null,
        p_passage_reference: passage_reference as string || null,
        p_bible_version: bible_version as string || null,
        p_tags: tagsArray,
        p_key_themes: keyThemesArray,
        p_is_favorite: isFavorite,
        p_is_shared: isShared,
        p_date_from: dateFrom?.toISOString() || null,
        p_date_to: dateTo?.toISOString() || null,
        p_limit: parseInt(limit as string) || 50,
        p_offset: parseInt(offset as string) || 0
      });

    if (searchError) {
      logger.error('Failed to get insights history', { cid, error: searchError.message, user_id: user.id });
      return res.status(500).json({ error: 'Failed to get insights history' });
    }

    // Get insights statistics
    const { data: stats, error: statsError } = await serviceClient
      .from('ai_insights_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Failed to get insights stats', { cid, error: statsError.message, user_id: user.id });
    }

    // Get unique tags and themes for filtering
    const { data: uniqueData, error: uniqueError } = await serviceClient
      .from('ai_insights')
      .select('tags, key_themes, bible_version')
      .eq('user_id', user.id);

    if (uniqueError) {
      logger.error('Failed to get unique data', { cid, error: uniqueError.message, user_id: user.id });
    }

    // Process unique data for filters
    const allTags = new Set<string>();
    const allThemes = new Set<string>();
    const allVersions = new Set<string>();

    uniqueData?.forEach((insight: any) => {
      insight.tags?.forEach((tag: string) => allTags.add(tag));
      insight.key_themes?.forEach((theme: string) => allThemes.add(theme));
      if (insight.bible_version) allVersions.add(insight.bible_version);
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentInsights, error: recentError } = await serviceClient
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      logger.error('Failed to get recent insights', { cid, error: recentError.message, user_id: user.id });
    }

    // Get favorite insights
    const { data: favoriteInsights, error: favoriteError } = await serviceClient
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (favoriteError) {
      logger.error('Failed to get favorite insights', { cid, error: favoriteError.message, user_id: user.id });
    }

    // Get shared insights
    const { data: sharedInsights, error: sharedError } = await serviceClient
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_shared', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (sharedError) {
      logger.error('Failed to get shared insights', { cid, error: sharedError.message, user_id: user.id });
    }

    // Get insights by month for chart data
    const { data: monthlyData, error: monthlyError } = await serviceClient
      .from('ai_insights')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (monthlyError) {
      logger.error('Failed to get monthly data', { cid, error: monthlyError.message, user_id: user.id });
    }

    // Process monthly data for chart
    const monthlyStats = new Map<string, number>();
    monthlyData?.forEach((insight: any) => {
      const month = new Date(insight.created_at).toISOString().substring(0, 7); // YYYY-MM
      monthlyStats.set(month, (monthlyStats.get(month) || 0) + 1);
    });

    const chartData = Array.from(monthlyStats.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    logger.info('Insights history retrieved successfully', { 
      cid, 
      user_id: user.id, 
      result_count: insights?.length || 0,
      stats: stats,
      filters: { search_query, bible_version, tags, key_themes, is_favorite, is_shared }
    });

    res.status(200).json({
      success: true,
      insights: insights || [],
      count: insights?.length || 0,
      statistics: stats || {
        user_id: user.id,
        total_insights: 0,
        favorite_insights: 0,
        shared_insights: 0,
        recent_insights: 0,
        unique_passages: 0,
        unique_versions: 0,
        versions_used: [],
        last_activity: null
      },
      filters: {
        tags: Array.from(allTags).sort(),
        themes: Array.from(allThemes).sort(),
        versions: Array.from(allVersions).sort()
      },
      recent_activity: recentInsights || [],
      favorites: favoriteInsights || [],
      shared: sharedInsights || [],
      chart_data: chartData,
      metadata: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sort_by,
        sort_order,
        search_query,
        bible_version,
        tags: tagsArray,
        key_themes: keyThemesArray,
        is_favorite,
        is_shared,
        date_from: dateFrom?.toISOString(),
        date_to: dateTo?.toISOString(),
        passage_reference
      }
    });

  } catch (error) {
    logger.error('Error getting insights history', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

