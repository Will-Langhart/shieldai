// Prints the builder's --allowedTools list for claude-code-action: file tools,
// the repo's own checks from config.mjs, and the git/gh commands one agent PR
// needs. Usage: node .github/claude-agent/scripts/builder-tools.mjs <issue-number>
import { cfg } from "./io.mjs";

const n = process.argv[2];
if (!/^\d+$/.test(n ?? "")) {
  console.error("Usage: builder-tools.mjs <issue-number>");
  process.exit(2);
}
const bash = (c) => `Bash(${c})`;
const tools = [
  "Read", "Edit", "Write", "Glob", "Grep",
  ...cfg.checks.flatMap((c) => [bash(c), bash(`${c}:*`)]),
  ...["git status", "git diff", "git log", "git add", "git commit", "git checkout -b", "git restore"].map((c) => bash(`${c}:*`)),
  bash(`git push -u origin agent/issue-${n}`),
  ...["gh issue view", "gh issue comment", "gh pr create", "gh pr view"].map((c) => bash(`${c}:*`)),
];
console.log(tools.join(","));
