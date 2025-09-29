# Active TODO Snapshot

> Snapshot Date: 2025-09-29 (Post Completion Assessment Update)

## Legend

- P0 = Critical (unblocks or fixes broken/placeholder behavior)
- P1 = High Value (core feature parity with plan)
- P2 = Enhancement / polish

---

## P0 (Critical) — (None open)

All prior P0 items (#1, #2) are completed. Monitoring only.

---

## P1 (High Value)

- [ ] (#24) Accessibility: Reduced Motion Variant Pruning
- [ ] (#28) Contact: Basic Rate Limiting
- [ ] (#29) Auth: Clerk Integration & Protected Toolkit Hardening
- [ ] (#30) Testing: Vitest + RTL Baseline (Projects, Contact, JSON Tools)

---

## P2 (Enhancements & Polish)

- [ ] (#25) Theming: Interactive Theme Token Panel
- [ ] (#26) Performance: Motion Variant Tree-Shaking
- [ ] (#27) Content: Blog Route Group (MDX) Skeleton
- [ ] (#31) Projects: Server-side Pagination & Tag Filtering

## P3 (Longer Term)

- [ ] (#19) JSON Tools: Virtualized Rendering
- [ ] (#20) JSON Tools: Find & Replace
- [x] (#21) JSON Tools: Persist Undo/Redo History

---

## Stretch / Future (Un-ticketed)

- [ ] JSON Tools: Export selected subtree
- [ ] JSON Tools: Collapsed state serialization via URL params
- [ ] Email / Notification on New Message
- [ ] Tag filtering / search for Projects
- [ ] Vitest + RTL tests for Contact & Projects
- [ ] Lighthouse / Web Vitals ≥90 pass

---

## Notes / Open Questions

## Current Completion Assessment (2025-09-29)

Overall Estimated Completion: ~65%

Category Snapshot:
- Core Infrastructure: ~85% (needs reduced-motion pruning & variant tree-shake)
- Data Layer (Convex): ~70% (auth-linked queries & telemetry pending)
- Auth & Authorization: ~35% (Clerk provider + middleware gating outstanding) (#29)
- Homepage Sections: ~80% (SEO metadata & a11y polish pending)
- Projects Feature: ~75% (server pagination, tag filtering, audit telemetry) (#31)
- Toolkit Utilities: ~90% initial scope (virtualization & replace logic future) (#19/#20)
- Theming System: ~55% (interactive token panel, semantic tokens) (#25)
- Animation/Motion Strategy: ~60% (reduced-motion + registry pruning) (#24/#26)
- Performance & Accessibility: ~40% (Lighthouse ≥90 targets, focus & ARIA audit)
- Blog/MDX Content: ~10% (skeleton not started) (#27)
- Testing & Quality: ~15% (introduce Vitest + RTL baseline) (#30)
- Deployment & Ops: ~50% (prod auth, env audit, SEO metadata, observability)

New / Adjusted Priorities Just Added:
1. (#29) Clerk integration (P1) – unlocks secure toolkit & future personalization.
2. (#30) Test baseline (P1) – protect recent complexity (sync, JSON persistence).
3. (#31) Server-side pagination & tag filtering (P2) – scalability & UX.

Next 5 Recommended Actions (Execution Order):
1. Implement Clerk provider + middleware; add auth UI in `Navbar` (#29).
2. Add reduced-motion variant pruning + motion registry rationalization (#24/#26).
3. Introduce Vitest + RTL; write 3 foundational tests (#30).
4. Scaffold blog MDX route group and basic post layout (#27).
5. Build theme token panel for design system introspection (#25).

Risk / Watchlist:
- Auth delay blocks secure expansion of owner-only tools.
- Lack of tests risks regression in project sync & JSON tool state mgmt.
- Accessibility & reduced-motion concerns could impact perceived polish.

Launch Blockers (Must Reach ≥80% Readiness): auth (29), a11y (24), tests (30), SEO/meta, blog skeleton (27).

Planned Impact of Completing New P1 Items: Raises overall completion to ~78–80% and stabilizes foundation for polish.

### Security Hardening (Ongoing)

- [x] Convex sync mutation owner/auth enforcement (server-side)
- [x] Added `server-only` directive to GitHub service module
- [ ] (Future) Move GitHub sync fetch from client to Convex action using PAT
- [x] Replace public unauthenticated GitHub fetch with internal API route
- [x] Add rate limiting to internal GitHub proxy endpoint
- [x] Add audit logging (insert a log doc for sync events)

Open Questions:

- PAT storage strategy (env vs encrypted Convex storage)
- Public vs partially public toolkit scope
- Toast system consolidation (custom → shadcn/ui)

### Meta Tracking

Roadmap and TODO are in sync as of this snapshot. Recently validated closure of advanced JSON Tools feature (#18) already present in Completed section of `ROADMAP_ISSUES.md`. No additional closures pending; next focus is on P1 accessibility and rate limiting tasks.

---

## Quick Command Reference

```bash
pnpm dev --turbo          # Run app
pnpm dlx convex dev       # Convex + type gen
pnpm build --turbo        # Prod build
pnpm exec tsc --noEmit    # Type check
```
