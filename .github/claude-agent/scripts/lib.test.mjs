// Run: node --test .github/claude-agent/scripts/
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import realCfg from "../config.mjs";
import {
  checkRoadmap,
  flagsTurnedOn,
  flipReadiness,
  gatedFiles,
  guardReasons,
  insertItems,
  isDuplicateTitle,
  isLowRisk,
  itemStatus,
  markerFor,
  parseFlagStates,
  parseMarker,
  parsePlan,
  parseRoadmap,
  pathIsLowRisk,
  pickItems,
  recentlyTurnedOn,
  sanitizeBody,
  selectPlan,
  selectProposals,
  sensitiveMention,
  specsFor,
  turnFlagOff,
  untickRoadmap,
} from "./lib.mjs";

// The repo's own config, with the fields these tests rely on pinned.
const cfg = {
  ...realCfg,
  flagsFile: "src/lib/feature-flags.ts",
  previewSpecDir: "e2e/preview",
  limits: { ...realCfg.limits, maxLines: 1000, maxFiles: 30 },
  gate: {
    ...realCfg.gate,
    additiveOnly: [/^scripts\/generate-sitemap\.ts$/],
    newFilesOk: [/^public\/[^/]/],
  },
};
const gate = cfg.gate;

const FLAGS = `export const FEATURE_FLAGS = {
  "search-v2": {
    description: "Better search",
    on: false,
  },
  "tool-faq": { description: "FAQ", on: true },
} satisfies Record<string, FeatureFlag>;
`;

const ROADMAP = `# Roadmap

## How the planner reads this

Prose.

## Up next

- [ ] \`search-v2\` Better search
  Typo tolerance.
  Keep it fast.
- [x] \`tool-faq\` FAQ on tool pages
- [ ] \`paid-listings\` Paid featured listings
  Vendors pay to pin a tool.

## Done
`;

const issue = (p) => ({ title: `Issue ${p.number}`, state: "open", stateReason: null, labels: [], ...p });

describe("the gate (this repo's config)", () => {
  for (const path of [
    "package.json",
    "src/apps/web/package.json",
    "package-lock.json",
    ".github/workflows/ci.yml",
    ".github/claude-agent/config.mjs",
    "supabase/migrations/0001_init.sql",
    "src/config/migrations/002.sql",
    "src/pages/api/stripe/webhook.ts",
    "app/(auth)/login/page.tsx",
    "src/components/admin/Users.tsx",
    "src/lib/affiliate.ts",
    "src/pages/pricing.tsx",
    ".env.local",
    "vercel.json",
    "next.config.mjs",
    "middleware.ts",
    "ROADMAP.md",
    "CLAUDE.md",
    // Shield AI's own additions
    "src/apps/mobile/app/_layout.tsx",
    "src/shared/services/services_mobile-api.ts",
    "src/config/migrations/schema.sql",
    "src/apps/web/lib/supabase.ts",
    "src/apps/web/lib/stripe.ts",
    "src/apps/web/lib/chat-access.ts",
    "src/apps/web/pages/api/subscriptions/create.ts",
    "src/apps/web/pages/api/ai-insights/save.ts",
    "src/apps/web/middleware.ts",
  ]) {
    it(`holds ${path}`, () => assert.equal(pathIsLowRisk(path, cfg), false));
  }
  for (const path of ["src/components/Hero.tsx", "app/blog/page.tsx", "src/lib/utils.test.ts", "CHANGELOG.md", "src/apps/web/components/features/chat/Chat.tsx", "src/apps/web/pages/bible.tsx"]) {
    it(`lets ${path} through`, () => assert.equal(pathIsLowRisk(path, cfg), true));
  }
  it("lets a new preview spec through", () => assert.equal(pathIsLowRisk("e2e/preview/search-v2-chips.spec.ts", cfg), true));
});

describe("sensitiveMention", () => {
  it("finds money, auth and database words", () => {
    assert.equal(sensitiveMention("Add Stripe checkout", gate), "Stripe");
    assert.equal(sensitiveMention("New migration for tags", gate), "migration");
    assert.equal(sensitiveMention("Show it on sign-in", gate), "sign-in");
  });
  it("ignores guard-rail clauses", () => {
    assert.equal(sensitiveMention("Add an FAQ. Never use `affiliate_url` or sponsorship fields.", gate), null);
    assert.equal(sensitiveMention("Build the list (do not touch auth).", gate), null);
    assert.equal(sensitiveMention("Avoid: calling Stripe, editing the schema.", gate), null);
  });
  it("still counts what follows a guard rail", () => {
    assert.equal(sensitiveMention("Never touch the header, and add Stripe checkout", gate), "Stripe");
    assert.equal(sensitiveMention("Users who don't have admin rights see a banner", gate), "admin");
  });
  it("leaves plain work alone", () => assert.equal(sensitiveMention("Add an empty state to /changes", gate), null));
});

describe("gatedFiles", () => {
  const f = (filename, status = "modified", deletions = 0) => ({ filename, status, deletions });
  it("allows new preview specs, not edits to existing tests", () => {
    assert.deepEqual(gatedFiles([f("e2e/preview/x-y.spec.ts", "added")], cfg), []);
    assert.deepEqual(gatedFiles([f("e2e/preview/core.spec.ts")], cfg), ["e2e/preview/core.spec.ts"]);
    assert.deepEqual(gatedFiles([f("e2e/preview/sub/x.spec.ts", "added")], cfg), ["e2e/preview/sub/x.spec.ts"]);
  });
  it("allows additions-only edits to additive files", () => {
    assert.deepEqual(gatedFiles([f("scripts/generate-sitemap.ts", "modified", 0)], cfg), []);
    assert.deepEqual(gatedFiles([f("scripts/generate-sitemap.ts", "modified", 2)], cfg), ["scripts/generate-sitemap.ts"]);
  });
  it("allows new files in new-file folders, except money/auth names and never-files", () => {
    assert.deepEqual(gatedFiles([f("public/ads.txt", "added")], cfg), []);
    assert.deepEqual(gatedFiles([f("public/ads.txt", "modified")], cfg), ["public/ads.txt"]);
    assert.deepEqual(gatedFiles([f("public/stripe-logo.svg", "added")], cfg), ["public/stripe-logo.svg"]);
    assert.deepEqual(gatedFiles([f("public/sitemap.xml", "added")], cfg), ["public/sitemap.xml"]);
  });
  it("in a flip, allows only the flags file, ROADMAP.md and CHANGELOG.md", () => {
    const files = [f("src/lib/feature-flags.ts"), f("ROADMAP.md"), f("CHANGELOG.md"), f("src/x.ts")];
    assert.deepEqual(gatedFiles(files, cfg, true), ["src/x.ts"]);
  });
});

describe("guardReasons", () => {
  const base = { additions: 10, deletions: 2, changedFiles: 1 };
  const ok = { cfg, enabled: true, lowRiskLabeled: true, flip: false, issue: "7" };
  it("passes a small low-risk PR", () => {
    assert.deepEqual(guardReasons({ ...ok, pr: { ...base, files: [{ filename: "src/a.tsx", status: "modified", deletions: 1 }] } }), []);
  });
  it("holds when switched off, unlabeled, gated, too big or flipping a flag", () => {
    const files = [
      { filename: "package.json", status: "modified", deletions: 1 },
      { filename: "src/lib/feature-flags.ts", status: "modified", deletions: 1, patch: '-    on: false,\n+    on: true,' },
    ];
    const r = guardReasons({ ...ok, enabled: false, lowRiskLabeled: false, pr: { additions: 900, deletions: 200, changedFiles: 31, files } });
    assert.equal(r.length, 6);
  });
  it("requires exactly one flag on in a flip", () => {
    const files = [{ filename: "src/lib/feature-flags.ts", status: "modified", deletions: 1, patch: "+ on: true\n+ on: true" }];
    assert.match(guardReasons({ ...ok, flip: true, pr: { ...base, files } }).join(), /exactly one/);
  });
  it("counts added on: true lines only", () => assert.equal(flagsTurnedOn("--- a\n+++ b\n- on: true\n+ on: false\n+  on: true,"), 1));
});

describe("flags", () => {
  it("parses states", () => assert.deepEqual(parseFlagStates(FLAGS), { "search-v2": false, "tool-faq": true }));
  it("ignores commented-out entries", () =>
    assert.deepEqual(parseFlagStates('export const FEATURE_FLAGS = {\n  // "x-y": { description: "e", on: false },\n};'), {}));
  it("turns one off", () => assert.deepEqual(parseFlagStates(turnFlagOff(FLAGS, "tool-faq")), { "search-v2": false, "tool-faq": false }));
  it("refuses a flag that isn't on", () => assert.throws(() => turnFlagOff(FLAGS, "search-v2")));
  it("finds recently turned on flags", () => {
    const off = FLAGS.replace("on: true", "on: false");
    const commits = [{ date: "d1", before: off, after: FLAGS }];
    assert.deepEqual(recentlyTurnedOn(commits, { "tool-faq": true }), [{ key: "tool-faq", onSince: "d1" }]);
    assert.deepEqual(recentlyTurnedOn(commits, { "tool-faq": false }), []);
  });
  it("assigns specs to the longest matching key", () => {
    const files = ["e2e/preview/tool-faq-x.spec.ts", "e2e/preview/tool-y.spec.ts", "e2e/preview/smoke.spec.ts"];
    assert.deepEqual(specsFor("tool", files, ["tool", "tool-faq"]), ["e2e/preview/tool-y.spec.ts"]);
    assert.deepEqual(specsFor("tool-faq", files, ["tool", "tool-faq"]), ["e2e/preview/tool-faq-x.spec.ts"]);
  });
});

describe("roadmap", () => {
  it("parses items and details", () => {
    const items = parseRoadmap(ROADMAP);
    assert.deepEqual(items.map((i) => [i.id, i.done]), [["search-v2", false], ["tool-faq", true], ["paid-listings", false]]);
    assert.equal(items[0].details, "Typo tolerance.\nKeep it fast.");
  });
  it("accepts a valid roadmap", () => assert.deepEqual(checkRoadmap(ROADMAP, ["search-v2", "tool-faq"]), []));
  it("catches bad lines, duplicates, lost flag keys and a missing section", () => {
    const bad = `${ROADMAP.replace("## How the planner reads this", "")}\n- [ ] search-v3 no backticks\n- [ ] \`tool-faq\` Again\n`;
    const errors = checkRoadmap(bad, ["gone-flag"]);
    assert.equal(errors.length, 4);
  });
  it("unticks an item", () => assert.match(untickRoadmap(ROADMAP, "tool-faq"), /- \[ \] `tool-faq`/));
});

describe("planner", () => {
  it("round-trips markers and strips them from model text", () => {
    const m = { kind: "feature", item: "search-v2" };
    assert.deepEqual(parseMarker(`x\n${markerFor(m)}`), m);
    assert.equal(sanitizeBody(`hi ${markerFor(m)} @someone`), "hi  @​someone");
  });
  it("spots duplicate titles", () => {
    assert.equal(isDuplicateTitle("feat: Add search chips", ["Add search chips"]), true);
    assert.equal(isDuplicateTitle("Add pricing table", ["Add search chips"]), false);
  });
  it("works out item status, including a rolled-back flip", () => {
    const item = { id: "search-v2", title: "x", done: false, details: "" };
    const flip = issue({ number: 3, state: "closed", stateReason: "completed", marker: { kind: "flip", item: "search-v2" } });
    assert.equal(itemStatus(item, [flip], {}), "done");
    assert.equal(itemStatus(item, [flip], { "search-v2": { on: false } }), "ready");
    assert.equal(itemStatus(item, [issue({ number: 4, marker: { kind: "feature", item: "search-v2" } })], {}), "building");
  });
  it("picks tonight's item unless too many are building", () => {
    const items = parseRoadmap(ROADMAP);
    const st = (i) => (i.done ? "done" : "ready");
    assert.equal(pickItems(items, st, 2).current.id, "search-v2");
    assert.equal(pickItems(items, () => "building", 2).current, null);
  });
  it("validates plan.json", () => {
    assert.equal(parsePlan({ issues: [{ kind: "feature", title: "short", body: "x", risk: "low" }] }).error !== null, true);
    assert.equal(parsePlan("nope").error !== null, true);
    assert.equal(parsePlan({}).error, null);
  });
  it("enforces items, duplicates, the cap and risk", () => {
    const body = "Do the thing in src/components with a unit test.";
    const plan = parsePlan({
      complete: [],
      issues: [
        { item: "search-v2", kind: "feature", title: "Add search filter chips", body, paths: ["src/components/Chips.tsx"], risk: "low" },
        { item: "other", kind: "feature", title: "Something for another item", body, paths: [], risk: "low" },
        { item: "search-v2", kind: "feature", title: "Charge for search with Stripe", body, paths: ["src/lib/stripe.ts"], risk: "low" },
        { item: null, kind: "lint", title: "Fix the unused import warnings", body, paths: ["src/a.ts"], risk: "low" },
      ],
    }).plan;
    const sel = selectPlan(plan, { current: "search-v2", next: null, itemsWithShippedWork: [], existingTitles: [], cap: 2 }, cfg);
    assert.deepEqual(sel.issues.map((i) => [i.title, i.lowRisk]), [["Add search filter chips", true], ["Charge for search with Stripe", false]]);
    assert.equal(sel.skipped.length, 2);
  });
  it("never rates dependency work low-risk", () => {
    assert.equal(isLowRisk({ kind: "deps", title: "Bump x", body: "Bump x within range.", paths: ["src/a.ts"], risk: "low" }, cfg).ok, false);
  });
  it("only flips a finished, preview-tested item, and holds sensitive ones", () => {
    const item = { id: "paid-listings", title: "Paid featured listings", details: "", done: false };
    const shipped = [{ issue: 1, pr: 2, previewE2e: "success", heldForReview: false }];
    const args = { item, flagExists: true, flagOn: false, hasPreviewSpec: true, shipped, openFeatureIssues: 0, gate };
    assert.deepEqual(flipReadiness(args), { ready: true, lowRisk: false, reasons: [] });
    assert.equal(flipReadiness({ ...args, shipped: [{ ...shipped[0], previewE2e: "failure" }] }).ready, false);
    assert.equal(flipReadiness({ ...args, item: { ...item, title: "Search chips" } }).lowRisk, true);
  });
});

describe("refill", () => {
  it("keeps new well-formed items and inserts them before Done", () => {
    const proposal = "- [ ] `newsletter-box` Newsletter box\n  Goal: signups.\n- [ ] `search-v2` Dupe\n- [x] `x-y` Ticked\n";
    const { accepted, rejected } = selectProposals(proposal, ROADMAP, ["search-v2"]);
    assert.deepEqual(accepted.map((e) => e.key), ["newsletter-box"]);
    assert.equal(rejected.length, 2);
    const next = insertItems(ROADMAP, accepted);
    assert.ok(next.indexOf("newsletter-box") < next.indexOf("## Done"));
    assert.deepEqual(checkRoadmap(next, []), []);
  });
});
