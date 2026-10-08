/**
 * The `test-token` bearer bypass lets local dev and the eval scripts hit API
 * routes without a Supabase session. It must never be honored in production:
 * it maps to a fixed user and skips auth entirely, so anyone could call the
 * paid models with it.
 *
 * Honored only when running `next dev`, or when ALLOW_TEST_TOKEN=true is set
 * explicitly (e.g. a locally run production build for evals).
 */
export const TEST_TOKEN = 'test-token';

export function testTokenEnabled(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.ALLOW_TEST_TOKEN === 'true';
}

export function isTestToken(token: string | undefined | null): boolean {
  return token === TEST_TOKEN && testTokenEnabled();
}

/** Client-side fallback when there is no session: the test token in dev, nothing in prod. */
export function devFallbackToken(): string {
  return process.env.NODE_ENV === 'development' ? TEST_TOKEN : '';
}
