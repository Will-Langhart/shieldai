import { describe, it, expect } from 'vitest'
import { shouldApplyChapters } from '../BibleReader'

describe('shouldApplyChapters', () => {
  it('applies a response for the still-selected book while active', () => {
    expect(shouldApplyChapters({ requestedBook: 'John', currentBook: 'John', active: true })).toBe(true)
  })

  it('ignores a response after the effect was cleaned up (unmount or re-run)', () => {
    expect(shouldApplyChapters({ requestedBook: 'John', currentBook: 'John', active: false })).toBe(false)
  })

  it('ignores an out-of-order response for a book that is no longer selected', () => {
    expect(shouldApplyChapters({ requestedBook: 'Genesis', currentBook: 'John', active: true })).toBe(false)
  })

  it('ignores a response when no book is requested', () => {
    expect(shouldApplyChapters({ requestedBook: '', currentBook: '', active: true })).toBe(false)
  })
})
