// Agent pipeline settings for this repo. Every script in
// .github/claude-agent/scripts/ reads this file, so the gate below is defined
// once. Docs: docs/agent-pipeline.md. This file is protected: agent PRs that
// change it always wait for the owner.

export default {
  // Production URL. flag-watch runs a live feature's browser specs here.
  siteUrl: "https://shieldai.cloud",

  // Where the deployed app lives (its package.json), relative to the repo root.
  // "." for a single app; "src/apps/web" or "frontend" in a monorepo.
  // Shield AI is an npm-workspaces monorepo: one lockfile at the root, the
  // Next.js 14 (Pages Router) web app here. The Expo app in src/apps/mobile
  // isn't built or tested in CI, so it's gated below.
  appDir: "src/apps/web",

  // Feature flag registry, relative to the repo root. The scripts read it as
  // text, so keep each entry shaped `"flag-key": { description: "...", on: false },`.
  flagsFile: "src/apps/web/lib/feature-flags.ts",

  // Browser specs that run against every Vercel preview (all flags on) and,
  // per flag, against production after the flag goes live. Relative to the repo root.
  previewSpecDir: "src/apps/web/e2e/preview",

  // Commands the builder must pass before it opens a PR, run in order from the
  // repo root. They also become the builder's only allowed shell commands
  // (besides git/gh basics), so write them exactly as it should type them.
  // The last one serves a production build with every flag on and runs the
  // preview specs against it.
  checks: [
    "npm run type-check --workspace src/apps/web",
    "npm run lint --workspace src/apps/web",
    "npm run test --workspace src/apps/web",
    "npm run build --workspace src/apps/web",
    "node .github/claude-agent/scripts/preview-local.mjs",
  ],

  // How preview-local.mjs serves the build it just made, run in appDir.
  localPreview: {
    command: "npx next start -p 4173",
    port: 4173,
  },

  // Files a build rewrites that must never be committed (the builder's git
  // ignores changes to them). Example: a sitemap generated in prebuild.
  generatedFiles: [],

  // What the nightly planner shows Claude as maintenance candidates.
  planner: {
    lintCommand: "npm run lint --workspace src/apps/web",
    todoDirs: ["src/apps/web"],
  },

  limits: {
    maxLines: 1000, // an agent PR over this waits for the owner
    maxFiles: 30,
    newIssuesPerNight: 6,
    queueLimit: 10, // planner adds nothing while this many issues wait for the builder
    maxInFlight: 2, // roadmap items building at once
    builderIssuesPerRun: 6,
  },

  // ---------------------------------------------------------------------------
  // THE GATE. An agent PR that touches any of this waits for the owner's merge,
  // and a feature whose roadmap item mentions it never turns its flag on by
  // itself. Edit freely; matching is case-insensitive on repo-relative paths.
  // ---------------------------------------------------------------------------
  gate: {
    // Whole paths: CI and agent rules, the database, deps, deploy/build config, secrets.
    protectedPaths: [
      /^\.github\//, // workflows, agent rules, this file
      /(^|\/)(CLAUDE|AGENTS|SPEC)\.md$/,
      /(^|\/)ROADMAP\.md$/,
      /(^|\/)supabase\//, // migrations, RLS, Edge Functions
      /(^|\/)(migrations?|prisma|drizzle|db|database)\//,
      /\.sql$/,
      /(^|\/)\.env/, // any env file
      /(^|\/)package(-lock)?\.json$/,
      /(^|\/)(pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/,
      /(^|\/)(requirements[^/]*\.txt|pyproject\.toml|poetry\.lock|uv\.lock)$/,
      /(^|\/)vercel\.json$/,
      /(^|\/)(next|vite|astro|nuxt|svelte|remix|playwright|vitest|jest|tailwind|postcss)\.config\.[cm]?[jt]s$/,
      /(^|\/)(tsconfig[^/]*|jsconfig|biome|\.eslintrc[^/]*|eslint\.config\.[cm]?[jt]s)(\.json)?$/,
      /(^|\/)(middleware|instrumentation[^/]*|sentry\.[^/]+)\.[cm]?[jt]s$/,
      /(^|\/)(Dockerfile|fly\.toml|render\.yaml)$/,
      /(^|\/)scripts\//,
      // Shield AI's own sensitive places.
      /^src\/apps\/mobile\//, // Expo app: no CI coverage, ships through the App Store
      /^src\/shared\//, // shared by web and mobile
      /^src\/config\//, // SQL schema, migrations, env templates
      /^src\/apps\/web\/lib\/supabase\.ts$/, // Supabase clients
      /^src\/apps\/web\/lib\/(chat-access|rate-limit|test-token)\.ts$/, // daily limits, test auth
      /^src\/apps\/web\/pages\/api\/(ai-insights|pinecone)\//, // service-role key; vector index writes
      /^src\/apps\/web\/pages\/test-insights\.tsx$/, // reads the service-role key
      /^src\/apps\/web\/vercel\.json$/,
    ],
    // Words in a path that mean money, sign-in or admin.
    sensitivePathWords:
      /(stripe|billing|checkout|payment|payout|pricing|subscription|invoice|revenuecat|paypal|webhook|affiliate|auth|login|signin|sign-in|signup|sign-up|session|password|admin|secret|credential)/,
    // Words in a roadmap item or issue that mean the same. Guard-rail clauses
    // ("never touch auth") don't count; see sensitiveMention in lib.mjs.
    sensitiveText:
      /\b(stripe|billing|checkout|payments?|paid|pay|payouts?|pricing|subscriptions?|invoices?|revenuecat|paypal|in-app purchases?|iap|sponsor(ed|ship)?|affiliate|auth|authentication|authorization|log ?in|sign[- ]?(in|up)|passwords?|sessions?|admin|database|migrations?|schema|rls|sql|supabase|prisma|edge functions?|webhooks?|env|environment variables?|secrets?|api keys?|dependenc(y|ies))\b/i,
    // Protected files where adding lines (removing none) is still fine.
    additiveOnly: [],
    // Folders where a brand-new file is fine (an existing one is protected).
    newFilesOk: [],
    // Never fine, even as a new file.
    never: [/(^|\/)(sitemap\.xml|robots\.txt)$/],
  },
};
