// Pure helpers for the Bible reader (components/features/bible/Bible.tsx).

export interface ReaderBook {
  id: string;
  name: string;
}

// Keep the current book when the new version's book list has it (by name or
// id); otherwise fall back to the first book and report that it changed.
export function resolveBookSelection<B extends ReaderBook>(
  books: B[],
  selectedBook: string,
  selectedBookId: string,
): { book: B; changed: boolean } | null {
  if (books.length === 0) return null;
  const found = books.find(b => b.name === selectedBook || b.id === selectedBookId);
  if (found) return { book: found, changed: false };
  return { book: books[0], changed: true };
}

// Unwrap a /api/bible/ai-insights response. The server sometimes returns the
// raw model JSON as a string in `explanation` when its own parse fails, so
// re-parse it and merge it in. Invalid JSON keeps the payload as it is.
export function normalizeInsightPayload(data: any): any {
  const ins = (data && data.insights) || data;
  if (!ins || typeof ins !== 'object') return ins;
  const { explanation } = ins;
  if (typeof explanation === 'string' && explanation.trim().startsWith('{')) {
    try {
      return { ...ins, ...JSON.parse(explanation) };
    } catch {
      return ins;
    }
  }
  return ins;
}
