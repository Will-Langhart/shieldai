// Flag watcher I/O, run by .github/workflows/flag-watch.yml:
//
//   node .github/claude-agent/scripts/flag-watch.mjs plan            # flags to watch → `watch` output
//   node .github/claude-agent/scripts/flag-watch.mjs rollback <key>  # turns <key> off in the working tree
//
// `rollback` only edits files and writes the PR and issue bodies to flag-watch/;
// the workflow commits, opens the PR and turns on auto-merge.
// Env: GH_TOKEN, RUN_URL, WATCH_HOURS (default 72).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { cfg, output, summary } from "./io.mjs";
import {
  isPreviewSpec,
  markerFor,
  parseFlagStates,
  parseRoadmap,
  recentlyTurnedOn,
  sensitiveMention,
  specsFor,
  turnFlagOff,
  untickRoadmap,
} from "./lib.mjs";

const OUT = "flag-watch";
const WATCH_HOURS = Number(process.env.WATCH_HOURS ?? 72);
/** Rollbacks after which the watcher stops filing fixes and waits for the owner. */
const MAX_AUTO_RETRIES = 2;

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 32e6 }).trim();

function showAt(sha) {
  try {
    return execFileSync("git", ["show", `${sha}:${cfg.flagsFile}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function previewSpecs() {
  const dir = cfg.previewSpecDir;
  if (!existsSync(dir)) return [];
  return readdirSync(dir).map((f) => `${dir}/${f}`).filter((f) => isPreviewSpec(f, cfg));
}

function plan() {
  const log = sh("git", ["log", `--since=${WATCH_HOURS} hours ago`, "--reverse", "--format=%H%x09%cI", "--", cfg.flagsFile]);
  const commits = log
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, date] = line.split("\t");
      return { date, before: showAt(`${sha}^`), after: showAt(sha) };
    });
  const current = parseFlagStates(readFileSync(cfg.flagsFile, "utf8"));
  const keys = Object.keys(current);
  const specs = previewSpecs();
  const open = sh("gh", ["pr", "list", "--state", "open", "--label", "agent:rollback", "--json", "headRefName", "--jq", ".[].headRefName"]).split("\n");
  const watch = [];
  for (const { key, onSince } of recentlyTurnedOn(commits, current)) {
    const mine = specsFor(key, specs, keys);
    if (open.some((b) => b.startsWith(`rollback/${key}-`))) summary(`- \`${key}\`: rollback PR already open, skipped.`);
    else if (mine.length === 0) summary(`- \`${key}\` (on since ${onSince}): no preview spec named after it, can't watch it.`);
    else {
      // Paths relative to appDir, where Playwright runs.
      const rel = mine.map((f) => (cfg.appDir === "." ? f : f.replace(`${cfg.appDir.replace(/\/$/, "")}/`, "")));
      watch.push({ key, specs: rel.join(" ") });
      summary(`- \`${key}\` (on since ${onSince}): watching ${mine.length} spec(s) on ${cfg.siteUrl}.`);
    }
  }
  if (watch.length === 0) summary(`No flags turned on in the last ${WATCH_HOURS} hours need watching.`);
  output("watch", JSON.stringify(watch));
  output("site_url", cfg.siteUrl);
  output("spec_dir", cfg.appDir === "." ? cfg.previewSpecDir : cfg.previewSpecDir.replace(`${cfg.appDir.replace(/\/$/, "")}/`, ""));
}

function rollback(key) {
  const prior = sh("gh", [
    "pr", "list", "--state", "merged", "--label", "agent:rollback", "--limit", "100", "--json", "headRefName",
    "--jq", `[.[] | select(.headRefName | startswith("rollback/${key}-"))] | length`,
  ]);
  const retries = Number(prior) || 0;
  const giveUp = retries >= MAX_AUTO_RETRIES;
  writeFileSync(cfg.flagsFile, turnFlagOff(readFileSync(cfg.flagsFile, "utf8"), key));
  const roadmap = readFileSync("ROADMAP.md", "utf8");
  // Ticked + off keeps the planner from flipping it again; unticked lets it retry after a fix.
  if (!giveUp) writeFileSync("ROADMAP.md", untickRoadmap(roadmap, key));
  const item = parseRoadmap(roadmap).find((i) => i.id === key);
  const sensitive = item ? sensitiveMention(`${item.title}\n${item.details}`, cfg.gate) !== null : true;
  const runUrl = process.env.RUN_URL ?? "";

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/pr-body.md`,
    [
      `The flag watcher turned \`${key}\` off: its preview specs failed against ${cfg.siteUrl} twice, 5 minutes apart, after the flag went live.`,
      "",
      `- Failing run: ${runUrl}`,
      `- This PR sets \`on: false\` in \`${cfg.flagsFile}\`${giveUp ? "." : " and unticks the item in `ROADMAP.md` so the planner turns it on again after a fix."}`,
      giveUp
        ? `- This is rollback ${retries + 1} for \`${key}\`, so no fix is queued automatically. It waits for the owner.`
        : `- A fix issue for the builder is filed alongside (rollback ${retries + 1} of ${MAX_AUTO_RETRIES}).`,
      "",
      "Turning a flag off only hides the feature again; the site works as it did before the flip.",
    ].join("\n"),
  );
  writeFileSync(
    `${OUT}/issue-body.md`,
    [
      `\`${key}\` went live and its preview specs then failed against production (${cfg.siteUrl}), so the flag watcher turned it off.`,
      "",
      `Failing run with the Playwright report: ${runUrl}`,
      "",
      `Find out why the feature breaks on production and fix it, so \`${cfg.previewSpecDir}/${key}-*.spec.*\` and the smoke spec pass.`,
      "",
      "Keep the flag off: don't set `on: true`. The planner queues a new flip once this is fixed.",
      "If the spec itself is wrong for production data, say so on this issue instead of weakening it.",
      "",
      markerFor({ kind: "feature", item: key }),
    ].join("\n"),
  );
  output("give_up", giveUp ? "true" : "false");
  output("low_risk", sensitive ? "false" : "true");
  output("attempt", retries + 1);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "plan") plan();
else if (cmd === "rollback" && arg && /^[a-z0-9-]+$/.test(arg)) rollback(arg);
else {
  console.error("Usage: flag-watch.mjs plan | rollback <flag-key>");
  process.exit(2);
}
