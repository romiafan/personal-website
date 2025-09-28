# Active TODO Snapshot

> Snapshot Date: 2025-09-28

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

---

## P2 (Enhancements & Polish)

- [ ] (#25) Theming: Interactive Theme Token Panel
- [ ] (#26) Performance: Motion Variant Tree-Shaking
- [ ] (#27) Content: Blog Route Group (MDX) Skeleton

## P3 (Longer Term)

- [ ] (#19) JSON Tools: Virtualized Rendering
- [ ] (#20) JSON Tools: Find & Replace
- [ ] (#21) JSON Tools: Persist Undo/Redo History

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

---

## Quick Command Reference

```bash
pnpm dev --turbo          # Run app
pnpm dlx convex dev       # Convex + type gen
pnpm build --turbo        # Prod build
pnpm exec tsc --noEmit    # Type check
```
