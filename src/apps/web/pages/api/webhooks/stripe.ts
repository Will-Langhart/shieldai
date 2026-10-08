import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { StripeService } from '../../../lib/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  let event: Stripe.Event;

  try {
    // Signature verification needs the exact bytes Stripe sent, hence bodyParser: false.
    const body = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    await StripeService.handleWebhookEvent(event);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Disable body parsing for webhook endpoint
export const config = {
  api: {
    bodyParser: false,
  },
}; 