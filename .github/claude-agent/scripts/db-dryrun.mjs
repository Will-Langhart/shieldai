// Migration dry run: applies a PR's new migration files to a throwaway local
// Supabase database loaded with production's schema, so a migration is known
// to run cleanly before it can merge. Used by CI ("Agent rules" job) and by
// the builder before it opens a PR.
//
//   node .github/claude-agent/scripts/db-dryrun.mjs
//
// Env:
//   BASE            commit to diff against (default: origin/main)
//   DB_SCHEMA_FILE  production's schema, as `supabase db dump` writes it
//                   (db-migrate.yml's nightly "Schema snapshot" job uploads it)
//   DB_AUTO_APPLY   "true" when safe migrations auto-apply; then a missing
//                   snapshot fails the run instead of skipping it
// Needs Docker. Exits 0 when the PR adds no migrations.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import cfg from "../config.mjs";
import { classifyMigrations } from "./db-gate.mjs";
import { inMigrationsDir, isMigrationFile } from "./db-lib.mjs";

const SUPABASE_CLI = "supabase@2.122.0";
const LOCAL_DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const db = cfg.database;
const lines = [];
const say = (line) => {
  console.log(line);
  lines.push(line);
};
const finish = (code) => {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Migration dry run\n\n${lines.join("\n")}\n`);
  process.exit(code);
};
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });

if (!db) {
  say("No `database` block in config.mjs: nothing to dry-run.");
  finish(0);
}

const base = process.env.BASE || "origin/main";
const changed = run("git", ["diff", "--name-status", `${base}...HEAD`, "--", db.dir])
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    const [status, path] = l.split("\t");
    return { status, path };
  });
const added = changed.filter((c) => c.status === "A" && isMigrationFile(c.path, db)).map((c) => c.path).sort();
const other = changed.filter((c) => !(c.status === "A" && isMigrationFile(c.path, db)) && inMigrationsDir(c.path, db));

if (other.length) say(`Other changes in ${db.dir} (these always wait for the owner): ${other.map((c) => `${c.status} ${c.path}`).join(", ")}`);
if (added.length === 0) {
  say("No new migration files.");
  finish(0);
}
say(`New migrations: ${added.map((p) => `\`${p}\``).join(", ")}`);

// What the gate will say (informational here; agent-automerge.yml decides).
const existing = readdirSync(db.dir)
  .filter((f) => f.endsWith(".sql") && !added.includes(join(db.dir, f)))
  .map((f) => readFileSync(join(db.dir, f), "utf8"));
const verdict = classifyMigrations(
  added.map((path) => ({ path, sql: readFileSync(path, "utf8") })),
  existing,
  cfg.gate.sensitiveText,
);
say(verdict.safe ? "Safe-database gate: additive only." : `Safe-database gate: waits for the owner:\n${verdict.reasons.map((r) => `- ${r}`).join("\n")}`);

const snapshot = process.env.DB_SCHEMA_FILE ?? "";
if (!snapshot || !existsSync(snapshot)) {
  const required = process.env.DB_AUTO_APPLY === "true";
  say(
    required
      ? "No production schema snapshot to test against (DB_SCHEMA_FILE). Run db-migrate.yml once so its Schema snapshot job uploads one."
      : "Skipped: no production schema snapshot yet (auto-apply is off, so these migrations wait for the owner anyway).",
  );
  finish(required ? 1 : 0);
}

const work = mkdtempSync(join(tmpdir(), "db-dryrun-"));
const npx = (args) => run("npx", ["--yes", SUPABASE_CLI, ...args, "--workdir", work], { timeout: 15 * 60_000 });
let code = 0;
try {
  npx(["init", "--force"]);
  npx(["db", "start"]);
  // Production's schema. A few statements can fail on a local stack (managed
  // extensions, roles); count them, they don't decide the result.
  let restoreErrors = 0;
  try {
    const out = execFileSync("psql", [LOCAL_DB, "-X", "-q", "-v", "ON_ERROR_STOP=0", "-f", snapshot], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    restoreErrors = (out.match(/ERROR:/g) ?? []).length;
  } catch (err) {
    restoreErrors = (String(err.stderr ?? "").match(/ERROR:/g) ?? []).length;
  }
  say(`Loaded production's schema (${restoreErrors} statement${restoreErrors === 1 ? "" : "s"} skipped).`);

  for (const path of added) {
    try {
      run("psql", [LOCAL_DB, "-X", "-q", "-v", "ON_ERROR_STOP=1", "--single-transaction", "-f", path]);
      say(`- \`${path}\` applied cleanly`);
    } catch (err) {
      say(`- **\`${path}\` failed**:\n\n\`\`\`\n${String(err.stderr ?? err).trim()}\n\`\`\``);
      code = 1;
      break;
    }
  }
} catch (err) {
  say(`Couldn't start the local database: ${String(err.stderr ?? err.message ?? err).trim().slice(0, 2000)}`);
  code = 1;
} finally {
  try {
    npx(["stop", "--no-backup"]);
  } catch {
    // already stopped
  }
}
finish(code);
