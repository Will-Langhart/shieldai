// Pure logic for the agent pipeline: the gate, ROADMAP.md, planner issues,
// flag flips, the flag watcher and the roadmap refill. No I/O here; every
// function is covered by lib.test.mjs (`node --test .github/claude-agent/scripts/`).

// ---------------------------------------------------------------------------
// The gate (rules live in ../config.mjs)
// ---------------------------------------------------------------------------

/**
 * Guard-rail clauses ("never use `affiliate_url`", "do not touch auth") fence
 * work off; they don't ask for it. A clause starts a sentence, line, list item
 * or parenthetical (or follows a comma, semicolon, "and" or "or") with never / do not /
 * don't / must not / avoid (an "Avoid:" note too) / no ("No pricing copy",
 * "- no Supabase calls"), and runs to the next sentence break or
 * "and/but/then", so "never touch X, and add Stripe checkout" still counts the
 * second half. Mid-sentence negations ("users who don't have admin rights",
 * "pages with no login") still count.
 */
const GUARD_CLAUSE =
  /(^|[\n(;:,.!?*-]|\b(?:and|or)\b)(\s*)(?:never|do not|don't|must not|must never|avoid|no(?=\s))\b:?(?:(?!\b(?:and|but|then|so|while)\b)[^.;:!?\n()])*/gim;

/** First sensitive word in the text, ignoring guard-rail clauses; null if none. */
export function sensitiveMention(text, gate) {
  const hit = String(text).replace(GUARD_CLAUSE, "$1$2").match(gate.sensitiveText);
  return hit ? hit[0] : null;
}

const any = (list, path) => (list ?? []).some((re) => re.test(path));

function ci(re) {
  return re.flags.includes("i") ? re : new RegExp(re.source, `${re.flags}i`);
}

/** Whether a path is in the gate at all (before the additive/new-file exceptions). */
export function isProtectedPath(path, gate) {
  return any(gate.protectedPaths.map(ci), path) || ci(gate.sensitivePathWords).test(path);
}

/**
 * Whether an agent may change `path` without the owner, as the planner sees it
 * before any code exists: new preview specs, additive-only files and new-file
 * folders count as fine (the guard re-checks the real diff).
 */
export function pathIsLowRisk(path, cfg) {
  const { gate } = cfg;
  if (any(gate.never, path)) return false;
  if (isPreviewSpec(path, cfg)) return true;
  if (any(gate.additiveOnly, path)) return true;
  if (any(gate.newFilesOk, path) && !ci(gate.sensitivePathWords).test(path)) return true;
  return !isProtectedPath(path, gate) && !inSpecDir(path, cfg);
}

function inSpecDir(path, cfg) {
  return path.startsWith(`${cfg.previewSpecDir.replace(/\/$/, "")}/`);
}

/** `<previewSpecDir>/<lowercase-dashed>.spec.(ts|js|mjs)`, directly in the folder. */
export function isPreviewSpec(path, cfg) {
  if (!inSpecDir(path, cfg)) return false;
  const rest = path.slice(cfg.previewSpecDir.replace(/\/$/, "").length + 1);
  return /^[a-z0-9-]+\.spec\.(ts|js|mjs)$/.test(rest);
}

/**
 * The auto-merge guard's file rules on a real diff. `files` are GitHub's PR
 * files ({ filename, status, deletions, patch }). With `flip`, only the flags
 * file, ROADMAP.md and CHANGELOG.md may change. Returns the paths that hold
 * the PR for the owner.
 */
export function gatedFiles(files, cfg, flip = false) {
  const { gate } = cfg;
  const hits = [];
  for (const f of files) {
    const path = f.filename;
    if (flip) {
      if (![cfg.flagsFile, "ROADMAP.md", "CHANGELOG.md"].includes(path)) hits.push(path);
      continue;
    }
    if (any(gate.never, path)) {
      hits.push(path);
      continue;
    }
    if (inSpecDir(path, cfg)) {
      // Only brand-new specs; existing browser tests belong to the owner.
      if (!(f.status === "added" && isPreviewSpec(path, cfg))) hits.push(path);
      continue;
    }
    if (any(gate.additiveOnly, path)) {
      if (!(f.status === "modified" && Number(f.deletions) === 0)) hits.push(path);
      continue;
    }
    if (any(gate.newFilesOk, path)) {
      if (!(f.status === "added" && !ci(gate.sensitivePathWords).test(path))) hits.push(path);
      continue;
    }
    if (isProtectedPath(path, gate)) hits.push(path);
  }
  return hits;
}

/** Lines in a unified diff patch that add `on: true`. */
export function flagsTurnedOn(patch) {
  return String(patch ?? "")
    .split("\n")
    .filter((l) => /^\+(?!\+\+)/.test(l) && /\bon:\s*true\b/.test(l)).length;
}

/**
 * Every reason an agent PR may not auto-merge; empty means it may.
 * pr: { additions, deletions, changedFiles, files }.
 */
export function guardReasons({ pr, cfg, enabled, lowRiskLabeled, flip, issue }) {
  const reasons = [];
  if (!enabled)
    reasons.push('auto-merge is switched off (repo variable AGENT_AUTOMERGE isn\'t "true")');
  if (!lowRiskLabeled)
    reasons.push(`issue #${issue} isn't labeled \`agent:low-risk\` by the owner or the planner`);
  const hits = gatedFiles(pr.files, cfg, flip);
  if (hits.length) {
    reasons.push(
      flip
        ? `flag-flip PR changes more than the flag, ROADMAP.md and CHANGELOG.md: ${hits.join(", ")}`
        : `touches gated paths: ${hits.join(", ")}`,
    );
  }
  const flagPatch = pr.files.find((f) => f.filename === cfg.flagsFile)?.patch;
  const on = flagsTurnedOn(flagPatch);
  if (!flip && on > 0) reasons.push("turns a feature flag on outside a flag-flip issue");
  if (flip && on !== 1) reasons.push(`flag-flip PR should turn exactly one flag on (found ${on})`);
  const lines = pr.additions + pr.deletions;
  if (lines > cfg.limits.maxLines)
    reasons.push(`${lines} changed lines (limit ${cfg.limits.maxLines})`);
  if (pr.changedFiles > cfg.limits.maxFiles)
    reasons.push(`${pr.changedFiles} files (limit ${cfg.limits.maxFiles})`);
  return reasons;
}

// ---------------------------------------------------------------------------
// Feature flags (read as text, so any language/framework works)
// ---------------------------------------------------------------------------

/** Flag key → on, from the registry source. Entries look like `"key": { ..., on: false }`. */
export function parseFlagStates(src) {
  const at = src.indexOf("FEATURE_FLAGS");
  // Commented-out lines (examples, disabled flags) don't count.
  const registry = (at >= 0 ? src.slice(at) : src).replace(/^\s*\/\/.*$/gm, "");
  const out = {};
  for (const m of registry.matchAll(/["']([a-z0-9][a-z0-9-]*)["']\s*:\s*\{([^{}]*)\}/g)) {
    out[m[1]] = /\bon:\s*true\b/.test(m[2]);
  }
  return out;
}

/** Sets `on: false` for `key`. Throws if the flag isn't on. */
export function turnFlagOff(src, key) {
  const re = new RegExp(`(["']${key.replace(/-/g, "\\-")}["']\\s*:\\s*\\{[^{}]*?\\bon:\\s*)true\\b`);
  if (!re.test(src)) throw new Error(`flag "${key}" isn't on`);
  return src.replace(re, "$1false");
}

/**
 * Flags that are on now and were turned on in one of `commits` (oldest first,
 * each { date, before, after } with the registry source), with when.
 */
export function recentlyTurnedOn(commits, current) {
  const since = new Map();
  for (const c of commits) {
    const before = parseFlagStates(c.before);
    const after = parseFlagStates(c.after);
    for (const [key, on] of Object.entries(after)) {
      if (on && !before[key]) since.set(key, c.date);
      if (!on) since.delete(key);
    }
  }
  return [...since].filter(([key]) => current[key]).map(([key, onSince]) => ({ key, onSince }));
}

/** Preview specs that belong to `key`: a file belongs to the longest key it starts with. */
export function specsFor(key, files, keys) {
  const owner = (file) => {
    const base = file.split("/").pop() ?? file;
    return keys
      .filter((k) => base.startsWith(`${k}-`) || base.startsWith(`${k}.spec.`))
      .sort((a, b) => b.length - a.length)[0];
  };
  return files.filter((f) => owner(f) === key);
}

// ---------------------------------------------------------------------------
// ROADMAP.md
// ---------------------------------------------------------------------------

const ITEM_LINE = /^- \[( |x|X)\] `([a-z0-9][a-z0-9-]{1,40})`\s+(.+)$/;
const ITEM_LIKE = /^\s*[-*+] \[[^\]]*\]/;
const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const REQUIRED_HEADINGS = ["## How the planner reads this"];

/** Every item line in order, duplicates included, with its indented notes. */
export function readEntries(md) {
  const entries = [];
  let current = null;
  md.split("\n").forEach((line, i) => {
    const m = line.match(ITEM_LINE);
    if (m) {
      current = { key: m[2], title: m[3].trim(), done: m[1] !== " ", line: i + 1, block: line };
      entries.push(current);
      return;
    }
    if (current && /^\s{2,}\S/.test(line)) current.block += `\n${line}`;
    else if (line.trim() !== "") current = null;
  });
  return entries;
}

/** Items as the planner reads them: first occurrence of each key. */
export function parseRoadmap(md) {
  const seen = new Set();
  const items = [];
  for (const e of readEntries(md)) {
    if (seen.has(e.key)) continue;
    seen.add(e.key);
    const details = e.block
      .split("\n")
      .slice(1)
      .map((l) => l.trim())
      .join("\n")
      .trim();
    items.push({ id: e.key, title: e.title, done: e.done, details });
  }
  return items;
}

/** One message per problem; empty means valid. */
export function checkRoadmap(md, flagKeys) {
  const errors = [];
  for (const h of REQUIRED_HEADINGS) {
    if (!md.split("\n").some((l) => l.trim() === h)) errors.push(`Missing the "${h}" section.`);
  }
  md.split("\n").forEach((line, i) => {
    if (ITEM_LIKE.test(line) && !ITEM_LINE.test(line)) {
      errors.push(
        `Line ${i + 1}: not a valid item. Use "- [ ] \`flag-key\` Title" at the start of the line: ${line.trim()}`,
      );
    }
  });
  const seen = new Map();
  for (const e of readEntries(md)) {
    if (!KEY.test(e.key))
      errors.push(`Line ${e.line}: key \`${e.key}\` must be lowercase words joined by single dashes.`);
    if (seen.has(e.key))
      errors.push(`Line ${e.line}: duplicate key \`${e.key}\` (first on line ${seen.get(e.key)}).`);
    else seen.set(e.key, e.line);
  }
  for (const key of flagKeys) {
    if (!seen.has(key))
      errors.push(
        `Flag \`${key}\` has no ROADMAP.md item. Keys can't be renamed or removed once work has started.`,
      );
  }
  return errors;
}

export const countOpen = (md) => readEntries(md).filter((e) => !e.done).length;

export function untickRoadmap(md, key) {
  return md.replace(new RegExp(`^- \\[[xX]\\] (\`${key}\`)`, "m"), "- [ ] $1");
}

// ---------------------------------------------------------------------------
// Planner issues (tagged with a hidden marker)
// ---------------------------------------------------------------------------

const MARKER = /<!-- agent-planner kind=(feature|maintenance|flip)(?: item=([a-z0-9-]+))? -->/;

export const markerFor = (m) =>
  `<!-- agent-planner kind=${m.kind}${m.item ? ` item=${m.item}` : ""} -->`;

export function parseMarker(body) {
  const m = String(body ?? "").match(MARKER);
  return m ? { kind: m[1], item: m[2] ?? null } : null;
}

/** Model-written text can't carry markers or ping people. */
export function sanitizeBody(text) {
  return String(text)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/@(?=[A-Za-z0-9])/g, "@​")
    .slice(0, 6000)
    .trim();
}

export function sanitizeTitle(text) {
  return String(text)
    .replace(/[\r\n]+/g, " ")
    .replace(/@(?=[A-Za-z0-9])/g, "@​")
    .trim()
    .slice(0, 120);
}

export function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/^(feat|fix|chore|docs|refactor|test)(\([^)]*\))?:\s*/, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const words = (t) => new Set(normalizeTitle(t).split(" ").filter((w) => w.length > 2));

/** Same title after normalizing, or 80%+ word overlap. */
export function isDuplicateTitle(title, existing) {
  const norm = normalizeTitle(title);
  const a = words(title);
  return existing.some((other) => {
    if (normalizeTitle(other) === norm) return true;
    const b = words(other);
    if (a.size === 0 || b.size === 0) return false;
    let shared = 0;
    for (const w of a) if (b.has(w)) shared++;
    return shared / (a.size + b.size - shared) >= 0.8;
  });
}

/** "done" | "rolling-out" | "building" | "ready" */
export function itemStatus(item, issues, flags) {
  if (item.done || flags[item.id]?.on) return "done";
  const mine = issues.filter((i) => i.marker.item === item.id);
  const flips = mine.filter((i) => i.marker.kind === "flip");
  // A shipped flip whose flag is off again was rolled back: not done.
  const rolledBack = item.id in flags && !flags[item.id].on;
  if (!rolledBack && flips.some((i) => i.state === "closed" && i.stateReason === "completed"))
    return "done";
  if (flips.some((i) => i.state === "open")) return "rolling-out";
  if (mine.some((i) => i.marker.kind === "feature" && i.state === "open")) return "building";
  return "ready";
}

/** Tonight's item (first ready, if fewer than maxInFlight build), the next one, and the first building. */
export function pickItems(items, statusOf, maxInFlight) {
  const building = items.filter((i) => statusOf(i) === "building");
  const ready = items.filter((i) => statusOf(i) === "ready");
  const waiting = building[0] ?? null;
  if (building.length >= maxInFlight || ready.length === 0)
    return { current: null, next: null, waiting };
  return { current: ready[0], next: ready[1] ?? null, waiting };
}

/** Validates Claude's plan.json. Returns { plan, error }; a bad plan becomes an empty one. */
export function parsePlan(raw) {
  const empty = { complete: [], issues: [], notes: "" };
  if (raw === null || typeof raw !== "object" || Array.isArray(raw))
    return { plan: empty, error: "plan isn't a JSON object" };
  const str = (v, min, max) => typeof v === "string" && v.length >= min && v.length <= max;
  const complete = raw.complete ?? [];
  if (!Array.isArray(complete) || !complete.every((c) => typeof c === "string"))
    return { plan: empty, error: "complete must be a list of item ids" };
  const issues = raw.issues ?? [];
  if (!Array.isArray(issues)) return { plan: empty, error: "issues must be a list" };
  const out = [];
  for (const [n, i] of issues.entries()) {
    const bad = (why) => ({ plan: empty, error: `issue ${n + 1}: ${why}` });
    if (!i || typeof i !== "object") return bad("not an object");
    if (!["feature", "todo", "lint", "deps"].includes(i.kind)) return bad("bad kind");
    if (!str(i.title, 8, 200)) return bad("title must be 8-200 characters");
    if (!str(i.body, 20, 8000)) return bad("body must be 20-8000 characters");
    if (!["low", "protected"].includes(i.risk)) return bad('risk must be "low" or "protected"');
    const paths = i.paths ?? [];
    if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string"))
      return bad("paths must be a list of strings");
    const item = i.item ?? null;
    if (item !== null && typeof item !== "string") return bad("item must be a string or null");
    out.push({ item, kind: i.kind, title: i.title, body: i.body, paths, risk: i.risk });
  }
  const notes = typeof raw.notes === "string" ? raw.notes.slice(0, 2000) : "";
  return { plan: { complete, issues: out, notes }, error: null };
}

export function isLowRisk(issue, cfg) {
  const reasons = [];
  if (issue.kind === "deps") reasons.push("dependency updates change package files");
  if (issue.risk !== "low") reasons.push("the planner rated it protected");
  if (issue.paths.length === 0) reasons.push("no expected files listed");
  const bad = issue.paths.filter((p) => !pathIsLowRisk(p, cfg));
  if (bad.length) reasons.push(`expected files are gated: ${bad.join(", ")}`);
  const hit = sensitiveMention(`${issue.title}\n${issue.body}`, cfg.gate);
  if (hit) reasons.push(`mentions "${hit}"`);
  return { ok: reasons.length === 0, reasons };
}

/** Applies every hard rule to Claude's plan: allowed items, duplicates, the nightly cap, risk. */
export function selectPlan(plan, ctx, cfg) {
  const skipped = [];
  const complete = [];
  for (const id of plan.complete) {
    if (id !== ctx.current) skipped.push({ title: `complete: ${id}`, reason: "not tonight's roadmap item" });
    else if (!ctx.itemsWithShippedWork.includes(id))
      skipped.push({ title: `complete: ${id}`, reason: "no merged work for this item yet" });
    else complete.push(id);
  }
  const allowed = new Set();
  if (ctx.current && !complete.includes(ctx.current)) allowed.add(ctx.current);
  if (ctx.next && ctx.current && complete.includes(ctx.current)) allowed.add(ctx.next);

  let room = Math.max(0, ctx.cap - complete.length);
  const seen = [...ctx.existingTitles];
  const issues = [];
  for (const issue of plan.issues) {
    const title = sanitizeTitle(issue.title);
    if (issue.kind === "feature") {
      if (!issue.item || !allowed.has(issue.item)) {
        skipped.push({ title, reason: `feature for item "${issue.item}" isn't plannable tonight` });
        continue;
      }
    } else if (issue.item) {
      skipped.push({ title, reason: "maintenance issues can't belong to a roadmap item" });
      continue;
    }
    if (isDuplicateTitle(title, seen)) {
      skipped.push({ title, reason: "duplicates an open or recently closed issue" });
      continue;
    }
    if (room <= 0) {
      skipped.push({ title, reason: "nightly cap reached" });
      continue;
    }
    const risk = isLowRisk(issue, cfg);
    issues.push({ ...issue, title, body: sanitizeBody(issue.body), lowRisk: risk.ok, riskReasons: risk.reasons });
    seen.push(title);
    room--;
  }
  return { complete, issues, skipped };
}

/** Whether a finished item's flag may turn on, and whether that flip may merge itself. */
export function flipReadiness({ item, flagExists, flagOn, hasPreviewSpec, shipped, openFeatureIssues, gate }) {
  const reasons = [];
  if (!flagExists) reasons.push(`flag \`${item.id}\` isn't in the flags file`);
  if (flagOn) reasons.push(`flag \`${item.id}\` is already on`);
  if (!hasPreviewSpec) reasons.push(`no preview spec for \`${item.id}\``);
  if (openFeatureIssues > 0) reasons.push(`${openFeatureIssues} feature issue(s) still open`);
  if (shipped.length === 0) reasons.push("no merged PRs for this item");
  for (const s of shipped) {
    if (s.pr === null) reasons.push(`#${s.issue} has no merged agent PR`);
    else if (s.previewE2e !== "success")
      reasons.push(`#${s.pr} has no passing Preview e2e check (${s.previewE2e ?? "none"})`);
  }
  const held = shipped.some((s) => s.heldForReview);
  const sensitive = sensitiveMention(`${item.title}\n${item.details}`, gate) !== null;
  return { ready: reasons.length === 0, lowRisk: !held && !sensitive, reasons };
}

// ---------------------------------------------------------------------------
// Weekly roadmap refill
// ---------------------------------------------------------------------------

export const MAX_REFILL_ITEMS = 5;

function cleanBlock(block) {
  return block
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/@(?=[A-Za-z0-9])/g, "@​")
    .split("\n")
    .filter((l, i) => i === 0 || l.trim() !== "")
    .slice(0, 20)
    .map((l) => l.slice(0, 600))
    .join("\n");
}

/** New, well-formed, unticked items from Claude's proposal, at most MAX_REFILL_ITEMS. */
export function selectProposals(proposalMd, roadmapMd, flagKeys) {
  const taken = new Set([...readEntries(roadmapMd).map((e) => e.key), ...flagKeys]);
  const accepted = [];
  const rejected = [];
  for (const e of readEntries(proposalMd)) {
    if (e.done) rejected.push(`\`${e.key}\`: ticked`);
    else if (!KEY.test(e.key)) rejected.push(`\`${e.key}\`: bad key`);
    else if (taken.has(e.key)) rejected.push(`\`${e.key}\`: key already used`);
    else if (accepted.length >= MAX_REFILL_ITEMS) rejected.push(`\`${e.key}\`: over the limit`);
    else {
      accepted.push({ ...e, block: cleanBlock(e.block) });
      taken.add(e.key);
    }
  }
  return { accepted, rejected };
}

/** Appends items before "## Done", else before "## Needs owner", else at the end. */
export function insertItems(md, items) {
  if (items.length === 0) return md;
  const text = items.map((i) => i.block).join("\n\n");
  const lines = md.split("\n");
  const at = ["## Done", "## Needs owner"]
    .map((h) => lines.findIndex((l) => l.trim() === h))
    .find((i) => i >= 0);
  if (at === undefined) return `${md.replace(/\n*$/, "")}\n\n${text}\n`;
  const before = lines.slice(0, at).join("\n").replace(/\n*$/, "");
  return `${before}\n\n${text}\n\n${lines.slice(at).join("\n")}`;
}
