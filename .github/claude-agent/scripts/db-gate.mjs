// The safe-database gate: decides whether a new migration only adds to the
// database, so an agent PR carrying it may merge (and be applied) without the
// owner. Pure logic, no I/O; covered by db-gate.test.mjs.
//
// Safe (auto-merges once it also applies cleanly in the CI dry run):
//   - CREATE TABLE / SEQUENCE / TYPE / VIEW / FUNCTION for a brand-new object.
//     Use the plain form (no IF NOT EXISTS, no OR REPLACE): production then
//     proves the object is new by failing if it already exists.
//   - ALTER TABLE ... ADD COLUMN on any table (nullable, or NOT NULL with a
//     constant DEFAULT, no volatile default that rewrites existing rows)
//   - CREATE INDEX (not UNIQUE, not CONCURRENTLY) on any table
//   - on tables created in the same PR: anything (RLS, policies, grants,
//     triggers, constraints, seed rows), and each of them must turn RLS on:
//     Supabase's Data API serves every public table, so a table without RLS
//     would be readable and writable by anyone with the anon key
//   - grants on functions, views and sequences created in the same PR
//   - COMMENT ON, NOTIFY pgrst, SET search_path/lock_timeout/statement_timeout
//
// Everything else waits for the owner: DROP, RENAME, ALTER COLUMN, UPDATE,
// DELETE, TRUNCATE, inserts into existing tables, RLS/policy/grant/trigger
// changes on existing tables, SECURITY DEFINER, views without
// security_invoker, extensions, schemas, roles, DO blocks, transaction control,
// anything in the auth/storage/vault/cron schemas, and any object whose name
// is about money, sign-in or secrets.

const PLATFORM_SCHEMAS = /^(auth|storage|vault|cron|net|pgsodium|realtime|supabase_\w+|extensions|graphql\w*|pg_\w+|information_schema)$/;

/** Replace comments with spaces; keep quotes and dollar-quoted bodies intact. */
function stripComments(sql) {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const two = sql.slice(i, i + 2);
    if (two === "--") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end;
      out += " ";
    } else if (two === "/*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      out += " ";
    } else if (c === "'" || c === '"') {
      const end = closeQuote(sql, i, c);
      out += sql.slice(i, end);
      i = end;
    } else if (c === "$") {
      const tag = sql.slice(i).match(/^\$[A-Za-z_]*\$/)?.[0];
      if (tag) {
        const end = sql.indexOf(tag, i + tag.length);
        const stop = end === -1 ? sql.length : end + tag.length;
        out += sql.slice(i, stop);
        i = stop;
      } else {
        out += c;
        i++;
      }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function closeQuote(sql, i, q) {
  let j = i + 1;
  while (j < sql.length) {
    if (sql[j] === q && sql[j + 1] === q) j += 2;
    else if (sql[j] === q) return j + 1;
    else j++;
  }
  return sql.length;
}

/**
 * Statements of a migration, comments removed, with string literals and
 * dollar-quoted bodies replaced by '' and $$$$ so a body's text can't look like
 * a statement. Returns [{ text, masked }]: `masked` is lowercased, whitespace
 * collapsed; `text` is the original statement.
 */
export function splitStatements(sql) {
  const src = stripComments(String(sql ?? ""));
  const out = [];
  let text = "";
  let masked = "";
  let depth = 0;
  let i = 0;
  const push = () => {
    const m = masked.replace(/\s+/g, " ").trim().toLowerCase();
    if (m) out.push({ text: text.trim(), masked: m });
    text = "";
    masked = "";
  };
  while (i < src.length) {
    const c = src[i];
    if (c === "'") {
      const end = closeQuote(src, i, "'");
      text += src.slice(i, end);
      masked += "''";
      i = end;
    } else if (c === '"') {
      const end = closeQuote(src, i, '"');
      const ident = src.slice(i, end);
      text += ident;
      masked += ident.slice(1, -1).replace(/""/g, '"').replace(/\s/g, "_");
      i = end;
    } else if (c === "$" && /^\$[A-Za-z_]*\$/.test(src.slice(i))) {
      const tag = src.slice(i).match(/^\$[A-Za-z_]*\$/)[0];
      const end = src.indexOf(tag, i + tag.length);
      const stop = end === -1 ? src.length : end + tag.length;
      text += src.slice(i, stop);
      masked += " $$$$ ";
      i = stop;
    } else if (c === ";" && depth === 0) {
      push();
      i++;
    } else {
      if (c === "(") depth++;
      if (c === ")") depth = Math.max(0, depth - 1);
      text += c;
      masked += c;
      i++;
    }
  }
  push();
  return out;
}

/** `public.foo` / `foo` → { schema: "public", name: "foo" }. */
function objectName(raw) {
  const parts = String(raw).replace(/\(.*$/, "").split(".");
  const name = parts.pop();
  const schema = parts.pop() ?? "public";
  return { schema, name, key: `${schema}.${name}` };
}

const IDENT = "[a-z_][a-z0-9_$]*(?:\\.[a-z_][a-z0-9_$]*)?";

/** Split `a, b (c, d), e` on top-level commas. */
function topLevelParts(s) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const c of s) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

// Defaults that Postgres evaluates per row, which rewrites the whole table.
const VOLATILE_DEFAULT = /\bdefault\b[^,]*\b(gen_random_uuid|uuid_generate_\w+|random|clock_timestamp|timeofday|nextval)\s*\(/;

/**
 * Objects a set of migrations creates, by kind: { table, view, function, type, sequence }.
 * Used to tell which names already exist (earlier migrations) and which are
 * new (this PR's migrations).
 */
export function createdObjects(sqls, { plainOnly = false } = {}) {
  const found = { table: new Set(), view: new Set(), function: new Set(), type: new Set(), sequence: new Set() };
  for (const sql of sqls) {
    for (const { masked } of splitStatements(sql)) {
      const m = masked.match(
        new RegExp(
          `^create (or replace )?(?:(?:temp|temporary|unlogged) )?(table|view|materialized view|function|type|sequence) (if not exists )?(${IDENT})`,
        ),
      );
      if (!m) continue;
      if (plainOnly && (m[1] || m[3])) continue;
      const kind = m[2] === "materialized view" ? "view" : m[2];
      found[kind].add(objectName(m[4]).key);
    }
  }
  return found;
}

/**
 * Classifies new migration files.
 *   added: [{ path, sql }] the PR's new migration files, in apply order
 *   existing: [sql] every migration already on main (to spot re-used names)
 *   sensitive: RegExp for object names about money, sign-in or secrets
 * Returns { safe, reasons: ["path: why"], creates: { tables, ... } }.
 */
export function classifyMigrations(added, existing = [], sensitive = null) {
  const before = createdObjects(existing);
  // New = created in this PR with the plain form and not created earlier.
  const plain = createdObjects(added.map((f) => f.sql), { plainOnly: true });
  const isNew = (kind, key) => plain[kind].has(key) && !before[kind].has(key);
  const newAny = (key) => ["table", "view", "function", "sequence", "type"].some((k) => isNew(k, key));
  // A serial/identity column's sequence is named <table>_<col>_seq.
  const newSequence = (key) => isNew("sequence", key) || [...plain.table].some((t) => !before.table.has(t) && key.startsWith(`${t}_`));
  const reasons = [];

  const rlsOn = new Set();
  for (const { path, sql } of added) {
    const stmts = splitStatements(sql);
    if (stmts.length === 0) reasons.push(`${path}: is empty`);
    for (const { masked } of stmts) {
      const why = statementProblem(masked, { isNew, newAny, newSequence, sensitive });
      if (why) reasons.push(`${path}: ${why} (\`${masked.slice(0, 90)}${masked.length > 90 ? "…" : ""}\`)`);
      const alter = masked.match(new RegExp(`^alter table (?:if exists )?(?:only )?(${IDENT}) (.*)$`));
      if (alter && topLevelParts(alter[2]).some((a) => /^enable row level security$/.test(a))) rlsOn.add(objectName(alter[1]).key);
    }
  }
  for (const key of plain.table) {
    if (!before.table.has(key) && !rlsOn.has(key))
      reasons.push(`new table ${key} doesn't turn on row level security (add \`alter table ${key} enable row level security;\`)`);
  }
  return {
    safe: reasons.length === 0,
    reasons,
    creates: Object.fromEntries(Object.entries(plain).map(([k, v]) => [k, [...v].filter((x) => !before[k].has(x))])),
  };
}

/** Names are snake_case, so match the gate's words against them with spaces for underscores. */
const sensitiveName = (name, re) => Boolean(re) && new RegExp(re.source, "i").test(String(name).replace(/_/g, " "));

function statementProblem(s, { isNew, newAny, newSequence, sensitive }) {
  const touchesPlatform = (key) => PLATFORM_SCHEMAS.test(objectName(key).schema);
  const badName = (key) => {
    const { schema, name } = objectName(key);
    if (PLATFORM_SCHEMAS.test(schema)) return `touches the ${schema} schema`;
    if (schema !== "public") return `creates outside the public schema (${schema})`;
    if (sensitiveName(name, sensitive)) return `"${name}" is about money, sign-in or secrets`;
    return null;
  };

  if (/^(begin|commit|rollback|start transaction|end|savepoint|release)\b/.test(s)) return "transaction control";
  if (/^notify pgrst\b/.test(s)) return null;
  if (/^set (local )?(search_path|lock_timeout|statement_timeout)\b/.test(s)) return null;
  if (/^comment on\b/.test(s)) return null;

  // CREATE TABLE
  let m = s.match(new RegExp(`^create (?:(unlogged) )?table (if not exists )?(${IDENT})(.*)$`));
  if (m) {
    const key = objectName(m[3]).key;
    if (m[2]) return "CREATE TABLE IF NOT EXISTS can't prove the table is new; use plain CREATE TABLE";
    if (/^\s*(as|partition of)\b/.test(m[4]) || /\bas select\b/.test(m[4])) return "creates a table from existing data";
    if (!isNew("table", key)) return `table ${key} already exists in an earlier migration`;
    return badName(key);
  }

  // CREATE SEQUENCE / TYPE
  m = s.match(new RegExp(`^create (sequence|type) (if not exists )?(${IDENT})`));
  if (m) {
    const key = objectName(m[3]).key;
    if (m[2]) return `CREATE ${m[1].toUpperCase()} IF NOT EXISTS can't prove it's new`;
    if (!isNew(m[1], key)) return `${m[1]} ${key} already exists`;
    return badName(key);
  }

  // CREATE VIEW
  m = s.match(new RegExp(`^create (or replace )?(materialized )?view (if not exists )?(${IDENT})(.*)$`));
  if (m) {
    const key = objectName(m[4]).key;
    if (m[1]) return "CREATE OR REPLACE VIEW may rewrite an existing view; use plain CREATE VIEW";
    if (m[2]) return "materialized views copy existing data";
    if (!isNew("view", key)) return `view ${key} already exists`;
    if (!/security_invoker\s*=\s*(true|on|1)\b/.test(m[5]))
      return "views must say WITH (security_invoker = true), or they read past row-level security";
    return badName(key);
  }

  // CREATE FUNCTION
  m = s.match(new RegExp(`^create (or replace )?function (${IDENT})\\s*\\(`));
  if (m) {
    const key = objectName(m[2]).key;
    if (m[1]) return "CREATE OR REPLACE FUNCTION may rewrite an existing function; use plain CREATE FUNCTION";
    if (!isNew("function", key)) return `function ${key} already exists`;
    if (/\bsecurity definer\b/.test(s)) return "SECURITY DEFINER functions run past row-level security";
    return badName(key);
  }

  // CREATE INDEX
  m = s.match(new RegExp(`^create (unique )?index (concurrently )?(?:if not exists )?(?:[a-z_][a-z0-9_$]* )?on (?:only )?(${IDENT})`));
  if (m) {
    const key = objectName(m[3]).key;
    if (m[2]) return "CREATE INDEX CONCURRENTLY can't run inside the migration's transaction";
    if (touchesPlatform(key)) return `indexes a table in the ${objectName(key).schema} schema`;
    if (m[1] && !isNew("table", key)) return "a unique index on an existing table can fail on, or reject, existing rows";
    return null;
  }

  // ALTER TABLE
  m = s.match(new RegExp(`^alter table (?:if exists )?(?:only )?(${IDENT}) (.*)$`));
  if (m) {
    const key = objectName(m[1]).key;
    if (/\b(disable|no force) row level security\b/.test(m[2])) return "turns row level security off";
    if (isNew("table", key)) return null;
    if (touchesPlatform(key)) return `changes a table in the ${objectName(key).schema} schema`;
    for (const action of topLevelParts(m[2])) {
      const col = action.match(/^add (?:column )?(if not exists )?([a-z_][a-z0-9_$]*) (.*)$/);
      if (col && !/^(constraint|primary|unique|foreign|check|exclude)\b/.test(action.slice(4))) {
        const def = col[3];
        if (sensitiveName(col[2], sensitive)) return `column "${col[2]}" is about money, sign-in or secrets`;
        if (/\bnot null\b/.test(def) && !/\bdefault\b/.test(def))
          return "a NOT NULL column without a DEFAULT fails on existing rows";
        if (VOLATILE_DEFAULT.test(def)) return "a per-row default rewrites every existing row";
        if (/\bgenerated always as\b.*\bstored\b/.test(def)) return "a stored generated column rewrites every existing row";
        if (/\b(primary key|unique)\b/.test(def)) return "a unique column on an existing table can reject existing rows";
        continue;
      }
      return `changes existing table ${key} (${action.split(" ").slice(0, 3).join(" ")})`;
    }
    return null;
  }

  // Policies, triggers, rules: only on tables new in this PR.
  m = s.match(new RegExp(`^create (?:or replace )?(?:policy|(?:constraint )?trigger|rule) .*? on (${IDENT})`));
  if (m) {
    const key = objectName(m[1]).key;
    return isNew("table", key) ? null : `changes access or behaviour of existing table ${key}`;
  }
  m = s.match(new RegExp(`^(?:drop|alter) policy (?:if exists )?[a-z_][a-z0-9_$]* on (${IDENT})`));
  if (m) {
    const key = objectName(m[1]).key;
    return isNew("table", key) ? null : `changes a policy on existing table ${key}`;
  }

  // GRANT / REVOKE on objects new in this PR
  m = s.match(/^(grant|revoke) .*? on (?:(table|function|sequence|view|routine)s? )?(.*?) (?:to|from) /);
  if (m) {
    if (/^all /.test(m[3]) || /\b(schema|database|tablespace|language|foreign)\b/.test(m[3]))
      return `${m[1].toUpperCase()} on more than new objects`;
    const names = topLevelParts(m[3]).map((n) => objectName(n.trim()).key);
    const bad = names.filter((k) => !(newAny(k) || newSequence(k)));
    return bad.length ? `${m[1].toUpperCase()} on existing objects (${bad.join(", ")})` : null;
  }

  // Seed rows for a new table
  m = s.match(new RegExp(`^insert into (${IDENT})`));
  if (m) {
    const key = objectName(m[1]).key;
    return isNew("table", key) ? null : `writes rows to existing table ${key}`;
  }

  const verb = s.split(" ").slice(0, 2).join(" ");
  if (/^(drop|truncate|delete|update)\b/.test(s)) return `${verb.toUpperCase()} changes or removes existing data or schema`;
  if (/^alter\b/.test(s)) return `${verb.toUpperCase()} changes an existing object`;
  if (/^(create|alter) (extension|schema|role|user|publication|subscription|event trigger|server)\b/.test(s))
    return `${verb.toUpperCase()} changes the database itself`;
  return `${verb.toUpperCase()} isn't on the safe list`;
}
