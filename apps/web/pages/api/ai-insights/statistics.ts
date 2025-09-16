import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `insights_statistics_${Date.now()}`);
  
  if (req.method !== 'GET') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/statistics', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from auth token (with fallback for testing)
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check for test token first
      if (token === 'test-token') {
        user = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
          name: 'Test User'
        };
        logger.info('Using test user for insights statistics', { cid, userId: user.id });
      } else {
        try {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
          
          if (authError || !authUser) {
            return res.status(401).json({ error: 'Invalid authentication token' });
          }
          user = authUser;
        } catch (error) {
          logger.error('Authentication failed', { cid }, error);
          return res.status(401).json({ error: 'Authentication failed' });
        }
      }
    } else {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Get comprehensive statistics
    const [
      { data: stats, error: statsError },
      { data: monthlyData, error: monthlyError },
      { data: versionData, error: versionError },
      { data: themeData, error: themeError },
      { data: tagData, error: tagError },
      { data: recentData, error: recentError }
    ] = await Promise.all([
      // Basic statistics
      supabase
        .from('ai_insights_stats')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      
      // Monthly insights count for chart
      supabase
        .from('ai_insights')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      
      // Bible version usage
      supabase
        .from('ai_insights')
        .select('bible_version')
        .eq('user_id', user.id),
      
      // Most common themes
      supabase
        .from('ai_insights')
        .select('key_themes')
        .eq('user_id', user.id),
      
      // Most common tags
      supabase
        .from('ai_insights')
        .select('tags')
        .eq('user_id', user.id),
      
      // Recent activity (last 30 days)
      supabase
        .from('ai_insights')
        .select('created_at, passage_reference')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
    ]);

    // Handle errors
    if (statsError && statsError.code !== 'PGRST116') {
      logger.error('Failed to get insights stats', { cid, error: statsError.message, user_id: user.id });
    }
    if (monthlyError) {
      logger.error('Failed to get monthly data', { cid, error: monthlyError.message, user_id: user.id });
    }
    if (versionError) {
      logger.error('Failed to get version data', { cid, error: versionError.message, user_id: user.id });
    }
    if (themeError) {
      logger.error('Failed to get theme data', { cid, error: themeError.message, user_id: user.id });
    }
    if (tagError) {
      logger.error('Failed to get tag data', { cid, error: tagError.message, user_id: user.id });
    }
    if (recentError) {
      logger.error('Failed to get recent data', { cid, error: recentError.message, user_id: user.id });
    }

    // Process monthly data for chart
    const monthlyStats = new Map<string, number>();
    monthlyData?.forEach(insight => {
      const month = new Date(insight.created_at).toISOString().substring(0, 7); // YYYY-MM
      monthlyStats.set(month, (monthlyStats.get(month) || 0) + 1);
    });

    const chartData = Array.from(monthlyStats.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Process version usage
    const versionCounts = new Map<string, number>();
    versionData?.forEach(insight => {
      if (insight.bible_version) {
        versionCounts.set(insight.bible_version, (versionCounts.get(insight.bible_version) || 0) + 1);
      }
    });

    const versionStats = Array.from(versionCounts.entries())
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count);

    // Process theme usage
    const themeCounts = new Map<string, number>();
    themeData?.forEach(insight => {
      insight.key_themes?.forEach((theme: string) => {
        themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
      });
    });

    const themeStats = Array.from(themeCounts.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 themes

    // Process tag usage
    const tagCounts = new Map<string, number>();
    tagData?.forEach(insight => {
      insight.tags?.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const tagStats = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 tags

    // Process recent activity
    const recentActivity = recentData?.map(insight => ({
      date: insight.created_at,
      passage: insight.passage_reference
    })) || [];

    // Calculate additional metrics
    const totalInsights = stats?.total_insights || 0;
    const favoriteInsights = stats?.favorite_insights || 0;
    const sharedInsights = stats?.shared_insights || 0;
    const recentInsights = stats?.recent_insights || 0;
    const uniquePassages = stats?.unique_passages || 0;
    const uniqueVersions = stats?.unique_versions || 0;

    // Calculate engagement metrics
    const engagementRate = totalInsights > 0 ? (favoriteInsights / totalInsights) * 100 : 0;
    const sharingRate = totalInsights > 0 ? (sharedInsights / totalInsights) * 100 : 0;
    const activityRate = totalInsights > 0 ? (recentInsights / totalInsights) * 100 : 0;

    logger.info('Insights statistics retrieved successfully', { 
      cid, 
      user_id: user.id, 
      total_insights: totalInsights,
      favorite_insights: favoriteInsights,
      shared_insights: sharedInsights
    });

    res.status(200).json({
      success: true,
      statistics: {
        overview: {
          total_insights: totalInsights,
          favorite_insights: favoriteInsights,
          shared_insights: sharedInsights,
          recent_insights: recentInsights,
          unique_passages: uniquePassages,
          unique_versions: uniqueVersions,
          last_activity: stats?.last_activity || null
        },
        engagement: {
          engagement_rate: Math.round(engagementRate * 100) / 100,
          sharing_rate: Math.round(sharingRate * 100) / 100,
          activity_rate: Math.round(activityRate * 100) / 100
        },
        chart_data: chartData,
        version_usage: versionStats,
        popular_themes: themeStats,
        popular_tags: tagStats,
        recent_activity: recentActivity,
        versions_used: stats?.versions_used || []
      }
    });

  } catch (error) {
    logger.error('Error getting insights statistics', { cid }, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

