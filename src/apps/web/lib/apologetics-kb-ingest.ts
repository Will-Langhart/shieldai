/**
 * Apologetics KB → `apologetics-kb` index ingest.
 *
 * Projects the in-code `apologeticsKnowledgeBase` (the source of truth) into
 * text records and upserts them. Re-run after editing the KB. Small enough to
 * run in a single request. `_id` = the entry id, so re-ingest overwrites.
 */

import { apologeticsKnowledgeBase } from './apologetics-knowledge';
import { ApologeticsKbIndex, type ApologeticsKbRecord } from './apologetics-kb-index';

export async function importApologeticsKb(): Promise<{ upserted: number; ids: string[] }> {
  const records: ApologeticsKbRecord[] = apologeticsKnowledgeBase.map((e) => ({
    _id: e.id,
    // Embed title + content; category/scriptures ride along as metadata.
    text: `${e.title}\n\n${e.content}`,
    title: e.title,
    category: e.category,
    subcategory: e.subcategory,
    difficulty: e.difficulty,
    tags: e.tags,
    scriptures: e.scriptures,
  }));
  await ApologeticsKbIndex.upsertRecords(records);
  return { upserted: records.length, ids: records.map((r) => r._id) };
}
