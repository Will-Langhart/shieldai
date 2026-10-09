import rateLimit, { type Options } from 'express-rate-limit';
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

// express-rate-limit is built for Express, which sets `req.ip` and `req.app`.
// Next.js API requests have neither, so the default key was `undefined` for
// every caller — one bucket shared by all users — and the validations threw on
// each request. Key on the client IP Vercel puts in the headers instead.
function clientIp(req: NextApiRequest): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp;
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket?.remoteAddress || 'unknown';
}

class RateLimitedError extends Error {}

const nextApiOptions: Partial<Options> = {
  keyGenerator: (req) => clientIp(req as unknown as NextApiRequest),
  validate: false,
  // The default handler sends the 429 but never calls next(), which left
  // runMiddleware's promise pending until the function timed out.
  handler: (_req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
    next(new RateLimitedError());
  },
};

// Expensive AI/chat endpoints — 20 requests per 15 minutes per IP
export const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  ...nextApiOptions,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait before sending more messages.' },
});

// Bible and AI insight generation — 60 requests per 15 minutes per IP
export const bibleRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  ...nextApiOptions,
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
