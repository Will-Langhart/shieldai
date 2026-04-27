import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';

type Middleware = (req: NextApiRequest, res: NextApiResponse, next: (result?: unknown) => void) => void;

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Middleware): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result?: unknown) => {
      if (result instanceof Error) return reject(result);
      return resolve();
    });
  });
}

// Expensive AI/chat endpoints — 20 requests per 15 minutes per IP
export const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait before sending more messages.' },
});

// Bible and AI insight generation — 60 requests per 15 minutes per IP
export const bibleRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

export async function applyChatRateLimit(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  try {
    await runMiddleware(req, res, chatRateLimit as unknown as Middleware);
    return true;
  } catch {
    return false;
  }
}

export async function applyBibleRateLimit(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  try {
    await runMiddleware(req, res, bibleRateLimit as unknown as Middleware);
    return true;
  } catch {
    return false;
  }
}
