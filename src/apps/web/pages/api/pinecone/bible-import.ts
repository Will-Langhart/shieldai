import { NextApiRequest, NextApiResponse } from 'next';
import { BiblePineconeService } from '../../../lib/bible-pinecone';
import { importVerses } from '../../../lib/bible-verses-ingest';
import { logger } from '../../../lib/logger';

// Allow a longer window for the (bounded, resumable) verse ingest.
export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { versionId, books, maxChapters, action } = req.body;

    switch (action) {
      // Integrated `bible-verses` index (Option A). Bounded + resumable: imports
      // `maxBooks` books from `startBookIndex`, returns `nextBookIndex` to resume.
      case 'import-verses': {
        if (!versionId) {
          return res.status(400).json({ error: 'versionId is required for import-verses action' });
        }
        // Optional shared-secret guard: enforced only when the env var is set.
        const requiredToken = process.env.PINECONE_IMPORT_TOKEN;
        if (requiredToken && req.headers['x-import-token'] !== requiredToken) {
          return res.status(401).json({ error: 'Unauthorized: bad or missing x-import-token' });
        }
        if (!requiredToken) {
          logger.warn('import-verses called without PINECONE_IMPORT_TOKEN set (unguarded)');
        }

        const { bookIds, startBookIndex, maxBooks, maxChaptersPerBook } = req.body;
        logger.info('Starting bible-verses ingest', { versionId, startBookIndex, maxBooks });

        const ingest = await importVerses(versionId, {
          bookIds,
          startBookIndex,
          maxBooks,
          maxChaptersPerBook,
        });

        return res.status(200).json({ success: true, ...ingest });
      }

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
