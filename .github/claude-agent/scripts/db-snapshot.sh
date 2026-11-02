#!/usr/bin/env bash
# Downloads the newest production schema snapshot (artifact `prod-schema`,
# uploaded from main by db-migrate.yml's Schema snapshot job) to $1.
# Prints nothing and leaves no file when there's none yet; the dry run then
# decides whether that's fine (db-dryrun.mjs).
# Env: GH_TOKEN (actions: read), GH_REPO.
set -euo pipefail
out="$1"
id=$(gh api "repos/$GH_REPO/actions/artifacts?name=prod-schema&per_page=30" \
  --jq '[.artifacts[] | select(.expired | not) | select(.workflow_run.head_branch == "main")][0].id // empty' || true)
[ -z "$id" ] && exit 0
tmp=$(mktemp -d)
gh api "repos/$GH_REPO/actions/artifacts/$id/zip" > "$tmp/a.zip"
unzip -q -o "$tmp/a.zip" -d "$tmp"
mv "$tmp/schema.sql" "$out"
echo "Production schema snapshot: artifact $id"
