# Roadmap

> This file is the owner's. The nightly planner only reads it, except that a
> flag-flip PR ticks an item's box when its feature goes live and the weekly
> refill proposes new items in a PR. Rewrite, reorder or delete items freely.

## How the planner reads this

- Each item is one line: `- [ ] \`flag-key\` Title`, with optional notes
  indented two spaces underneath. The key is lowercase with dashes and becomes
  the feature flag's name, so don't rename an item once work on it has started.
- Every night the planner takes the first unticked item that isn't already
  shipping or building, splits it into 2 to 5 steps (each one PR, a slice a
  visitor can see on the preview) and queues them all. The builder takes one
  step per item per run, in order, each after the one before merged; it runs
  three times a night and once in the afternoon, so a big item takes a few
  nights. Up to three items build at a time; order is priority.
- The feature ships behind its flag, off for visitors. Once all its PRs merged
  and passed the Preview e2e check, the planner queues a PR that turns the flag
  on and ticks the box here.
- Items about payments, sign-in, admin or the database still get built, but
  their PRs and their flag flip wait for the owner's merge.
- Notes help a lot: say what "done" looks like and anything to avoid.
- A `Launch: owner` line keeps the item's flag off until you merge its flip PR,
  for anything you want to read on the preview before it goes public.
- Preview specs run signed out, so give every item something a signed-out
  visitor can see, and test signed-in parts with unit tests.

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

- [ ] `answers-library` Public Answers library at /answers
  Goal: bring in people searching for answers to hard questions about the
  faith, the site's biggest traffic opportunity, and hand each one to the chat
  with their question already typed. Several nights of building.
  What to build: a typed content module in `src/apps/web/lib/answers/` with one
  entry per topic (slug, category, question, a one-paragraph short answer, 3 to
  5 key points, key Scripture references, common follow-up questions, related
  slugs). Seed it from `apologeticsKnowledgeBase` in
  `lib/apologetics-knowledge.ts` (problem of evil, moral argument, science and
  faith, resurrection) and grow it to at least 24 topics across God's
  existence, Jesus, the resurrection, the Bible's reliability, suffering,
  science, other religions, morality, salvation and Christian living.
  `/answers` lists them by category with a filter box; `/answers/[slug]`
  (static paths from the module) shows one answer with `Seo` (type article,
  FAQPage JSON-LD), related topics, and an "Ask Shield AI about this" link to
  `/chat?q=<question>` (the chat already pre-fills from `?q=`).
  Steps: (1) the module with the first 8 topics and the /answers index; (2) the
  topic page; (3) 8 more topics; (4) 8 more, plus links from the footer and
  the home page.
  Done when: preview specs load /answers, see an h1 "Answers" and at least 8
  topic links, open one, see its question as the h1 and an "Ask Shield AI"
  link whose href starts with /chat?q=; unit tests check every entry's fields,
  unique slugs, related slugs that exist, and references that `parseReference`
  in `lib/reference-utils.ts` accepts. With the flag off, both routes 404.
  Voice: warm, careful and historically orthodox, fair to other traditions;
  cite Scripture by reference only.
  Launch: owner (the owner reads the answers on the preview first).
  Avoid: new dependencies, calls to the chat or AI APIs, quoting copyrighted
  books at length, and editing sitemap.xml or robots.txt.

- [ ] `pricing-page` Plans page at /pricing with an upgrade path
  Goal: turn regular readers into paying members; nothing on the site shows the
  four plans or how to upgrade today.
  What to build: `src/apps/web/pages/pricing.tsx` comparing Explorer, Bible
  Student, Bible Scholar and Ministry (price, monthly or yearly toggle, daily
  limits, chat modes) from `GET /api/subscriptions/tiers`, with the plan table
  in `.claude/CLAUDE.md` as a fallback constant when that call fails.
  Signed-out visitors' buttons open the existing sign-up modal; signed-in
  members see their current plan and their buttons start the existing upgrade
  flow (`/api/subscriptions/create`). Link it from the footer, the home page
  and the chat's plan-limit message.
  Done when: a preview spec loads /pricing, sees an h1 "Plans" and all four plan
  names, and the yearly toggle changes a shown price; unit tests cover the
  tier-to-card mapping and the fallback. With the flag off, /pricing 404s.
  Avoid: changing Stripe code, webhooks or the subscriptions API; new prices.

- [ ] `verse-topics` "Bible verses about..." pages at /verses
  Goal: rank for the very common "Bible verses about anxiety, forgiveness,
  strength" searches and send readers on to the chat.
  What to build: a typed module in `src/apps/web/lib/verse-topics/` (slug,
  title, short intro, 8 to 12 references each with a one-line note, related
  topics) with at least 30 topics; `/verses` lists them by theme;
  `/verses/[slug]` is static with hourly revalidation and shows each passage's
  text from `lib/bible-service.ts` when it loads and the reference alone when
  it doesn't, an "Ask about this" link to `/chat?q=`, and `Seo` with ItemList
  JSON-LD. Link it from the footer, and from Answers topics on the same theme
  once answers-library has shipped.
  Done when: preview specs load /verses, see an h1 "Bible verses by topic", open
  a topic and see its title and at least 8 references; unit tests check the
  module (unique slugs, valid references, related slugs exist) and the
  reference-only fallback. With the flag off, both routes 404.
  Launch: owner (the owner reads the topic notes first).
  Avoid: new dependencies, hard-coding copyrighted translation text, and
  editing sitemap.xml.

- [ ] `guest-chat-trial` Let visitors ask three questions before signing up
  Goal: the biggest lift in sign-ups: every chat needs an account today, so
  most visitors never see an answer.
  What to build: signed-out visitors on /chat can ask up to 3 questions a day
  in gentle mode; answers stream as usual and nothing is saved; after the
  third, the sign-up prompt opens with their question kept. `/api/chat` takes
  guest requests only while this flag is on, limited per IP with the existing
  rate limiter and a lower token cap.
  Done when: a preview spec, signed out, opens /chat and sees the guest
  composer and a "3 free questions" note (it doesn't send, to keep AI cost off
  CI); unit tests cover the guest limit, the gentle-mode lock and that guest
  chats aren't saved.
  Avoid: new dependencies; storing guest messages.

- [ ] `verse-of-the-day` Shareable Verse of the Day at /verse-of-the-day
  Goal: a daily reason to come back and to share the site.
  What to build: a public page with today's verse from
  `bibleService.getDailyVerse` (rendered on the server, cached for an hour), a
  one-line reflection prompt, copy-link and share links (X, Facebook,
  WhatsApp, email, all plain URLs), an "Ask about this verse" link to
  `/chat?q=`, and an Open Graph card using the existing og-image. Add a Verse
  of the Day card to the home page that links to it.
  Done when: a preview spec loads /verse-of-the-day, sees an h1 "Verse of the
  Day" and either a verse with its reference or the friendly fallback, and the
  share links carry the page URL; unit tests cover the share-link builder and
  the fallback. With the flag off, the route 404s and the home page is
  unchanged.
  Avoid: new dependencies or tracking.

- [ ] `reading-plans` Public reading plans at /plans
  Goal: give new readers a guided start and a reason to return every day.
  What to build: a typed module of at least 6 curated plans (Gospel of John in
  21 days, Psalms in 30, Proverbs in 31, the Resurrection accounts in 7,
  Romans in 16, Apologetics foundations in 14), each day with its readings and
  a one-line focus; `/plans` lists them; `/plans/[slug]` shows the schedule
  with a "Start this plan" button that keeps progress in the browser
  (localStorage) and ticks days off, and "Ask about today's reading" links to
  `/chat?q=`. Saving progress to an account is a later, separate item.
  Done when: preview specs load /plans, open a plan, tick day 1 and see it
  still ticked after a reload; unit tests cover the module and the progress
  helper. With the flag off, both routes 404.
  Avoid: new dependencies, new API routes, and the existing `study_plans` table.

- [ ] `church-finder` Church finder on the web, and the API the iOS tab needs
  Goal: the iOS app's Church tab is a placeholder waiting on
  `/api/churches/search`, and the web has no church finder at all.
  What to build: `POST /api/churches/search` (coordinates, or a place name
  through the existing `/api/geocode`; a radius; an optional denomination from
  `DenominationSelector`) calling Google Places on the server with the existing
  Google Places API key, returning name, address, distance, website and a
  maps link; and a `/churches` page with a search box, results list and
  directions links.
  Done when: a preview spec loads /churches and sees an h1 "Find a church" and
  the search box; unit tests cover request validation and result mapping with
  the Places call mocked. With the flag off, the page and the route 404.
  Avoid: new dependencies, sending the key to the browser, and any change in
  `src/apps/mobile` (wiring the iOS tab is separate).

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
- Gated items wait for your merge on every PR and on the flip: pricing-page
  (check the plan prices before its flip), guest-chat-trial (set the daily
  guest limit and the OpenAI spend you'll accept) and church-finder (needs the
  Google Places key already in Vercel).
- answers-library and verse-topics say `Launch: owner`: read the copy on the
  preview, then merge their flip PRs.
- Agents can't edit public/sitemap.xml: add /answers, /verses, /plans and
  /verse-of-the-day to it once they launch.
