import { NextApiRequest, NextApiResponse } from 'next';
import { BiblePineconeService } from '../../../lib/bible-pinecone';
import { logger } from '../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { versionId, books, maxChapters, action } = req.body;

    switch (action) {
      case 'import':
        if (!versionId) {
          return res.status(400).json({ error: 'versionId is required for import action' });
        }

        logger.info('Starting Bible import', { versionId, books, maxChapters });
        
        await BiblePineconeService.bulkImportBible(
          versionId,
          books || [],
          maxChapters || 50
        );

        return res.status(200).json({ 
          success: true, 
          message: 'Bible import completed successfully',
          versionId,
          books: books || 'all',
          maxChapters: maxChapters || 50
        });

      case 'get-namespaces':
        logger.info('Getting Bible namespaces');
        
        const namespaces = await BiblePineconeService.getBibleNamespaces();
        
        return res.status(200).json({ 
          success: true, 
          namespaces,
          count: namespaces.length
        });

      case 'search':
        const { query, topK, filters } = req.body;
        
        if (!query) {
          return res.status(400).json({ error: 'query is required for search action' });
        }

        logger.info('Searching Bible content', { query, topK, filters });
        
        // For now, we'll use a simple text query
        // In production, you'd want to generate embeddings for the query
        const mockEmbedding = new Array(1024).fill(0.1); // Placeholder embedding
        
        const results = await BiblePineconeService.searchBibleContent(
          mockEmbedding,
          topK || 10,
          filters
        );

        return res.status(200).json({ 
          success: true, 
          results,
          count: results.length,
          query
        });

      default:
        return res.status(400).json({ error: 'Invalid action. Use: import, get-namespaces, or search' });
    }

  } catch (error) {
    logger.error('Bible import API error', { error: error instanceof Error ? error.message : error });
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
