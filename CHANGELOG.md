# Changelog

One line per merged PR, newest first. The builder agent adds its own.

## Unreleased

- feat(agent): build bigger features overnight: the planner files every step of an item as a visible slice (up to ~700 lines each), the builder runs three times a night and takes one step per item in order, a step blocked on an unmerged earlier step is retried automatically, three items build at once, `Launch: owner` keeps a flip for the owner, and ROADMAP.md lists eight ranked features.
- fix(agent): the planner no longer holds lint fixes that quote a hook's "missing dependency"; package dependency work is still held.
- feat(web): add the `not-found-page` flag (off) and `lib/not-found.ts` with the 404 page's heading, message and Home/Bible/Chat links; no visible change (#79).
- fix(web): import lucide's `Image` icon as `ImageIcon` in the Bible insight components, clearing five false `jsx-a11y/alt-text` lint warnings (#74).
- ci: autonomous agent pipeline (planner, builder, guarded auto-merge, rollback watch), feature flags and a Playwright preview suite; typecheck and lint pass on main again.
