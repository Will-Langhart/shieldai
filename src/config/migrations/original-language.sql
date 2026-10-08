-- Original-language (Greek/Hebrew) data for Shield AI's `get_original_language` agent tool.
-- Source: STEPBible Data (TAGNT, TAHOT, TBESG, TBESH) — CC BY 4.0,
-- STEPBible.org / Tyndale House Cambridge, https://github.com/STEPBible/STEPBible-Data
--
-- Run in the Supabase SQL editor, then load data with:
--   npx tsx --env-file=<env with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY> src/scripts/ingest-stepbible.ts

-- One row per verse; `words` is a JSON array of
-- { w: surface form, x: transliteration, g: English gloss, s: Strong's, m: morphology }.
create table if not exists original_language_verses (
  book text not null,          -- USFM code, e.g. 'JHN', 'GEN'
  chapter integer not null,
  verse integer not null,
  testament text not null check (testament in ('OT', 'NT')),
  words jsonb not null,
  primary key (book, chapter, verse)
);

create table if not exists original_language_lexicon (
  strongs text primary key,    -- disambiguated Strong's, e.g. 'G3056', 'H1254A'
  lemma text not null,
  translit text,
  pos text,
  gloss text,
  definition text
);

-- Public-domain-style reference data (CC BY): readable by anyone, writable only
-- by the service role (which bypasses RLS) via the ingest script.
alter table original_language_verses enable row level security;
alter table original_language_lexicon enable row level security;

drop policy if exists "original_language_verses read" on original_language_verses;
create policy "original_language_verses read" on original_language_verses for select using (true);

drop policy if exists "original_language_lexicon read" on original_language_lexicon;
create policy "original_language_lexicon read" on original_language_lexicon for select using (true);
