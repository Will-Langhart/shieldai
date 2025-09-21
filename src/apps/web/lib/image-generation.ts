// Image Generation Service for Shield AI
// Integrates with OpenAI DALL-E 3 for generating images based on AI insights

import OpenAI from 'openai';
import { logger, withCorrelationId } from './logger';

export interface ImageGenerationRequest {
  passageReference: string;
  passageText: string;
  insightText: string;
  keyThemes: string[];
  style?: 'realistic' | 'artistic' | 'biblical' | 'modern';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  error?: string;
  metadata?: {
    passageReference: string;
    keyThemes: string[];
    style: string;
    generatedAt: string;
  };
}

export class ImageGenerationService {
  private static openai: OpenAI | null = null;

  private static getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Generate an image based on AI Bible insights
   */
  static async generateInsightImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const cid = withCorrelationId({ headers: {} }, `image_generation_${Date.now()}`);
    
    try {
      logger.info('Generating image for Bible insight', { 
        cid, 
        passageReference: request.passageReference,
        keyThemes: request.keyThemes,
        style: request.style 
      });

      // Create a comprehensive prompt for image generation
      const imagePrompt = this.createImagePrompt(request);
      
      logger.debug('Generated image prompt', { cid, prompt: imagePrompt });

      // Generate image using DALL-E 3
      const response = await this.getOpenAI().images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: request.size || '1024x1024',
        quality: 'standard',
        style: request.style === 'realistic' ? 'natural' : 'vivid',
      });

      const imageUrl = response.data?.[0]?.url;
      const revisedPrompt = response.data?.[0]?.revised_prompt;

      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E');
      }

      logger.info('Image generated successfully', { 
        cid, 
        passageReference: request.passageReference,
        imageUrl: imageUrl.substring(0, 50) + '...'
      });

      return {
        success: true,
        imageUrl,
        revisedPrompt,
        metadata: {
          passageReference: request.passageReference,
          keyThemes: request.keyThemes,
          style: request.style || 'biblical',
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Image generation failed', { cid, error: error instanceof Error ? error.message : String(error) });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      };
    }
  }

  /**
   * Create a detailed prompt for image generation based on Bible insights
   */
  private static createImagePrompt(request: ImageGenerationRequest): string {
    const { passageReference, passageText, insightText, keyThemes, style = 'biblical' } = request;
    
    // Extract key visual elements from the passage and insights
    const visualElements = this.extractVisualElements(passageText, insightText, keyThemes);
    
    // Create style-specific instructions
    const styleInstructions = this.getStyleInstructions(style);
    
    // Build the comprehensive prompt
    let prompt = `Create a ${style} style image that visually represents the biblical passage "${passageReference}". `;
    
    // Add visual elements
    if (visualElements.length > 0) {
      prompt += `The image should include: ${visualElements.join(', ')}. `;
    }
    
    // Add key themes
    if (keyThemes.length > 0) {
      prompt += `Key themes to represent: ${keyThemes.join(', ')}. `;
    }
    
    // Add style instructions
    prompt += styleInstructions;
    
    // Add biblical context and reverence
    prompt += `The image should be respectful, reverent, and appropriate for biblical content. `;
    prompt += `Focus on the spiritual and theological meaning of the passage.`;
    
    return prompt;
  }

  /**
   * Extract visual elements from passage text and insights
   */
  private static extractVisualElements(passageText: string, insightText: string, keyThemes: string[]): string[] {
    const elements: string[] = [];
    
    // Common biblical visual elements
    const biblicalElements = [
      'light', 'darkness', 'water', 'fire', 'mountain', 'valley', 'tree', 'cross',
      'dove', 'lamb', 'lion', 'crown', 'throne', 'clouds', 'stars', 'sun', 'moon',
      'shepherd', 'sheep', 'vine', 'bread', 'wine', 'oil', 'stone', 'rock'
    ];
    
    // Check for biblical elements in the text
    const text = (passageText + ' ' + insightText).toLowerCase();
    biblicalElements.forEach(element => {
      if (text.includes(element)) {
        elements.push(element);
      }
    });
    
    // Add theme-based visual elements
    keyThemes.forEach(theme => {
      const themeLower = theme.toLowerCase();
      if (themeLower.includes('love')) elements.push('heart', 'embrace');
      if (themeLower.includes('faith')) elements.push('mountain', 'path');
      if (themeLower.includes('hope')) elements.push('light', 'dawn');
      if (themeLower.includes('peace')) elements.push('dove', 'calm waters');
      if (themeLower.includes('grace')) elements.push('open hands', 'light');
      if (themeLower.includes('mercy')) elements.push('compassionate gesture');
      if (themeLower.includes('forgiveness')) elements.push('embrace', 'reconciliation');
      if (themeLower.includes('salvation')) elements.push('cross', 'light breaking through');
      if (themeLower.includes('resurrection')) elements.push('dawn', 'new life');
      if (themeLower.includes('kingdom')) elements.push('crown', 'throne');
    });
    
    // Remove duplicates and return
    return Array.from(new Set(elements)).slice(0, 8); // Limit to 8 elements
  }

  /**
   * Get style-specific instructions for image generation
   */
  private static getStyleInstructions(style: string): string {
    switch (style) {
      case 'realistic':
        return `Use photorealistic style with natural lighting and detailed textures. `;
      case 'artistic':
        return `Use artistic interpretation with expressive brushstrokes and creative composition. `;
      case 'biblical':
        return `Use classical biblical art style with rich colors, dramatic lighting, and reverent composition. `;
      case 'modern':
        return `Use contemporary art style with clean lines, modern composition, and vibrant colors. `;
      default:
        return `Use a balanced artistic style that is both reverent and visually appealing. `;
    }
  }

  /**
   * Generate multiple image variations for a single insight
   */
  static async generateImageVariations(
    request: ImageGenerationRequest,
    count: number = 3
  ): Promise<ImageGenerationResult[]> {
    const results: ImageGenerationResult[] = [];
    
    for (let i = 0; i < count; i++) {
      const variationRequest = {
        ...request,
        style: this.getVariationStyle(request.style || 'biblical', i) as 'realistic' | 'artistic' | 'biblical' | 'modern'
      };
      
      const result = await this.generateInsightImage(variationRequest);
      results.push(result);
      
      // Add small delay between requests to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Get variation style for multiple image generation
   */
  private static getVariationStyle(baseStyle: string, index: number): string {
    const variations = {
      'biblical': ['biblical', 'artistic', 'realistic'],
      'realistic': ['realistic', 'biblical', 'modern'],
      'artistic': ['artistic', 'modern', 'biblical'],
      'modern': ['modern', 'artistic', 'realistic']
    };
    
    const styleArray = variations[baseStyle as keyof typeof variations] || ['biblical', 'artistic', 'realistic'];
    return styleArray[index % styleArray.length];
  }

  /**
   * Validate image generation request
   */
  static validateRequest(request: ImageGenerationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!request.passageReference?.trim()) {
      errors.push('Passage reference is required');
    }
    
    if (!request.passageText?.trim()) {
      errors.push('Passage text is required');
    }
    
    if (!request.insightText?.trim()) {
      errors.push('Insight text is required');
    }
    
    if (!Array.isArray(request.keyThemes) || request.keyThemes.length === 0) {
      errors.push('Key themes are required');
    }
    
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    if (request.size && !validSizes.includes(request.size)) {
      errors.push(`Invalid size. Must be one of: ${validSizes.join(', ')}`);
    }
    
    const validStyles = ['realistic', 'artistic', 'biblical', 'modern'];
    if (request.style && !validStyles.includes(request.style)) {
      errors.push(`Invalid style. Must be one of: ${validStyles.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
