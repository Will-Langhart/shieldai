// Rotating labels shown while the multi-agent graph works before the first
// token (retrieval + specialists run first, ~a few seconds), so the wait reads
// as purposeful rather than slow.
export const THINKING_PHRASES: readonly string[] = [
  'Searching Scripture…',
  'Consulting the specialists…',
  'Weighing the arguments…',
  'Grounding the response…',
];

// Composer placeholders that cycle on the empty chat screen.
export const APOLOGETICS_PLACEHOLDERS: readonly string[] = [
  "How can we know God exists?",
  "What evidence supports the resurrection?",
  "How do you explain the problem of evil?",
  "Is the Bible historically reliable?",
  "What about other religions?",
  "How can God be three in one?",
  "Why does God allow suffering?",
  "What about evolution vs creation?",
  "How do we know Jesus was divine?",
  "What about the reliability of miracles?",
  "How can we trust the Bible?",
  "What about the problem of hell?",
  "How do you explain the Trinity?",
  "What about the age of the earth?",
  "How can we know truth exists?",
  "What about the problem of pain?",
  "How do we know God is good?",
  "What about biblical contradictions?",
  "How can we prove God's existence?",
  "What about the problem of evil?",
];

/** Next index in a rotating list; 0 for an empty list or an invalid index. */
export function nextRotationIndex(current: number, length: number): number {
  if (!(length > 0)) return 0;
  if (!Number.isInteger(current) || current < 0) return 0;
  return (current + 1) % length;
}
