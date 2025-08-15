import type { NextApiRequest, NextApiResponse } from 'next';
import { PineconeService } from '../../../lib/pinecone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { action } = req.query;
      if (action === 'export') {
        const { namespace, limit = 100, pageToken } = req.body || {};
        if (!namespace) return res.status(400).json({ error: 'namespace required' });
        const data = await PineconeService.listVectors(namespace, { limit, paginationToken: pageToken });
        return res.status(200).json({ ok: true, data });
      }
      if (action === 'delete-namespace') {
        const { namespace } = req.body || {};
        if (!namespace) return res.status(400).json({ error: 'namespace required' });
        const ok = await PineconeService.deleteNamespace(namespace);
        return res.status(200).json({ ok });
      }
      if (action === 'rebuild-summaries') {
        // Placeholder: hook your summarization pipeline here
        return res.status(200).json({ ok: true, message: 'Summaries rebuild queued' });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}


