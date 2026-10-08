/**
 * Load the STEPBible original-language datasets into Supabase for the
 * `get_original_language` agent tool.
 *
 * Data: STEPBible.org (Tyndale House Cambridge), CC BY 4.0 —
 * https://github.com/STEPBible/STEPBible-Data. Downloads TAGNT (Greek NT),
 * TAHOT (Hebrew OT) and the TBESG/TBESH brief lexicons straight from GitHub,
 * parses them (lib/stepbible-parse.ts) and upserts into the tables created by
 * src/config/migrations/original-language.sql. Idempotent — safe to re-run.
 *
 * Run (needs SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY;
 * Vercel blanks sensitive vars on pull, so check the key made it into the file):
 *   vercel env pull .env.stepbible --environment=production   # from the repo root
 *   npx tsx --env-file=.env.stepbible src/scripts/ingest-stepbible.ts
 *   rm .env.stepbible
 *
 * Pass --dry-run to download and parse without writing.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  parseBriefLexicon,
  parseTranslatorsAmalgamated,
  type LexiconEntry,
  type OriginalVerse,
} from '../apps/web/lib/stepbible-parse';

const RAW = 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master';
const TEXT_FILES = [
  'Translators Amalgamated OT+NT/TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt',
  'Translators Amalgamated OT+NT/TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt',
  'Translators Amalgamated OT+NT/TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt',
  'Translators Amalgamated OT+NT/TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt',
  'Translators Amalgamated OT+NT/TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt',
  'Translators Amalgamated OT+NT/TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt',
];
const LEXICON_FILES = [
  'Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt',
  'Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt',
];
const BATCH = 500;
const DRY_RUN = process.argv.includes('--dry-run');

async function download(path: string): Promise<string> {
  const url = `${RAW}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

async function upsertAll<T>(supabase: SupabaseClient<any>, table: string, rows: T[], onConflict: string) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + BATCH) as any, { onConflict });
    if (error) throw new Error(`${table} batch ${i / BATCH}: ${error.message}`);
    process.stdout.write(`\r${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  process.stdout.write('\n');
}

async function main() {
  const verses: OriginalVerse[] = [];
  for (const f of TEXT_FILES) {
    const parsed = parseTranslatorsAmalgamated(await download(f));
    console.log(`${f.split('/')[1].split(' - ')[0]}: ${parsed.length} verses`);
    verses.push(...parsed);
  }

  const lexicon: LexiconEntry[] = [];
  for (const f of LEXICON_FILES) {
    const parsed = parseBriefLexicon(await download(f));
    console.log(`${f.split('/')[1].split(' - ')[0]}: ${parsed.length} entries`);
    lexicon.push(...parsed);
  }

  const books = new Set(verses.map(v => v.book));
  console.log(`Parsed ${verses.length} verses across ${books.size} books, ${lexicon.length} lexicon entries.`);
  if (books.size !== 66) throw new Error(`Expected 66 books, got ${books.size} — source format may have changed.`);
  if (DRY_RUN) return;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  await upsertAll(supabase, 'original_language_lexicon', lexicon, 'strongs');
  await upsertAll(supabase, 'original_language_verses', verses, 'book,chapter,verse');
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
