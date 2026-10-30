// Auto-merge guard for agent PRs, run by .github/workflows/agent-automerge.yml.
// Writes `ok` (true/false) and `reasons` to the step outputs; the workflow then
// turns on auto-merge or holds the PR for the owner.
// Env: GITHUB_TOKEN, GITHUB_REPOSITORY, PR, HEAD (branch), AGENT_AUTOMERGE.
import { REPO, cfg, gh, ghAll, labeledBy, output, summary, trusted } from "./io.mjs";
import { guardReasons } from "./lib.mjs";

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
  reasons.push(
    ...guardReasons({
      pr: { additions: meta.additions, deletions: meta.deletions, changedFiles: meta.changed_files, files },
      cfg,
      enabled: process.env.AGENT_AUTOMERGE === "true",
      lowRiskLabeled,
      flip,
      issue: n,
    }),
  );
}

output("ok", reasons.length === 0 ? "true" : "false");
output("reasons", reasons.map((r) => `- ${r}`).join("\n"));
summary(reasons.length ? `Held for review:\n${reasons.map((r) => `- ${r}`).join("\n")}` : "Low-risk: auto-merge allowed.");
