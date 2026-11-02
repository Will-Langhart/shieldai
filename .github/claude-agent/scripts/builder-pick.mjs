// Picks the issues one builder run takes, for .github/workflows/agent-builder.yml.
//
//   node .github/claude-agent/scripts/builder-pick.mjs   # writes `issues` (a JSON list) to GITHUB_OUTPUT
//
// Rules (ordering and retries in pickBuildable, lib.mjs):
// - only open issues labeled `agent`, where the owner or the planner added it
// - not held for review (`agent:needs-review`) and no open PR for it yet
// - an issue whose agent PR already merged is closed instead of rebuilt
// - a roadmap item's steps build one at a time, in the order the planner filed them
// - a step blocked only because an earlier step hadn't landed is retried once it has
// Env: GITHUB_TOKEN or GH_TOKEN, GITHUB_REPOSITORY, ONLY (one issue number), MAX (issues this run),
// DRY_RUN=true (report what it would do; change nothing on GitHub).
import { BOT, OWNER, REPO, TOKEN, cfg, gh, ghAll, labeledBy, output, summary, trusted } from "./io.mjs";
import { parseMarker, pickBuildable } from "./lib.mjs";

if (!TOKEN || !REPO) throw new Error("GITHUB_TOKEN and GITHUB_REPOSITORY are required");

const only = (process.env.ONLY ?? "").trim();
const max = Number.parseInt(process.env.MAX ?? "", 10) || cfg.limits.builderIssuesPerRun || 6;
const dry = process.env.DRY_RUN === "true";
const write = (path, opts) => (dry ? Promise.resolve() : gh(path, opts));
const lines = ["## Builder pick", ""];
const names = (i) => i.labels.map((l) => l.name);

async function lastLabeledAt(n, label) {
  const events = await ghAll(`/repos/${REPO}/issues/${n}/events`);
  return events.filter((e) => e.event === "labeled" && e.label?.name === label).at(-1)?.created_at ?? null;
}

const queued = (await ghAll(`/repos/${REPO}/issues?labels=agent&state=open`)).filter(
  (i) => !i.pull_request && !names(i).includes("agent:needs-review"),
);

const featureIssues = (await ghAll(`/repos/${REPO}/issues?labels=${encodeURIComponent("agent:planned")}&state=all`))
  .filter((i) => !i.pull_request && i.user.login === BOT)
  .map((i) => ({ i, m: parseMarker(i.body) }))
  .filter(({ m }) => m?.kind === "feature" && m.item)
  .map(({ i, m }) => ({ number: i.number, item: m.item, state: i.state, closedAt: i.closed_at }));

const candidates = [];
for (const i of queued) {
  const n = i.number;
  if (only && String(n) !== only) continue;
  const by = await labeledBy(n, "agent");
  if (!trusted(by)) {
    lines.push(`- #${n} skipped: \`agent\` label added by '${by}', not the owner or the planner`);
    continue;
  }
  const open = await gh(`/repos/${REPO}/pulls?state=open&head=${OWNER}:agent/issue-${n}`);
  if (open.length) {
    lines.push(`- #${n} skipped: PR #${open[0].number} already open`);
    continue;
  }
  // A merged agent PR means the work shipped; the squash merge doesn't always
  // close the issue, so close it instead of redoing it.
  const closed = await gh(`/repos/${REPO}/pulls?state=closed&head=${OWNER}:agent/issue-${n}`);
  const merged = closed.find((p) => p.merged_at);
  if (merged) {
    await write(`/repos/${REPO}/issues/${n}`, { method: "PATCH", body: { state: "closed", state_reason: "completed" } });
    await write(`/repos/${REPO}/issues/${n}/comments`, { method: "POST", body: { body: `Shipped in #${merged.number}.` } });
    lines.push(`- #${n} closed: shipped in #${merged.number}`);
    const f = featureIssues.find((x) => x.number === n);
    if (f) Object.assign(f, { state: "closed", closedAt: new Date().toISOString() });
    continue;
  }
  const marker = parseMarker(i.body);
  const fromPlanner = i.user.login === BOT && marker;
  const blocked = names(i).includes("agent:blocked");
  candidates.push({
    number: n,
    item: fromPlanner ? marker.item : null,
    kind: fromPlanner ? marker.kind : "other",
    blocked,
    blockedAt: blocked ? await lastLabeledAt(n, "agent:blocked") : null,
  });
}

const { picked, retry, waiting } = pickBuildable(candidates, featureIssues, max);

for (const n of retry) {
  await write(`/repos/${REPO}/issues/${n}/labels/${encodeURIComponent("agent:blocked")}`, { method: "DELETE" });
  await write(`/repos/${REPO}/issues/${n}/comments`, {
    method: "POST",
    body: { body: "Retrying: the earlier step this issue waited on has landed since it was blocked." },
  });
  lines.push(`- #${n} retried: its earlier step landed after it was blocked`);
}
for (const w of waiting) lines.push(`- #${w.number} waits for #${w.on}, the earlier step of its roadmap item`);
if (dry) lines.push("", "Dry run: nothing was changed on GitHub.");
lines.push("", `Picked: ${picked.length ? picked.map((n) => `#${n}`).join(", ") : "nothing"}`);
summary(lines.join("\n"));
output("issues", JSON.stringify(picked));
