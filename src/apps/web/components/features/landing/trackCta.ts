import { track } from '@vercel/analytics'

// Landing-page call-to-action names, kept in one union so the Vercel
// Analytics event list stays small and consistent.
export type LandingCta =
  | 'hero_chat'
  | 'hero_bible'
  | 'demo_question'
  | 'demo_try'
  | 'pricing_free'
  | 'footer_chat'
  | 'footer_bible'

/** Records a landing-page CTA click as a Vercel Analytics custom event. */
export function trackCta(cta: LandingCta, props?: Record<string, string>) {
  track('landing_cta_click', { cta, ...props })
}
