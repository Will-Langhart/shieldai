import { describe, expect, it } from 'vitest';
import { notesToSlots } from '../margin-notes';

describe('notesToSlots', () => {
  it('maps "Genesis 1:3" to key 3 with the note text and saved flags', () => {
    expect(notesToSlots([{ id: 'n1', reference: 'Genesis 1:3', note: 'Let there be light' }])).toEqual({
      3: { id: 'n1', note: 'Let there be light', saving: false, saved: true, dirty: false },
    });
  });

  it('parses multi-word books and multi-digit verses', () => {
    const slots = notesToSlots([
      { id: 'a', reference: '1 John 4:19', note: 'We love' },
      { id: 'b', reference: 'Psalm 119:105', note: 'A lamp' },
    ]);
    expect(Object.keys(slots).map(Number).sort((x, y) => x - y)).toEqual([19, 105]);
    expect(slots[19].id).toBe('a');
    expect(slots[19].note).toBe('We love');
    expect(slots[105].id).toBe('b');
    expect(slots[105].note).toBe('A lamp');
  });

  it('skips a reference with no verse', () => {
    expect(notesToSlots([{ id: 'x', reference: 'Genesis 1', note: 'chapter note' }])).toEqual({});
  });

  it('defaults a missing note to an empty string', () => {
    expect(notesToSlots([{ id: 'n2', reference: 'John 3:16' }])[16].note).toBe('');
    expect(notesToSlots([{ id: 'n3', reference: 'John 3:17', note: null }])[17].note).toBe('');
  });

  it('returns {} for an empty or missing array', () => {
    expect(notesToSlots([])).toEqual({});
    expect(notesToSlots(undefined)).toEqual({});
    expect(notesToSlots(null)).toEqual({});
  });
});
