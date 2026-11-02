# Roadmap

> This file is the owner's. The nightly planner only reads it, except that a
> flag-flip PR ticks an item's box when its feature goes live and the weekly
> refill proposes new items in a PR. Rewrite, reorder or delete items freely.

## How the planner reads this

- Each item is one line: `- [ ] \`flag-key\` Title`, with optional notes
  indented two spaces underneath. The key is lowercase with dashes and becomes
  the feature flag's name, so don't rename an item once work on it has started.
- Every night the planner takes the first unticked item that isn't already
  shipping or building, splits it into small issues and queues them for the
  builder. Up to two items build at a time; order is priority.
- The feature ships behind its flag, off for visitors. Once all its PRs merged
  and passed the Preview e2e check, the planner queues a PR that turns the flag
  on and ticks the box here.
- Items about payments, sign-in, admin or the database still get built, but
  their PRs and their flag flip wait for the owner's merge.
- Notes help a lot: say what "done" looks like and anything to avoid.

## Up next

- [ ] `help-center` Help Center page at /help
  Goal: the footer's "Help Center" link 404s on production today; give
  visitors a page that answers the common questions and points to the chat.
  What to build: `src/apps/web/pages/help.tsx` using the existing `Seo`,
  `Header` and `components/layout/Footer`, with sections on asking a question
  in chat, the three chat modes (gentle, scholarly, debate), reading the Bible,
  and saving notes. Reuse `FAQ_ITEMS` from `components/features/landing/faqData`
  where it fits. With the flag off, /help stays a 404 (return `notFound`).
  Done when: a preview spec loads /help, sees an h1 "Help Center", and follows
  the footer link from / to it; unit tests cover any helper that builds the
  sections.
  Avoid: new dependencies, sign-in, subscription or pricing copy.

- [ ] `not-found-page` Branded 404 page
  Goal: a mistyped or stale link currently shows Next.js's bare 404; keep
  visitors in the product instead.
  What to build: `src/apps/web/pages/404.tsx` in the site's warm theme with
  `Header`, a short message and links to /, /bible and /chat. With the flag
  off, render the plain message Next.js shows today.
  Done when: a preview spec visits a made-up path, gets status 404, sees the
  branded heading, and the "Bible" link reaches /bible.
  Avoid: redirects; changing middleware or vercel.json.

- [ ] `contact-page` Contact page at /contact
  Goal: the footer's "Contact Us" link 404s on production today.
  What to build: `src/apps/web/pages/contact.tsx` with `Seo`, `Header` and
  `Footer`, explaining how to reach the team and linking to /help and /chat.
  Contact details come from a single constant the owner can edit. With the
  flag off, /contact stays a 404.
  Done when: a preview spec loads /contact, sees an h1 "Contact", and the /help
  link works; a unit test covers the constant's shape.
  Avoid: forms that write to the database or send email; no new API routes.

## Done

## Needs owner

Work the agents can't do: accounts, keys, paid services, content only the
owner can write, decisions.

- Privacy Policy and Terms at /privacy and /terms (the footer links to
  /privacy, which 404s): the legal text is the owner's to write.
- /insights-history returns a 500 on production (signed out); find the cause.
- Sign in with Apple (owed for the App Store), RevenueCat subscriptions.
