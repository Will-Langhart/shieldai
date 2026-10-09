import type { NextApiResponse } from 'next';

// Chat endpoints stream plain text after a 200 has been sent, so a failed model
// call can't become an HTTP error. Write a visible notice into the stream instead
// of ending it silently, which left users staring at an empty bubble.
export function writeStreamErrorNotice(res: NextApiResponse, partialText: string): void {
  const notice = partialText
    ? '\n\n(The response was interrupted. Please try again.)'
    : 'Shield AI is temporarily unavailable. Please try again in a few minutes.';
  try {
    if (!res.writableEnded) res.write(notice);
  } catch (_) {}
}
