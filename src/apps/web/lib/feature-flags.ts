/**
 * Feature flags. Every new feature ships behind one that starts off. A flag's
 * key is its ROADMAP.md item id. The agent scripts read this file as text, so
 * keep each entry shaped `"key": { description: "...", on: false },`.
 *
 * Resolution, first match wins:
 *   1. NEXT_PUBLIC_FEATURE_FLAGS: comma list that forces flags,
 *      `search-v2,-paid-listings` turns search-v2 on and paid-listings off.
 *   2. Vercel preview builds (NEXT_PUBLIC_VERCEL_ENV=preview) turn every flag on.
 *   3. The registry below. Only a flag-flip PR sets `on: true`.
 *
 * Both env vars are inlined at build time, so server and client agree.
 */

export type FeatureFlag = {
  /** One line: what turning this on shows visitors. */
  description: string;
  /** Off until the planner's flip PR (or the owner) turns it on. */
  on: boolean;
};

export const FEATURE_FLAGS = {
  // Entries look like: "search-v2": { description: "Filter chips on /search", on: false },
  "not-found-page": { description: "Branded 404 page with links back to Home, Bible and Chat", on: false },
} satisfies Record<string, FeatureFlag>;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/** Parses `a,-b, c` into { a: true, b: false, c: true }. */
export function parseFlagOverrides(raw: string | undefined): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const part of (raw ?? "").split(",")) {
    const token = part.trim();
    if (!token) continue;
    if (token.startsWith("-")) out[token.slice(1)] = false;
    else out[token] = true;
  }
  return out;
}

export function resolveFlag(
  key: string,
  registry: Record<string, FeatureFlag>,
  env: { overrides?: string; vercelEnv?: string },
): boolean {
  const overrides = parseFlagOverrides(env.overrides);
  if (key in overrides) return overrides[key];
  if (!(key in registry)) return false;
  if (env.vercelEnv === "preview") return true;
  return registry[key].on;
}

/** Whether a feature is on for this build. */
export function isFeatureOn(key: FeatureFlagKey): boolean {
  return resolveFlag(key, FEATURE_FLAGS, {
    // Literal references: Next.js only inlines `process.env.NEXT_PUBLIC_*` written out in full.
    overrides: process.env.NEXT_PUBLIC_FEATURE_FLAGS,
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
  });
}
