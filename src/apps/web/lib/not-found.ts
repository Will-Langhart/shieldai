/**
 * Static content for the branded 404 page (roadmap item `not-found-page`).
 * Rendered by pages/404.tsx behind the `not-found-page` flag.
 */

export type NotFoundLink = {
  href: string;
  label: string;
  description: string;
};

export const NOT_FOUND_HEADING = "Page not found";

export const NOT_FOUND_MESSAGE =
  "We couldn't find the page you were looking for. The link may be mistyped or out of date.";

export const NOT_FOUND_LINKS: readonly NotFoundLink[] = [
  { href: "/", label: "Home", description: "Start over from the Shield AI home page." },
  { href: "/bible", label: "Bible", description: "Read and study Scripture." },
  { href: "/chat", label: "Chat", description: "Ask a question about the Christian faith." },
];

/** The text Next.js's default 404 shows; used when the flag is off. */
export const PLAIN_NOT_FOUND_TEXT = "404 | This page could not be found.";

export type NotFoundView = "branded" | "plain";

/** Which 404 the page renders: branded with the flag on, Next's plain one otherwise. */
export function notFoundView(flagOn: boolean): NotFoundView {
  return flagOn ? "branded" : "plain";
}

/** Splits PLAIN_NOT_FOUND_TEXT into its "404" heading and message. */
export function plainNotFoundParts(text: string = PLAIN_NOT_FOUND_TEXT): {
  code: string;
  message: string;
} {
  const [code, ...rest] = text.split("|");
  return { code: code.trim(), message: rest.join("|").trim() };
}
