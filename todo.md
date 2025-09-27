# Next Session TODO Roadmap

> Snapshot Date: 2025-09-27

## Legend

- P0 = Critical (unblocks or fixes broken/placeholder behavior)
- P1 = High Value (core feature parity with plan)
- P2 = Enhancement / polish

---

## P0 (Critical)

- [ ] Convex Types Confirmed Generated in Repo
  - Ensure `convex/_generated/api.d.ts` now includes modules (not `{}`) and commit if missing.
  - Remove any lingering suppressions (already removed; re-verify).
  - Acceptance: Opening `api.d.ts` shows `projects` and `messages` entries.

- [ ] Protect Toolkit for Owner Only
  - Add `NEXT_PUBLIC_OWNER_USER_ID` check in `toolkit/page.tsx` after `currentUser()`.
  - Acceptance: Signed-in non-owner redirected; owner gains access.

---

## P1 (High Value Features)

- [ ] GitHub → Convex Sync UI
  - Add a small button in Projects section (visible only to owner) to call `api.projects.syncFromGitHub`.
  - Build a lightweight client util to fetch GitHub repos (or placeholder mock until token strategy decided).
  - Acceptance: Clicking sync updates projects list and shows a toast/success state.

- [ ] ProjectCard Component Refactor
  - Extract card markup from `Projects.tsx` into `components/views/ProjectCard.tsx` (server or client if motion needed).
  - Acceptance: Projects rendering identical; component is reusable and typed.

- [ ] Contact Form Validation (Zod)
  - Add zod schema client-side before mutation (name 2–80 chars, email valid, message 5–1000 chars).
  - Show inline error messages; disable submit until valid.
  - Acceptance: Invalid submit blocked; valid submit succeeds unchanged.

- [ ] Auth UI Surface
  - Add Sign In/Out (Clerk components) to Navbar when Clerk configured.
  - Acceptance: Navbar shows Sign In when logged out, avatar/UserButton when logged in.

---

## P2 (Enhancements & Polish)

- [ ] Toolkit: JSON Formatter (MVP)
  - Textarea + Format button; try/catch parse with JSON.stringify(..., 2).
  - Error banner on invalid JSON; copy button on success.
  - Acceptance: Valid JSON formats; invalid shows error without crashing.

- [ ] Toolkit: Color Utility (MVP)
  - Input for HEX; auto-convert to RGB & HSL; basic color preview square.
  - Acceptance: Entering #RRGGBB updates conversions accurately (edge: shorthand #fff expands).

- [ ] Toolkit: Lorem Ipsum Generator (MVP)
  - Inputs: paragraphs (1–10); generate; copy button.
  - Acceptance: Generates expected count; no layout shift.

- [ ] Theme Persistence Audit
  - Verify cookie/localStorage set and SSR hydration has no flash.
  - Acceptance: No perceptible flash in light or dark across refresh.

- [ ] SEO Metadata
  - Add `metadata` export in `layout.tsx` & per-section OG basics.
  - Acceptance: View page source shows meta title/description.

---

## Stretch / Future

- [ ] Add Blog (MDX) Skeleton
- [ ] Rate Limit Contact Form (basic in-memory or Convex rate doc)
- [ ] Email / Notification on New Message (Convex action or 3rd-party)
- [ ] Tag Filtering or Search for Projects
- [ ] Add Tests (Vitest + React Testing Library) for Contact + Projects
- [ ] Lighthouse / Web Vitals Pass (score ≥ 90 across categories)

---

## Notes / Open Questions

- GitHub API auth strategy: PAT via server action? (Decide before real sync)
- Should toolkit remain fully private or partially public? (Design decision)
- Consider adding a global toast system (shadcn/ui + context) before more actions.

---

## Quick Command Reference

```bash
pnpm dev --turbo          # Run app
pnpm dlx convex dev       # Convex + type gen
pnpm build --turbo        # Prod build
pnpm exec tsc --noEmit    # Type check
```

