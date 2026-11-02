// Applies new migrations to production, run by .github/workflows/db-migrate.yml.
//
//   node .github/claude-agent/scripts/db-migrate.mjs plan    # list what production is missing
//   node .github/claude-agent/scripts/db-migrate.mjs auto    # apply it only if all of it is additive
//   node .github/claude-agent/scripts/db-migrate.mjs apply   # apply it all (the owner started this run)
//
// Each migration runs in one transaction together with its schema_migrations
// row, so a failure leaves neither behind, and the run stops at the first
// failure. Env: SUPABASE_DB_URL (session pooler connection string; GitHub
// runners have no IPv6 for the direct host), GITHUB_STEP_SUMMARY.
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import cfg from "../config.mjs";
import { classifyMigrations } from "./db-gate.mjs";
import { applyScript, appliedNames, parseMigrations, pendingMigrations, transactionProblem, versionFor } from "./db-lib.mjs";

const db = cfg.database;
const URL = process.env.SUPABASE_DB_URL ?? "";
const mode = process.argv[2];

function summary(line) {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
}

function psql(args) {
  return execFileSync("psql", [URL, "-X", "-q", "-v", "ON_ERROR_STOP=1", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

if (!["plan", "auto", "apply"].includes(mode)) {
  console.error("Usage: db-migrate.mjs plan|auto|apply");
  process.exit(2);
}
if (!db) {
  summary("No `database` block in config.mjs.");
  process.exit(0);
}
if (!URL) {
  console.error("SUPABASE_DB_URL isn't set.");
  process.exit(1);
}

const files = readdirSync(db.dir);
const all = parseMigrations(files, db);
// A project whose migrations were all run by hand may not have the table yet.
const hasTable = psql(["-At", "-c", "select to_regclass('supabase_migrations.schema_migrations') is not null"]).trim() === "t";
if (!hasTable && mode !== "plan") {
  psql([
    "-c",
    "create schema if not exists supabase_migrations; create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text, created_by text);",
  ]);
}
const names = hasTable
  ? psql(["-At", "-c", "select name from supabase_migrations.schema_migrations"]).split("\n").filter(Boolean)
  : [];
const todo = pendingMigrations(all, appliedNames(names), db.baseline);
if (todo.length === 0) {
  summary("No pending migrations.");
  process.exit(0);
}

const sqlOf = new Map(todo.map((m) => [m.name, readFileSync(join(db.dir, m.file), "utf8")]));
for (const m of todo) {
  const problem = transactionProblem(sqlOf.get(m.name));
  if (problem) {
    summary(`- \`${m.file}\` ${problem}. Apply it by hand, then record it in supabase_migrations.schema_migrations.`);
    process.exit(1);
  }
}

summary(`Pending migrations (${todo.length}):`);
for (const m of todo) summary(`- \`${m.file}\``);

if (mode === "auto") {
  // The pending set is judged together, against every other file in the
  // folder, so a policy may build on a table created earlier in the same set.
  const pendingFiles = new Set(todo.map((m) => m.file));
  const existing = files.filter((f) => f.endsWith(".sql") && !pendingFiles.has(f)).map((f) => readFileSync(join(db.dir, f), "utf8"));
  const verdict = classifyMigrations(
    todo.map((m) => ({ path: m.file, sql: sqlOf.get(m.name) })),
    existing,
    cfg.gate.sensitiveText,
  );
  if (!verdict.safe) {
    summary("\nNot all of it is additive, so it waits for the owner: run this workflow by hand with mode `apply`.");
    for (const r of verdict.reasons) summary(`- ${r}`);
    process.exit(0);
  }
}
if (mode === "plan") process.exit(0);

const dir = mkdtempSync(join(tmpdir(), "db-migrate-"));
for (const m of todo) {
  const file = join(dir, m.file);
  writeFileSync(file, applyScript(m, sqlOf.get(m.name), versionFor(new Date())));
  try {
    psql(["--single-transaction", "-f", file]);
  } catch (err) {
    summary(`\n**\`${m.file}\` failed and was rolled back.** Later migrations weren't run.`);
    summary(`\n\`\`\`\n${String(err.stderr ?? err).trim()}\n\`\`\``);
    process.exit(1);
  }
  summary(`- Applied \`${m.file}\``);
}
// db-migrate.yml refreshes the schema snapshot after anything was applied.
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, "applied=true\n");
