import { extractScriptureReferences } from '../reference-utils';
import type { CitationVerification } from '../citation-verifier';
import { logger } from '../logger';
import { canonicalize } from './reference';
import { kjvPineconeProvider } from './providers/kjv-pinecone';
import { withTimeout } from './engine';

const MAX_REFS = 12;
const VERIFY_TIMEOUT_MS = 4000;

/**
 * Check that every reference an answer cites actually exists, against our own
 * KJV index rather than API.Bible (whose outages would otherwise flag every
 * citation as fabricated). Only existence is checked; a lookup that errors
 * counts as verified so an outage can't force a rewrite. Same result shape as
 * `verifyCitations`, so `formatCorrectionInstruction` works on it.
 */
export async function verifyReferencesExist(answer: string, cid?: string): Promise<CitationVerification> {
  const references = extractScriptureReferences(answer).slice(0, MAX_REFS);
  if (!references.length) {
    return { ok: true, checked: 0, hallucinated: [], misquoted: [], references: [], skipped: true };
  }

  const checks = await Promise.all(
    references.map(async reference => {
      const ref = canonicalize(reference);
      if (!ref) return { reference, status: 'unresolved' as const };
      try {
        const passage = await withTimeout(kjvPineconeProvider.getPassage(ref, 'KJV'), VERIFY_TIMEOUT_MS, 'verify');
        // A range counts as real when any of its verses exists.
        return { reference, status: passage?.verses.length ? ('verified' as const) : ('unresolved' as const) };
      } catch (err) {
        logger.warn('Reference check failed; treating as verified', { cid, reference, error: String(err) });
        return { reference, status: 'verified' as const };
      }
    })
  );

  const hallucinated = checks.filter(c => c.status === 'unresolved').map(c => c.reference);
  return { ok: hallucinated.length === 0, checked: checks.length, hallucinated, misquoted: [], references: checks, skipped: false };
}
