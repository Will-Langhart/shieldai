// Pure helpers for the database scripts (db-migrate.mjs, db-dryrun.mjs) and
// the auto-merge guard: which files are new migrations, which ones production
// still needs, and the SQL that applies one. Covered by db-lib.test.mjs.
//
// Migrations are tracked in supabase_migrations.schema_migrations by file name
// without .sql ("<number>_<name>"). Everything numbered at or below
// `database.baseline` in config.mjs is taken as applied. Two agent PRs built
// at the same time can pick the same number; both files then apply, in name
// order, since each was dry-run on its own against the same base.

/** Whether `path` (repo-relative) is a correctly named migration file in the migrations folder. */
export function isMigrationFile(path, db) {
  if (!db) return false;
  const dir = `${db.dir.replace(/\/$/, "")}/`;
  return path.startsWith(dir) && db.file.test(path.slice(dir.length));
}

/** Whether `path` is anywhere in the migrations folder. */
export function inMigrationsDir(path, db) {
  return Boolean(db) && path.startsWith(`${db.dir.replace(/\/$/, "")}/`);
}

/** Migrations from a directory listing, ordered by number, then name. Files that don't match are skipped. */
export function parseMigrations(files, db) {
  return files
    .filter((file) => db.file.test(file))
    .map((file) => ({ number: Number(file.match(/^(\d+)_/)[1]), name: file.replace(/\.sql$/, ""), file }))
    .sort((a, b) => a.number - b.number || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** Names recorded in schema_migrations. */
export function appliedNames(names) {
  return new Set(names.filter(Boolean));
}

export function pendingMigrations(migrations, applied, baseline) {
  return migrations.filter((m) => m.number > baseline && !applied.has(m.name));
}

/** Why this SQL can't run inside one transaction, or null when it can. */
export function transactionProblem(sql) {
  const code = String(sql).replace(/--[^\n]*/g, "");
  // A plpgsql block's `begin` has no semicolon; a transaction statement does.
  if (/^\s*(begin|commit|rollback|start\s+transaction)(\s+(work|transaction))?\s*;/im.test(code))
    return "manages its own transaction (BEGIN/COMMIT)";
  if (/\bconcurrently\b/i.test(code)) return "uses CONCURRENTLY, which can't run in a transaction";
  if (/^\s*vacuum\b/im.test(code)) return "runs VACUUM, which can't run in a transaction";
  return null;
}

/** schema_migrations version: UTC apply time as yyyymmddhhmmss, like the dashboard writes. */
export function versionFor(date) {
  return date.toISOString().replace(/\D/g, "").slice(0, 14);
}

function quoteTag(text) {
  let tag = "$migration$";
  for (let i = 0; text.includes(tag); i++) tag = `$migration${i}$`;
  return tag;
}

/** The migration followed by its schema_migrations row, for psql --single-transaction. */
export function applyScript(m, sql, version) {
  const tag = quoteTag(sql);
  return `${sql}
;
insert into supabase_migrations.schema_migrations (version, name, statements, created_by)
values ('${version}', '${m.name}', array[${tag}${sql}${tag}], 'github-actions/db-migrate');
`;
}
