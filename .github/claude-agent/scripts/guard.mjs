// Auto-merge guard for agent PRs, run by .github/workflows/agent-automerge.yml.
// Writes `ok` (true/false) and `reasons` to the step outputs; the workflow then
// turns on auto-merge or holds the PR for the owner.
// Env: GITHUB_TOKEN, GITHUB_REPOSITORY, PR, HEAD (branch), AGENT_AUTOMERGE,
// DB_AUTO_APPLY. Runs from main's checkout, which includes the migrations
// folder, so a new migration is judged against main's earlier ones.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { classifyMigrations } from "./db-gate.mjs";
import { REPO, TOKEN, cfg, gh, ghAll, labeledBy, output, summary, trusted } from "./io.mjs";
import { guardReasons, newMigrations } from "./lib.mjs";

/** A file's text at the PR's head commit. */
async function fileAt(path, ref) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${ref}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!res.ok) throw new Error(`GET ${path}@${ref} → ${res.status}`);
  return res.text();
}

/** The safe-database gate's verdict on the PR's new migrations, or null when it adds none. */
async function dbCheck(files, headSha) {
  const added = newMigrations(files, cfg);
  if (added.length === 0) return null;
  const dir = cfg.database.dir;
  const existing = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .map((f) => readFileSync(join(dir, f), "utf8"))
    : [];
  try {
    const sqls = [];
    for (const path of added.sort()) sqls.push({ path, sql: await fileAt(path, headSha) });
    return { autoApply: process.env.DB_AUTO_APPLY === "true", verdict: classifyMigrations(sqls, existing, cfg.gate.sensitiveText) };
  } catch (err) {
    console.error(err);
    return { autoApply: process.env.DB_AUTO_APPLY === "true", verdict: null };
  }
}

const pr = Number(process.env.PR);
const n = (process.env.HEAD ?? "").replace(/^agent\/issue-/, "");
const reasons = [];

if (!/^\d+$/.test(n)) {
  reasons.push("branch name doesn't name an issue");
} else {
  const issue = await gh(`/repos/${REPO}/issues/${n}`);
  const labels = issue.labels.map((l) => l.name);
  const lowRiskLabeled = labels.includes("agent:low-risk") && trusted(await labeledBy(n, "agent:low-risk"));
  const flip =
    labels.includes("agent:flip") &&
    trusted(await labeledBy(n, "agent:flip")) &&
    /^(app\/)?github-actions(\[bot\])?$/.test(issue.user.login);
  const meta = await gh(`/repos/${REPO}/pulls/${pr}`);
  const files = await ghAll(`/repos/${REPO}/pulls/${pr}/files`, 30);
  const db = await dbCheck(files, meta.head.sha);
  reasons.push(
    ...guardReasons({
      pr: { additions: meta.additions, deletions: meta.deletions, changedFiles: meta.changed_files, files },
      cfg,
      enabled: process.env.AGENT_AUTOMERGE === "true",
      lowRiskLabeled,
      flip,
      issue: n,
      db,
    }),
  );
}

output("ok", reasons.length === 0 ? "true" : "false");
output("reasons", reasons.map((r) => `- ${r}`).join("\n"));
summary(reasons.length ? `Held for review:\n${reasons.map((r) => `- ${r}`).join("\n")}` : "Low-risk: auto-merge allowed.");
