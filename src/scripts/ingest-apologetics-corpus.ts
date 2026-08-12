/**
 * Ingest a real apologetics corpus into the `apologetics-kb` Pinecone index.
 *
 * Grows the KB past its original 6 in-code entries. Reads a directory of `.md`
 * (with YAML-ish front-matter) and/or `.json` files, maps each to a KB entry,
 * and upserts via the chunk-aware ingest pipeline (lib/apologetics-kb-ingest.ts).
 *
 * Run (needs PINECONE_API_KEY — pull it from Vercel like the eval harness):
 *   cd src/apps/web && vercel env pull ../../scripts/eval/.env.eval
 *   cd ../../.. && npx tsx --env-file=src/scripts/eval/.env.eval \
 *     src/scripts/ingest-apologetics-corpus.ts ./path/to/corpus
 *
 * The corpus dir is argv[2] or $KB_CORPUS_DIR. File formats:
 *   - .md   : front-matter (--- fenced) with title/category/subcategory/tags/
 *             difficulty/scriptures/id; the markdown body becomes `content`.
 *   - .json : one entry object, or an array of them (same fields).
 * Missing fields default sensibly; `id` falls back to a slug of the title;
 * `scriptures` left empty are auto-extracted per chunk during ingest.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { importApologeticsEntries } from '../apps/web/lib/apologetics-kb-ingest';
import type { ApologeticsContent } from '../apps/web/lib/apologetics-knowledge';

const CORPUS_DIR = process.argv[2] || process.env.KB_CORPUS_DIR || '';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'entry';

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];

/** Minimal front-matter parser: `key: value` and `key: [a, b]` between --- fences. */
function parseFrontMatter(raw: string): { data: Record<string, any>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, any> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (!key) continue;
    let val: any = line.slice(idx + 1).trim();
    if (/^\[.*\]$/.test(val)) {
      val = val.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    data[key] = val;
  }
  return { data, body: m[2].trim() };
}

function toEntry(data: Record<string, any>, body: string, fallbackId: string): ApologeticsContent | null {
  const title = (data.title || '').toString().trim();
  const content = (body || data.content || '').toString().trim();
  if (!title || !content) return null; // skip empties
  const difficulty = ['basic', 'intermediate', 'advanced'].includes(data.difficulty)
    ? data.difficulty
    : 'intermediate';
  return {
    id: (data.id ? String(data.id) : slugify(title)) || fallbackId,
    title,
    content,
    category: (data.category || 'theological').toString(),
    subcategory: (data.subcategory || '').toString(),
    tags: asList(data.tags),
    difficulty: difficulty as ApologeticsContent['difficulty'],
    scriptures: asList(data.scriptures),
    sources: asList(data.sources),
  };
}

/** Recursively collect .md/.json files under a directory. */
async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(md|markdown|json)$/i.test(ent.name)) out.push(full);
  }
  return out;
}

async function loadFile(file: string): Promise<ApologeticsContent[]> {
  const raw = await fs.readFile(file, 'utf8');
  const base = path.basename(file).replace(/\.[^.]+$/, '');
  if (/\.json$/i.test(file)) {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items
      .map((it: any, i: number) => toEntry(it, String(it.content ?? ''), `${slugify(base)}-${i}`))
      .filter((e): e is ApologeticsContent => e !== null);
  }
  const { data, body } = parseFrontMatter(raw);
  const entry = toEntry(data, body, slugify(base));
  return entry ? [entry] : [];
}

async function main() {
  if (!CORPUS_DIR) {
    console.error('Usage: tsx src/scripts/ingest-apologetics-corpus.ts <corpus-dir>  (or set KB_CORPUS_DIR)');
    process.exit(1);
  }
  if (!process.env.PINECONE_API_KEY) {
    console.error('PINECONE_API_KEY is not set. Pull it: vercel env pull src/scripts/eval/.env.eval');
    process.exit(1);
  }

  const files = await walk(CORPUS_DIR);
  console.log(`Found ${files.length} corpus file(s) under ${CORPUS_DIR}.`);

  const entries: ApologeticsContent[] = [];
  const seen = new Set<string>();
  for (const f of files) {
    try {
      for (const e of await loadFile(f)) {
        // De-dup ids so overlapping filenames/titles don't clobber each other.
        let id = e.id;
        for (let n = 2; seen.has(id); n++) id = `${e.id}-${n}`;
        seen.add(id);
        entries.push({ ...e, id });
      }
    } catch (err) {
      console.warn(`  skip ${f}: ${(err as Error).message}`);
    }
  }

  if (!entries.length) {
    console.error('No valid entries found (each needs a title + content).');
    process.exit(1);
  }

  console.log(`Parsed ${entries.length} ent(y|ies). Ingesting (chunked)…`);
  const res = await importApologeticsEntries(entries);
  console.log(`✓ Upserted ${res.upserted} record(s) from ${res.entries} entr(y|ies).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
