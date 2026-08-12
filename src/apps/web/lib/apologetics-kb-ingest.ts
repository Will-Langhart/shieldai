/**
 * Apologetics KB → `apologetics-kb` index ingest.
 *
 * Two entry points:
 *   - importApologeticsKb()      — projects the in-code `apologeticsKnowledgeBase`
 *                                  (the original 6-entry source of truth).
 *   - importApologeticsEntries() — ingests ANY entries (e.g. a real corpus loaded
 *                                  from disk by scripts/ingest-apologetics-corpus.ts).
 *
 * Long entries are CHUNKED so each record is a focused retrieval unit. `_id` is
 * derived from the entry id (+ chunk index), so re-ingest overwrites in place.
 */

import { apologeticsKnowledgeBase, type ApologeticsContent } from './apologetics-knowledge';
import { ApologeticsKbIndex, type ApologeticsKbRecord } from './apologetics-kb-index';
import { extractScriptureReferences } from './reference-utils';

const CHUNK_CHARS = Number(process.env.KB_CHUNK_CHARS || 1200);

/**
 * Split text into ~CHUNK_CHARS chunks on paragraph boundaries, hard-splitting any
 * single paragraph that exceeds the budget. Returns at least one chunk.
 */
export function chunkContent(text: string, size = CHUNK_CHARS): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const p of paras) {
    if (cur && cur.length + p.length + 2 > size) {
      chunks.push(cur);
      cur = '';
    }
    cur = cur ? `${cur}\n\n${p}` : p;
    while (cur.length > size) {
      chunks.push(cur.slice(0, size));
      cur = cur.slice(size);
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [text.trim()].filter(Boolean);
}

/**
 * Project one KB entry into one-or-more index records. When an entry chunks into
 * multiple records, each carries a `(part N)` title suffix so the graph's
 * title-based evidence de-dup keeps every chunk rather than collapsing them.
 */
export function entryToRecords(e: ApologeticsContent): ApologeticsKbRecord[] {
  const body = `${e.title}\n\n${e.content}`;
  const chunks = chunkContent(body);
  return chunks.map((chunk, i) => ({
    _id: chunks.length > 1 ? `${e.id}__${i}` : e.id,
    // Keep the title on every chunk so a mid-entry chunk still has topical context.
    text: i === 0 ? chunk : `${e.title}\n\n${chunk}`,
    title: chunks.length > 1 ? `${e.title} (part ${i + 1})` : e.title,
    category: e.category,
    subcategory: e.subcategory,
    difficulty: e.difficulty,
    tags: e.tags ?? [],
    // Prefer declared scriptures; otherwise pull references found in this chunk.
    scriptures: e.scriptures?.length ? e.scriptures : extractScriptureReferences(chunk),
  }));
}

/** Ingest an arbitrary set of entries (chunked). Returns record counts. */
export async function importApologeticsEntries(
  entries: ApologeticsContent[]
): Promise<{ entries: number; upserted: number; ids: string[] }> {
  const records = entries.flatMap(entryToRecords);
  await ApologeticsKbIndex.upsertRecords(records);
  return { entries: entries.length, upserted: records.length, ids: records.map((r) => r._id) };
}

/** Ingest the in-code KB (the original source of truth). */
export async function importApologeticsKb(): Promise<{ upserted: number; ids: string[] }> {
  const { upserted, ids } = await importApologeticsEntries(apologeticsKnowledgeBase);
  return { upserted, ids };
}
