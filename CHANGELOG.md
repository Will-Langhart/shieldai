# Changelog

One line per merged PR, newest first. The builder agent adds its own.

## Unreleased

- feat(web): add the `not-found-page` flag (off) and `lib/not-found.ts` with the 404 page's heading, message and Home/Bible/Chat links; no visible change (#79).
- fix(web): import lucide's `Image` icon as `ImageIcon` in the Bible insight components, clearing five false `jsx-a11y/alt-text` lint warnings (#74).
- ci: autonomous agent pipeline (planner, builder, guarded auto-merge, rollback watch), feature flags and a Playwright preview suite; typecheck and lint pass on main again.
