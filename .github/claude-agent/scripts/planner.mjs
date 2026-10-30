// Nightly planner I/O, run by .github/workflows/agent-planner.yml:
//
//   node .github/claude-agent/scripts/planner.mjs context  # writes planner/context.md for Claude
//   node .github/claude-agent/scripts/planner.mjs file     # files issues from planner/plan.json
//
// `file` recomputes all state and treats plan.json as untrusted model output:
// every hard rule (items, cap, duplicates, risk) is enforced in lib.mjs.
// Env: GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, AGENT_FLAG_FLIPS ("false" stops flips).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { BOT, OWNER, REPO, RUN_URL, TOKEN, cfg, gh, ghAll, output, readText, run, summary } from "./io.mjs";
import {
  flipReadiness,
  isPreviewSpec,
  itemStatus,
  markerFor,
  parseFlagStates,
  parseMarker,
  parsePlan,
  parseRoadmap,
  pathIsLowRisk,
  pickItems,
  selectPlan,
  specsFor,
} from "./lib.mjs";

const OUT = "planner";
const PREVIEW_CHECK = "Preview e2e";
const flags = Object.fromEntries(
  Object.entries(parseFlagStates(readText(cfg.flagsFile))).map(([k, on]) => [k, { on }]),
);

async function gatherState() {
  const roadmap = parseRoadmap(readText("ROADMAP.md"));
  const planned = (
    await ghAll(`/repos/${REPO}/issues?labels=${encodeURIComponent("agent:planned")}&state=all`)
  ).filter((i) => !i.pull_request && i.user.login === BOT);
  const plannerIssues = [];
  for (const i of planned) {
    const marker = parseMarker(i.body);
    if (!marker) continue;
    plannerIssues.push({
      number: i.number,
      title: i.title,
      state: i.state,
      stateReason: i.state_reason,
      labels: i.labels.map((l) => l.name),
      marker,
    });
  }
  const status = new Map(roadmap.map((item) => [item.id, itemStatus(item, plannerIssues, flags)]));
  const { current, next, waiting } = pickItems(
    roadmap,
    (i) => status.get(i.id) ?? "ready",
    cfg.limits.maxInFlight,
  );

  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const open = (await ghAll(`/repos/${REPO}/issues?state=open`)).filter((i) => !i.pull_request);
  const recent = (await ghAll(`/repos/${REPO}/issues?state=closed&since=${since}`, 3)).filter(
    (i) => !i.pull_request,
  );
  const all = [...open, ...recent];
  const isTrusted = (i) => i.user.login === BOT || i.user.login.toLowerCase() === OWNER.toLowerCase();
  const queueDepth = open.filter((i) => {
    const names = i.labels.map((l) => l.name);
    return names.includes("agent") && !names.includes("agent:blocked") && !names.includes("agent:needs-review");
  }).length;

  return {
    roadmap,
    plannerIssues,
    status,
    current,
    next,
    waiting,
    queueDepth,
    cap: queueDepth >= cfg.limits.queueLimit ? 0 : cfg.limits.newIssuesPerNight,
    allTitles: all.map((i) => i.title),
    trustedTitles: all.filter(isTrusted).map((i) => `#${i.number} [${i.state}] ${i.title}`),
  };
}

const clip = (t, max) => (t.length > max ? `${t.slice(0, max)}\n… (cut)` : t);

function describeItem(state, item) {
  const mine = state.plannerIssues.filter((i) => i.marker.item === item.id);
  const flag = flags[item.id];
  return [
    `### \`${item.id}\` ${item.title}`,
    item.details || "(no details)",
    "",
    `Feature flag \`${item.id}\`: ${flag ? (flag.on ? "exists, on" : "exists, off") : "not added yet"}`,
    "",
    "Planner issues for this item:",
    mine.length
      ? mine
          .map((i) => `- #${i.number} [${i.state}${i.stateReason ? `, ${i.stateReason}` : ""}] (${i.marker.kind}) ${i.title}`)
          .join("\n")
      : "None yet.",
  ].join("\n");
}

async function context() {
  const state = await gatherState();
  mkdirSync(OUT, { recursive: true });
  const lint = clip(run("bash", ["-c", cfg.planner.lintCommand]), 6000);
  const todos = clip(
    run("git", ["grep", "-n", "-I", "-E", "\\b(TODO|FIXME)\\b", "--", ...cfg.planner.todoDirs])
      .split("\n")
      .slice(0, 40)
      .join("\n"),
    5000,
  );
  let deps = "";
  try {
    const outdated = JSON.parse(run("npm", ["outdated", "--json"], { cwd: cfg.appDir }) || "{}");
    deps = Object.entries(outdated)
      .filter(([, v]) => v.current && v.wanted && v.current !== v.wanted)
      .slice(0, 20)
      .map(([name, v]) => `- ${name}: ${v.current} → ${v.wanted} (latest ${v.latest})`)
      .join("\n");
  } catch {
    deps = "(npm outdated failed)";
  }

  const lines = [
    "# Planner context",
    "",
    `Room tonight: ${state.cap} new issue(s). Builder backlog: ${state.queueDepth} queued issue(s).`,
    "",
    "## Roadmap",
    "",
    ...state.roadmap.map((i) => `- \`${i.id}\` ${i.title}: ${state.status.get(i.id)}`),
    "",
  ];
  if (state.current) {
    lines.push("## Tonight's roadmap item", "", describeItem(state, state.current), "");
    if (state.waiting)
      lines.push(`Also in flight: \`${state.waiting.id}\` still has open issues. Don't plan issues for it.`, "");
    if (state.next)
      lines.push("## Next item (plan it only if you mark tonight's item complete)", "", describeItem(state, state.next), "");
  } else {
    lines.push(
      "## Tonight's roadmap item",
      "",
      state.waiting
        ? `None: \`${state.waiting.id}\` is still being built and no other item can start yet. Plan maintenance only.`
        : "None: every roadmap item is done or rolling out. Plan maintenance only.",
      "",
    );
  }
  lines.push(
    "## Open and recently closed issues (don't duplicate these)",
    "",
    ...state.trustedTitles.slice(0, 80).map((t) => `- ${t}`),
    "",
    "## Lint output",
    "",
    "```",
    lint.trim() || "(clean)",
    "```",
    "",
    "## TODO / FIXME comments",
    "",
    "```",
    todos.trim() || "(none)",
    "```",
    "",
    "## Dependency updates within current ranges",
    "",
    deps || "(none)",
    "",
  );
  writeFileSync(`${OUT}/context.md`, lines.join("\n"));
  output("run_claude", state.cap > 0 ? "true" : "false");
}

const LABELS = [
  ["agent", "5319E7", "Queue for the builder agent"],
  ["agent:low-risk", "0E8A16", "Agent PR may auto-merge when checks pass"],
  ["agent:planned", "C5DEF5", "Filed by the nightly planner"],
  ["agent:flip", "1D76DB", "Turns a feature flag on"],
  ["agent:waiting-preview", "D4C5F9", "Flag flip waits for preview tests"],
  ["agent:blocked", "B60205", "Agent stopped; see its comment. Remove to retry"],
  ["agent:needs-review", "FBCA04", "Agent PR waits for the owner's merge"],
  ["agent:rollback", "B60205", "Flag watcher turned a live feature off"],
];

async function ensureLabels() {
  for (const [name, color, description] of LABELS) {
    try {
      await gh(`/repos/${REPO}/labels`, { method: "POST", body: { name, color, description } });
    } catch {
      // 422: already exists
    }
  }
}

async function createIssue(title, body, labels) {
  const issue = await gh(`/repos/${REPO}/issues`, { method: "POST", body: { title, body } });
  // Separate call so each label gets a `labeled` event by this bot, which the builder checks.
  await gh(`/repos/${REPO}/issues/${issue.number}/labels`, { method: "POST", body: { labels } });
  return issue.number;
}

function featureFooter(item, lowRisk, reasons) {
  const parts = ["---"];
  if (item)
    parts.push(
      `Roadmap item \`${item}\`. Ship this behind the \`${item}\` feature flag: if it isn't in \`${cfg.flagsFile}\` yet, add it with \`on: false\`, and add a new \`${cfg.previewSpecDir}/${item}-<what-it-covers>.spec.ts\` that checks the feature on the preview.`,
    );
  parts.push(lowRisk ? "Auto-merge: allowed once checks pass." : `Auto-merge: no, held for the owner (${reasons.join("; ")}).`);
  parts.push(`Filed by the nightly planner ([run](${RUN_URL})).`);
  return parts.join("\n\n");
}

function flipBody(item) {
  return [
    `Turn on the \`${item.id}\` feature flag. The planner judged roadmap item \`${item.id}\` (${item.title}) built.`,
    "",
    "This issue waits (label `agent:waiting-preview`) until every PR for the item is merged and passed the Preview e2e check; then the planner queues it for the builder.",
    "",
    "What to change, and nothing else:",
    `- In \`${cfg.flagsFile}\`, set \`on: true\` for \`"${item.id}"\`.`,
    `- In \`ROADMAP.md\`, tick the box for \`${item.id}\`.`,
    "- Add a CHANGELOG.md line saying the feature is live.",
    "",
    "No new tests: the feature's tests already passed on the preview.",
    "",
    "---",
    `Filed by the nightly planner ([run](${RUN_URL})).`,
  ].join("\n");
}

async function shippedWork(issue) {
  const pulls = await gh(`/repos/${REPO}/pulls?state=closed&head=${OWNER}:agent/issue-${issue.number}&per_page=20`);
  const pr = pulls.find((p) => p.merged_at);
  if (!pr) return { issue: issue.number, pr: null, previewE2e: null, heldForReview: false };
  const checks = await gh(
    `/repos/${REPO}/commits/${pr.head.sha}/check-runs?check_name=${encodeURIComponent(PREVIEW_CHECK)}`,
  );
  const latest = [...checks.check_runs].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))[0];
  const files = await ghAll(`/repos/${REPO}/pulls/${pr.number}/files`, 3);
  const held =
    pr.labels.some((l) => l.name === "agent:needs-review") || files.some((f) => !pathIsLowRisk(f.filename, cfg));
  return { issue: issue.number, pr: pr.number, previewE2e: latest?.conclusion ?? null, heldForReview: held };
}

function hasPreviewSpec(id) {
  const dir = cfg.previewSpecDir;
  if (!existsSync(dir)) return false;
  const files = readdirSync(dir).map((f) => `${dir}/${f}`).filter((f) => isPreviewSpec(f, cfg));
  if (specsFor(id, files, Object.keys(flags)).length > 0) return true;
  return files.some((f) => readFileSync(f, "utf8").includes(`"${id}"`));
}

async function file() {
  const state = await gatherState();
  const lines = ["## Nightly planner", ""];
  await ensureLabels();

  let raw = {};
  try {
    raw = JSON.parse(readText(`${OUT}/plan.json`) || "{}");
  } catch {
    lines.push("Claude's plan wasn't valid JSON, so it was ignored.");
  }
  const { plan, error } = parsePlan(raw);
  if (error) lines.push(`Claude's plan didn't validate, so it was ignored: ${error}`);
  if (plan.notes) lines.push(`Planner notes: ${plan.notes}`, "");

  const itemsWithShippedWork = state.roadmap
    .filter((item) =>
      state.plannerIssues.some((i) => i.marker.item === item.id && i.marker.kind === "feature" && i.stateReason === "completed"),
    )
    .map((i) => i.id);

  const sel = selectPlan(
    plan,
    {
      current: state.current?.id ?? null,
      next: state.next?.id ?? null,
      itemsWithShippedWork,
      existingTitles: state.allTitles,
      cap: state.cap,
    },
    cfg,
  );

  for (const id of sel.complete) {
    const item = state.roadmap.find((i) => i.id === id);
    if (!item) continue;
    const labels = ["agent:planned", "agent:flip", "agent:waiting-preview"];
    const n = await createIssue(`Turn on the ${id} feature flag`, `${flipBody(item)}\n${markerFor({ kind: "flip", item: id })}`, labels);
    state.plannerIssues.push({ number: n, title: `Turn on the ${id} feature flag`, state: "open", stateReason: null, labels, marker: { kind: "flip", item: id } });
    lines.push(`- Filed #${n}: flag flip for \`${id}\` (waits for preview tests)`);
  }

  for (const issue of sel.issues) {
    const kind = issue.kind === "feature" ? "feature" : "maintenance";
    // The builder can't change package files, so dependency updates wait for the owner, unqueued.
    const queued = issue.kind !== "deps";
    const footer = queued
      ? featureFooter(issue.item, issue.lowRisk, issue.riskReasons)
      : `---\n\nNot queued: the builder can't change package files. Do it yourself or close this.\n\nFiled by the nightly planner ([run](${RUN_URL})).`;
    const labels = ["agent:planned", ...(queued ? ["agent"] : []), ...(issue.lowRisk ? ["agent:low-risk"] : [])];
    const n = await createIssue(issue.title, `${issue.body}\n\n${footer}\n${markerFor({ kind, item: issue.item })}`, labels);
    lines.push(`- Filed #${n}: ${issue.title} (${!queued ? "not queued, for the owner" : issue.lowRisk ? "low-risk" : "held for review"})`);
  }
  for (const s of sel.skipped) lines.push(`- Skipped "${s.title}": ${s.reason}`);
  if (state.cap === 0) lines.push(`- Builder backlog is ${state.queueDepth} issues, so nothing new was planned.`);
  if (state.waiting) lines.push(`- Roadmap item \`${state.waiting.id}\` is still being built.`);

  if (process.env.AGENT_FLAG_FLIPS === "false") {
    lines.push('- Flag flips are switched off (AGENT_FLAG_FLIPS is "false").');
  } else {
    const waiting = state.plannerIssues.filter(
      (i) => i.marker.kind === "flip" && i.state === "open" && i.labels.includes("agent:waiting-preview"),
    );
    for (const flip of waiting) {
      const item = state.roadmap.find((i) => i.id === flip.marker.item);
      if (!item) {
        lines.push(`- Flip #${flip.number}: its item is gone from ROADMAP.md`);
        continue;
      }
      const featureIssues = state.plannerIssues.filter((i) => i.marker.item === item.id && i.marker.kind === "feature");
      const shipped = [];
      for (const i of featureIssues.filter((x) => x.state === "closed" && x.stateReason === "completed"))
        shipped.push(await shippedWork(i));
      const r = flipReadiness({
        item,
        flagExists: item.id in flags,
        flagOn: flags[item.id]?.on === true,
        hasPreviewSpec: hasPreviewSpec(item.id),
        shipped,
        openFeatureIssues: featureIssues.filter((i) => i.state === "open").length,
        gate: cfg.gate,
      });
      if (!r.ready) {
        lines.push(`- Flip #${flip.number} (\`${item.id}\`) waits: ${r.reasons.join("; ")}`);
        continue;
      }
      await gh(`/repos/${REPO}/issues/${flip.number}/labels`, {
        method: "POST",
        body: { labels: ["agent", ...(r.lowRisk ? ["agent:low-risk"] : [])] },
      });
      await gh(`/repos/${REPO}/issues/${flip.number}/labels/${encodeURIComponent("agent:waiting-preview")}`, { method: "DELETE" });
      await gh(`/repos/${REPO}/issues/${flip.number}/comments`, {
        method: "POST",
        body: {
          body: `Preview tests passed on ${shipped.map((s) => `#${s.pr}`).join(", ")}. Queued for the builder${r.lowRisk ? "" : "; its PR will wait for the owner's merge because the feature is gated"}.`,
        },
      });
      lines.push(`- Flip #${flip.number} (\`${item.id}\`) queued${r.lowRisk ? " (low-risk)" : " (held for review)"}`);
    }
  }
  summary(lines.join("\n"));
}

const cmd = process.argv[2];
if (!TOKEN || !REPO) throw new Error("GITHUB_TOKEN and GITHUB_REPOSITORY are required");
if (cmd === "context") await context();
else if (cmd === "file") await file();
else throw new Error(`Unknown command: ${cmd ?? "(none)"}`);
