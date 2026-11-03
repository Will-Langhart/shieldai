# Changelog

One line per merged PR, newest first. The builder agent adds its own.

## Unreleased

- fix(web): InsightDetailView builds its responses/interactions URLs with tested `insightResponsesUrl()` / `insightInteractionsUrl()` helpers that encode the insight id, and wraps the loaders in `useCallback` keyed on the insight id, fixing its exhaustive-deps warning (#120).
- refactor(web): move InsightsHistory's history query building into a tested pure `buildInsightsHistoryQuery()` helper (`lib/insights-history-query.ts`) and fix its mount effect's exhaustive-deps warning; still one history and one statistics request on mount, no behaviour change (#119).

- refactor(web): move the AI insights history filter/sort into a tested pure `filterAndSortInsights` helper (`lib/insights-filter.ts`) and fix EnhancedInsightsQuery's three exhaustive-deps warnings; no behaviour change (#113).
- fix(web): AI Bible Insights reloads saved insights when the Bible version changes (not only the passage), ignores stale responses, and builds the request URL with a tested `buildSavedInsightsUrl()` helper that also encodes the version (#114).
- fix(web): Quick Navigation's arrow keys and Enter now use the current list (search results, category, recent/favorites) instead of a stale one, the selection is reset when the list shrinks, and the list comes from a tested `getQuickNavItems()` helper (#112).
- fix(agent): the builder runs hourly overnight and right after the planner, so a delayed or dropped GitHub schedule no longer stalls the night; unit tests no longer assert a flag's default, so flag flips can merge without the owner.
- feat(web): add 8 more Answers topics (Trinity, Jesus' historicity, hallucination theory, the biblical canon, natural disasters, evolution and Genesis, other religions, doubt), filling the "Other religions" and "Christian living" categories, behind the `answers-library` flag (#95).
- feat(web): add `/answers/[slug]` topic pages (question, short answer, key points, Scriptures, follow-ups, related topics, "Ask Shield AI about this" link to chat) with FAQPage JSON-LD, behind the `answers-library` flag; they 404 while it is off (#94).

- feat(help-center): add the `help-center` flag (off) and a tested `getHelpSections()` helper with the Help Center content; nothing renders it yet (#72).
- feat(web): add the `answers-library` flag (off), the `lib/answers` content module with 8 hard-question topics, and a filterable `/answers` index that 404s while the flag is off (#93).
- fix(agent): the planner no longer holds a step for review just because it says "`shield-*` tokens" or "design tokens", reads `process.env.VITE_FEATURE_FLAGS`, lists "new dependencies" after "Avoid:" next to a file name, or says an effect lists its dependencies; money, auth, secrets, real tokens and package work are still held.
- feat(web): add a custom `/404` page that shows a branded "Page not found" with Home/Bible/Chat links behind the `not-found-page` flag, and Next's plain 404 text with the flag off (#80).
- feat(agent): safe database changes ship overnight: a new migration that only adds (new tables with RLS and policies, nullable columns, indexes, invoker functions) is dry-run in CI against production's schema, merges without the owner and is applied by `db-migrate.yml`; anything else in the database still waits for the owner. Off until `DB_AUTO_APPLY` is `true`.
- feat(agent): build bigger features overnight: the planner files every step of an item as a visible slice (up to ~700 lines each), the builder runs three times a night and takes one step per item in order, a step blocked on an unmerged earlier step is retried automatically, three items build at once, `Launch: owner` keeps a flip for the owner, and ROADMAP.md lists eight ranked features.
- fix(agent): the planner no longer holds lint fixes that quote a hook's "missing dependency"; package dependency work is still held.
- feat(web): add the `not-found-page` flag (off) and `lib/not-found.ts` with the 404 page's heading, message and Home/Bible/Chat links; no visible change (#79).
- fix(web): import lucide's `Image` icon as `ImageIcon` in the Bible insight components, clearing five false `jsx-a11y/alt-text` lint warnings (#74).
- ci: autonomous agent pipeline (planner, builder, guarded auto-merge, rollback watch), feature flags and a Playwright preview suite; typecheck and lint pass on main again.
