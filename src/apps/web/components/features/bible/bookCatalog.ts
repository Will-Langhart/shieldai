// Canonical grouping of USFM book ids (the ids api.bible returns) so the
// library sidebar can present the canon the way a printed Bible does.

export type Testament = 'OT' | 'NT' | 'DC'

export interface BookGroup {
  label: string
  testament: Testament
  ids: string[]
}

export const BOOK_GROUPS: BookGroup[] = [
  { label: 'Law', testament: 'OT', ids: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'] },
  { label: 'History', testament: 'OT', ids: ['JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST'] },
  { label: 'Poetry & Wisdom', testament: 'OT', ids: ['JOB', 'PSA', 'PRO', 'ECC', 'SNG'] },
  { label: 'Major Prophets', testament: 'OT', ids: ['ISA', 'JER', 'LAM', 'EZK', 'DAN'] },
  { label: 'Minor Prophets', testament: 'OT', ids: ['HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'] },
  { label: 'Gospels', testament: 'NT', ids: ['MAT', 'MRK', 'LUK', 'JHN'] },
  { label: 'Acts', testament: 'NT', ids: ['ACT'] },
  { label: 'Pauline Epistles', testament: 'NT', ids: ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM'] },
  { label: 'General Epistles', testament: 'NT', ids: ['HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD'] },
  { label: 'Prophecy', testament: 'NT', ids: ['REV'] },
]

const GROUP_BY_ID: Record<string, BookGroup> = {}
for (const g of BOOK_GROUPS) for (const id of g.ids) GROUP_BY_ID[id] = g

export function getBookMeta(bookId: string): { testament: Testament; group: string } {
  const g = GROUP_BY_ID[bookId]
  return g ? { testament: g.testament, group: g.label } : { testament: 'DC', group: 'Deuterocanon' }
}

export const TESTAMENT_LABEL: Record<Testament, string> = {
  OT: 'Old Testament',
  NT: 'New Testament',
  DC: 'Deuterocanon',
}
