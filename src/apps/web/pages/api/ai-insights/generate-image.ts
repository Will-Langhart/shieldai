import { NextApiRequest, NextApiResponse } from 'next';
import { isTestToken } from '../../../lib/test-token';
import { ImageGenerationService, ImageGenerationRequest } from '../../../lib/image-generation';
import { createServerSupabaseClient } from '../../../lib/supabase';
import { logger, withCorrelationId } from '../../../lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cid = withCorrelationId(req, `generate_insight_image_${Date.now()}`);

  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { cid, path: '/api/ai-insights/generate-image', method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      passage_reference,
      passage_text,
      insight_text,
      key_themes,
      style = 'biblical',
      size = '1024x1024',
      generate_variations = false,
      variation_count = 3
    } = req.body;

    // Validate required fields
    if (!passage_reference || !passage_text || !insight_text || !key_themes) {
      logger.warn('Missing required fields', { cid, fields: { passage_reference, passage_text, insight_text, key_themes } });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get authenticated user (with fallback for testing)
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check for test token first
      if (isTestToken(token)) {
        user = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
          name: 'Test User'
        };
        logger.info('Using test user for image generation', { cid, userId: user.id });
      } else {
        try {
          const serverSupabase = createServerSupabaseClient(token);
          const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
          
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

    // Prepare image generation request
    const imageRequest: ImageGenerationRequest = {
      passageReference: passage_reference,
      passageText: passage_text,
      insightText: insight_text,
      keyThemes: Array.isArray(key_themes) ? key_themes : [],
      style: style as any,
      size: size as any
    };

    // Validate request
    const validation = ImageGenerationService.validateRequest(imageRequest);
    if (!validation.valid) {
      logger.warn('Invalid image generation request', { cid, errors: validation.errors });
      return res.status(400).json({ error: 'Invalid request', details: validation.errors });
    }

    logger.info('Generating image for AI insight', { 
      cid, 
      userId: user.id, 
      passageReference: passage_reference,
      style,
      generateVariations: generate_variations
    });

    // Generate image(s)
    let result;
    if (generate_variations && variation_count > 1) {
      result = await ImageGenerationService.generateImageVariations(imageRequest, variation_count);
    } else {
      const singleResult = await ImageGenerationService.generateInsightImage(imageRequest);
      result = [singleResult];
    }

    // Check if any images were generated successfully
    const successfulResults = result.filter(r => r.success);
    if (successfulResults.length === 0) {
      logger.error('No images generated successfully', { cid, results: result });
      return res.status(500).json({ 
        error: 'Failed to generate images',
        details: result.map(r => r.error).filter(Boolean)
      });
    }

    logger.info('Image generation completed', { 
      cid, 
      userId: user.id,
      successCount: successfulResults.length,
      totalRequested: result.length
    });

    // Return results
    if (generate_variations) {
      res.status(200).json({
        success: true,
        images: successfulResults.map(r => ({
          url: r.imageUrl,
          revisedPrompt: r.revisedPrompt,
          metadata: r.metadata
        })),
        totalGenerated: successfulResults.length,
        totalRequested: result.length
      });
    } else {
      const singleResult = successfulResults[0];
      res.status(200).json({
        success: true,
        image: {
          url: singleResult.imageUrl,
          revisedPrompt: singleResult.revisedPrompt,
          metadata: singleResult.metadata
        }
      });
    }

  } catch (error) {
    logger.error('Image generation error', { cid }, error);
    return res.status(500).json({ 
      error: 'An error occurred while generating image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

