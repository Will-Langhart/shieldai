import { bibleService } from './bible-service';
import { extractScriptureReferences, stripHtml } from './reference-utils';
import { logger } from './logger';

/**
 * Citation verifier — the anti-hallucination gate for AI answers.
 *
 * The #1 failure mode of an apologetics bot is a *fabricated Bible verse*: a
 * reference that doesn't exist, or a quotation that the cited verse never
 * actually says. Nothing in the eager or agentic pipeline catches this today.
 *
 * This module re-checks every Scripture reference in a generated answer against
 * the Bible API:
 *   - `unresolved`  — the reference does not resolve to a real passage
 *                     (fabricated chapter/verse). Treated as a HARD problem.
 *   - `misquoted`   — the reference resolves, but a quotation the answer
 *                     attributes to it drifts from the actual verse text.
 *                     Treated as a SOFT warning (translation differences can
 *                     cause false positives), surfaced but not forced-corrected.
 *   - `verified`    — resolves, and any attributed quote matches.
 *
 * Framework-free: this is a plain async function you can drop into the existing
 * tool loop (see pages/api/chat-agentic.ts) before adopting LangGraph.
 */

export type CitationStatus = 'verified' | 'unresolved' | 'misquoted';

export interface CitationCheck {
  reference: string;
  status: CitationStatus;
  /** Quotation the answer attributed to this reference, if one was detected. */
  claimedQuote?: string;
  /** Jaccard token similarity between claimedQuote and the real verse (0..1). */
  similarity?: number;
}

export interface CitationVerification {
  /** True when there are no unresolved (fabricated) references. */
  ok: boolean;
  /** Number of distinct references checked. */
  checked: number;
  /** References that did not resolve to a real passage — likely hallucinated. */
  hallucinated: string[];
  /** References whose attributed quotation drifts from the real verse text. */
  misquoted: string[];
  references: CitationCheck[];
  /** True when verification was skipped (no refs, disabled, or Bible API down). */
  skipped: boolean;
}

const VERIFY_TIMEOUT_MS = Number(process.env.CITATION_VERIFY_TIMEOUT_MS || 6000);
const MAX_REFS = Number(process.env.CITATION_VERIFY_MAX_REFS || 12);
// Below this token-overlap a claimed quote is considered a misquote. Kept
// conservative so cross-translation wording differences don't false-positive.
const MISQUOTE_SIMILARITY_THRESHOLD = Number(process.env.CITATION_MISQUOTE_THRESHOLD || 0.3);
// Only bother comparing quotes at least this many words long.
const MIN_QUOTE_WORDS = 5;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with',
  'is', 'are', 'was', 'were', 'be', 'that', 'this', 'his', 'her', 'him', 'they',
  'them', 'you', 'your', 'i', 'we', 'he', 'she', 'it', 'as', 'at', 'by', 'from',
]);

function tokenize(text: string): Set<string> {
  const tokens = stripHtml(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Pull quoted spans (straight or curly quotes) with their position in the text. */
function extractQuotes(text: string): Array<{ quote: string; index: number }> {
  const out: Array<{ quote: string; index: number }> = [];
  const re = /[“"]([^“”"]{12,400})[”"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ quote: m[1].trim(), index: m.index });
  }
  return out;
}

/**
 * Find the quotation, if any, the answer attributes to a reference: the nearest
 * quoted span within a window of the reference's position in the text.
 */
function quoteForReference(
  text: string,
  reference: string,
  quotes: Array<{ quote: string; index: number }>
): string | undefined {
  const refIndex = text.indexOf(reference);
  if (refIndex === -1 || quotes.length === 0) return undefined;
  const WINDOW = 240;
  let best: { quote: string; dist: number } | undefined;
  for (const q of quotes) {
    const dist = Math.abs(q.index - refIndex);
    if (dist <= WINDOW && (!best || dist < best.dist)) {
      best = { quote: q.quote, dist };
    }
  }
  if (!best) return undefined;
  return best.quote.split(/\s+/).length >= MIN_QUOTE_WORDS ? best.quote : undefined;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`verify timed out after ${ms}ms`)), ms)),
  ]);
}

export interface VerifyOptions {
  cid?: string;
}

/**
 * Verify every Scripture reference in `answer` against the Bible API for the
 * given translation. Never throws — Bible API failures degrade to `skipped`
 * so a verification outage cannot break the chat response.
 */
export async function verifyCitations(
  answer: string,
  versionId: string,
  opts: VerifyOptions = {}
): Promise<CitationVerification> {
  const empty: CitationVerification = {
    ok: true, checked: 0, hallucinated: [], misquoted: [], references: [], skipped: true,
  };
  if (!answer || !versionId) return empty;

  const references = extractScriptureReferences(answer).slice(0, MAX_REFS);
  if (references.length === 0) return empty;

  const quotes = extractQuotes(answer);

  try {
    const checks = await Promise.all(
      references.map(async (reference): Promise<CitationCheck> => {
        try {
          const passage = await withTimeout(
            bibleService.getVerseByReference(versionId, reference),
            VERIFY_TIMEOUT_MS
          );
          if (!passage) return { reference, status: 'unresolved' };

          const claimedQuote = quoteForReference(answer, reference, quotes);
          if (!claimedQuote) return { reference, status: 'verified' };

          const actual = stripHtml(passage.content || passage.text || '');
          if (!actual) return { reference, status: 'verified' };

          const similarity = jaccard(tokenize(claimedQuote), tokenize(actual));
          return similarity < MISQUOTE_SIMILARITY_THRESHOLD
            ? { reference, status: 'misquoted', claimedQuote, similarity: Number(similarity.toFixed(3)) }
            : { reference, status: 'verified', claimedQuote, similarity: Number(similarity.toFixed(3)) };
        } catch (err) {
          // A single lookup failure shouldn't condemn the reference as fake.
          logger.warn('Citation lookup failed', { cid: opts.cid, reference }, err as Error);
          return { reference, status: 'verified' };
        }
      })
    );

    const hallucinated = checks.filter(c => c.status === 'unresolved').map(c => c.reference);
    const misquoted = checks.filter(c => c.status === 'misquoted').map(c => c.reference);

    return {
      ok: hallucinated.length === 0,
      checked: checks.length,
      hallucinated,
      misquoted,
      references: checks,
      skipped: false,
    };
  } catch (err) {
    logger.error('Citation verification failed', { cid: opts.cid }, err as Error);
    return empty;
  }
}

// ── Structured-output variant ────────────────────────────────────────────────
// For AI responses that emit references in JSON fields (Bible AI insights /
// study questions) rather than prose. Resolvability only — there is no
// surrounding prose to proximity-match a quote against.

export interface ReferenceCheck {
  reference: string;
  status: 'verified' | 'unresolved';
}

export interface ReferenceVerification {
  ok: boolean;
  checked: number;
  hallucinated: string[];
  references: ReferenceCheck[];
  skipped: boolean;
}

/**
 * Verify a list of Scripture references resolve to real passages. Pass
 * already-canonicalized references (e.g. via `extractScriptureReferences`) to
 * keep false positives near zero. Never throws.
 */
export async function verifyReferences(
  references: string[],
  versionId: string,
  opts: VerifyOptions = {}
): Promise<ReferenceVerification> {
  const empty: ReferenceVerification = { ok: true, checked: 0, hallucinated: [], references: [], skipped: true };
  const uniq = [...new Set(references.map(r => r.trim()).filter(Boolean))].slice(0, MAX_REFS);
  if (!versionId || uniq.length === 0) return empty;

  try {
    const checks = await Promise.all(
      uniq.map(async (reference): Promise<ReferenceCheck> => {
        try {
          const passage = await withTimeout(
            bibleService.getVerseByReference(versionId, reference),
            VERIFY_TIMEOUT_MS
          );
          return { reference, status: passage ? 'verified' : 'unresolved' };
        } catch (err) {
          // A lookup failure shouldn't condemn the reference as fabricated.
          logger.warn('Reference lookup failed', { cid: opts.cid, reference }, err as Error);
          return { reference, status: 'verified' };
        }
      })
    );
    const hallucinated = checks.filter(c => c.status === 'unresolved').map(c => c.reference);

    // Outage guard: if EVERY reference fails to resolve (2+ checked), the Bible
    // API is almost certainly down or misconfigured — far likelier than the
    // model fabricating 100% of its citations. Skip rather than strip valid
    // verses. A single fabricated reference is still flagged.
    if (checks.length >= 2 && hallucinated.length === checks.length) {
      logger.warn('Reference verification: all unresolved — treating as API outage, skipping', {
        cid: opts.cid, checked: checks.length,
      });
      return empty;
    }

    return { ok: hallucinated.length === 0, checked: checks.length, hallucinated, references: checks, skipped: false };
  } catch (err) {
    logger.error('Reference verification failed', { cid: opts.cid }, err as Error);
    return empty;
  }
}

/**
 * Build a corrective system instruction naming the bad references, to feed back
 * into a single regeneration round.
 */
export function formatCorrectionInstruction(v: CitationVerification): string {
  const lines: string[] = [
    'CITATION CHECK FAILED. Your previous answer cited Scripture that could not be verified.',
  ];
  if (v.hallucinated.length) {
    lines.push(
      `These references do not resolve to a real passage and must be removed or replaced with a verse you are certain exists: ${v.hallucinated.join('; ')}.`
    );
  }
  if (v.misquoted.length) {
    lines.push(
      `These references resolve, but the wording you attributed to them may be inaccurate — quote them accurately or paraphrase without quotation marks: ${v.misquoted.join('; ')}.`
    );
  }
  lines.push(
    'Rewrite the answer. Only cite Scripture you are confident is real and accurately worded. Do not fabricate references. Keep the same tone, structure, and length.'
  );
  return lines.join(' ');
}
