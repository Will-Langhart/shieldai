// node --test .github/claude-agent/scripts/
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appliedNames,
  applyScript,
  isMigrationFile,
  parseMigrations,
  pendingMigrations,
  transactionProblem,
  versionFor,
} from "./db-lib.mjs";

const db = { dir: "db/migrations", file: /^\d{4}_[a-z0-9_]+\.sql$/, baseline: 2 };

describe("db-lib", () => {
  it("knows a migration file by folder and name", () => {
    assert.equal(isMigrationFile("db/migrations/0003_lists.sql", db), true);
    assert.equal(isMigrationFile("db/migrations/lists.sql", db), false);
    assert.equal(isMigrationFile("db/migrations/sub/0003_lists.sql", db), false);
    assert.equal(isMigrationFile("other/0003_lists.sql", db), false);
    assert.equal(isMigrationFile("db/migrations/0003_lists.sql", undefined), false);
  });
  it("orders numbered files by number then name, skipping others", () => {
    assert.deepEqual(
      parseMigrations(["0004_b.sql", "schema.sql", "0003_z.sql", "0003_a.sql"], db).map((m) => m.name),
      ["0003_a", "0003_z", "0004_b"],
    );
  });
  it("finds what production is missing above the baseline, by name", () => {
    const all = parseMigrations(["0001_x.sql", "0002_y.sql", "0003_a.sql", "0003_c.sql", "0004_b.sql"], db);
    const applied = appliedNames(["0003_a", "enable_rls", null]);
    assert.deepEqual(pendingMigrations(all, applied, db.baseline).map((m) => m.name), ["0003_c", "0004_b"]);
  });
  it("flags SQL that can't run in one transaction", () => {
    assert.match(transactionProblem("begin;\ncreate table a (id int);\ncommit;"), /BEGIN\/COMMIT/);
    assert.match(transactionProblem("create index concurrently i on a (id);"), /CONCURRENTLY/);
    assert.equal(transactionProblem("create function f() returns int language plpgsql as $$ begin return 1; end $$;"), null);
  });
  it("records the migration in the same script", () => {
    const s = applyScript({ name: "0003_a" }, "create table a (id int);", versionFor(new Date("2026-11-02T03:04:05Z")));
    assert.match(s, /values \('20261102030405', '0003_a', array\[\$migration\$create table a/);
  });
});
