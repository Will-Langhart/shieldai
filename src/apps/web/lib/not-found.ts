/**
 * Static content for the branded 404 page (roadmap item `not-found-page`).
 * The page itself ships in a later PR behind the `not-found-page` flag.
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
