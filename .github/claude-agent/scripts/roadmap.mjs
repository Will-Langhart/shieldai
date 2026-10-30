// ROADMAP.md check (CI) and the weekly refill (.github/workflows/roadmap-refill.yml):
//
//   node .github/claude-agent/scripts/roadmap.mjs check    # fails on a malformed ROADMAP.md
//   node .github/claude-agent/scripts/roadmap.mjs context  # decides whether to refill; writes refill/context.md
//   node .github/claude-agent/scripts/roadmap.mjs apply    # merges refill/items.md into ROADMAP.md
//
// `apply` treats refill/items.md as untrusted model output.
// Env (context/apply): GH_TOKEN, REFILL_FORCE ("true" runs with 3+ items left).
import { mkdirSync, writeFileSync } from "node:fs";
import { RUN_URL, cfg, output, readText, run, summary } from "./io.mjs";
import { checkRoadmap, countOpen, insertItems, parseFlagStates, readEntries, selectProposals } from "./lib.mjs";

const OUT = "refill";
const MIN_OPEN = 3;
const BRANCH_PREFIX = "chore/roadmap-refill-";
const flagKeys = Object.keys(parseFlagStates(readText(cfg.flagsFile)));

function check() {
  const md = readText("ROADMAP.md");
  const errors = checkRoadmap(md, flagKeys);
  if (errors.length) {
    for (const e of errors) console.error(`::error file=ROADMAP.md::${e}`);
    process.exit(1);
  }
  console.log(`ROADMAP.md is valid: ${countOpen(md)} unticked items.`);
}

function context() {
  const md = readText("ROADMAP.md");
  const open = countOpen(md);
  const pending = run("gh", [
    "pr", "list", "--state", "open", "--json", "headRefName",
    "--jq", `[.[] | select(.headRefName | startswith("${BRANCH_PREFIX}"))] | length`,
  ]).trim();
  if (pending !== "0") {
    summary(`Skipped: a roadmap refill PR is already open (or the PR list failed: ${pending}).`);
    return output("run_claude", "false");
  }
  if (open >= MIN_OPEN && process.env.REFILL_FORCE !== "true") {
    summary(`Skipped: ${open} unticked items left (refills below ${MIN_OPEN}).`);
    return output("run_claude", "false");
  }
  const since = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
  const text = [
    "# Roadmap refill context",
    "",
    `Unticked items left: ${open}. Propose 3 to 5 new items.`,
    "",
    "## Keys already used (roadmap items and flags)",
    "",
    [...new Set([...readEntries(md).map((e) => e.key), ...flagKeys])].map((k) => `\`${k}\``).join(", ") || "(none)",
    "",
    "## PRs merged in the last 60 days",
    "",
    run("gh", ["pr", "list", "--state", "merged", "--search", `merged:>=${since}`, "--limit", "60", "--json", "number,title", "--jq", '.[] | "- #\\(.number) \\(.title)"']).trim() || "(none)",
    "",
    "## Open issues",
    "",
    run("gh", ["issue", "list", "--state", "open", "--limit", "60", "--json", "number,title", "--jq", '.[] | "- #\\(.number) \\(.title)"']).trim() || "(none)",
    "",
    "## CHANGELOG.md (top)",
    "",
    readText("CHANGELOG.md").split("\n").slice(0, 120).join("\n") || "(none)",
    "",
  ].join("\n");
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/context.md`, text);
  output("run_claude", "true");
}

function apply() {
  const md = readText("ROADMAP.md");
  const { accepted, rejected } = selectProposals(readText(`${OUT}/items.md`), md, flagKeys);
  const next = insertItems(md, accepted);
  const errors = checkRoadmap(next, flagKeys);
  if (accepted.length === 0 || errors.length) {
    summary(`No PR: ${accepted.length === 0 ? "no usable items" : errors.join("; ")}. Rejected: ${rejected.join(", ") || "none"}.`);
    return output("count", 0);
  }
  writeFileSync("ROADMAP.md", next);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/pr-body.md`,
    [
      `The weekly roadmap refill proposes ${accepted.length} new item(s) for \`ROADMAP.md\`, because fewer than ${MIN_OPEN} were left unticked.`,
      "",
      ...accepted.map((e) => `- \`${e.key}\` ${e.title}`),
      "",
      "Edit, reorder or delete them, then merge. Nothing here is built until this PR merges.",
      rejected.length ? `\nLeft out: ${rejected.join(", ")}.` : "",
      "",
      `[Run](${RUN_URL})`,
    ].join("\n"),
  );
  summary(`Proposed ${accepted.length} item(s).`);
  output("count", accepted.length);
}

const cmd = process.argv[2];
if (cmd === "check") check();
else if (cmd === "context") context();
else if (cmd === "apply") apply();
else {
  console.error("Usage: roadmap.mjs check | context | apply");
  process.exit(2);
}
