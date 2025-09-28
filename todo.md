# Next Session TODO Roadmap

> Snapshot Date: 2025-09-28

## Legend

- P0 = Critical (unblocks or fixes broken/placeholder behavior)
- P1 = High Value (core feature parity with plan)
- P2 = Enhancement / polish

---

## P0 (Critical)

- [x] Convex Types Confirmed Generated in Repo
  - Ensure `convex/_generated/api.d.ts` now includes modules (not `{}`) and commit if missing.
  - Remove any lingering suppressions (already removed; re-verify).
  - Acceptance: Opening `api.d.ts` shows `projects` and `messages` entries. (Verified)

- [x] Protect Toolkit for Owner Only
  - Add `NEXT_PUBLIC_OWNER_USER_ID` check in `toolkit/page.tsx` after `currentUser()`.
  - Acceptance: Signed-in non-owner redirected; owner gains access. (Implemented)

---

## P1 (High Value Features)

- [x] GitHub → Convex Sync UI
  - Owner-only button added, placeholder unauthenticated GitHub fetch implemented.
  - Acceptance: Sync updates Convex and basic alert feedback. (Future: replace alert with toast + PAT server action.)

- [x] ProjectCard Component Refactor
  - Extracted to `components/views/ProjectCard.tsx` with typed props and motion.
  - Acceptance: Rendering unchanged, reusable component. (Done)

- [x] Contact Form Validation (Zod)
  - Schema with constraints implemented, inline errors + disabled submit until valid.
  - Acceptance: Invalid submissions blocked. (Done)

- [x] Auth UI Surface
  - Navbar converted to client component with SignIn modal & UserButton; Toolkit link owner-gated.
  - Acceptance: Conditional UI present. (Done)

- [x] Toolkit: UUID Generator (#7)
  - Generate 1–50 UUID v4 & v7 entries (per selected versions), list with copy-all & per-item copy.
  - Acceptance: Generates exactly requested count per version selection; copy places newline-separated list. (Implemented)

- [x] Toolkit: Timestamp Converter (#8)
  - Input auto-detect (UNIX s/ms, ISO). Outputs ISO, locale, UNIX(s), UNIX(ms), relative from now.
  - Acceptance: Milliseconds vs seconds detection accurate; invalid input error message. (Implemented)

- [x] Toolkit: Base64 / URL Encoder-Decoder (#9)
  - Two mode selectors (Base64 / URL) + direction (encode/decode); handles UTF-8 safely.
  - Acceptance: Round-trip integrity for typical strings; invalid base64 shows error. (Implemented)

- [x] Toolkit: Regex Tester (#10)
  - Pattern + flags + test area; highlights matches; safe execution timeout & loop guards.
  - Acceptance: Displays match count & indices; invalid pattern error; large input handled without freeze. (Implemented)

- [x] Toolkit: JSON → TS Interface (#11)
  - Paste JSON; produce interface(s) with inferred optional properties & array element type.
  - Acceptance: Nested objects converted; arrays produce union or element type; copy button. (Implemented – mixed array sample yields union; object keys present only in some variants marked optional; empty array => unknown[].)

---

## P2 (Enhancements & Polish)

- [x] Toolkit: JSON Tools Advanced
  - Added: Tree view with expand/collapse, key sorting, search (plain + regex) with match navigation, depth collapse selector, performance mode (node cap warning), JSON→CSV export, path/value copy, JSON Pointer copy, inline primitive editing (double-click), undo/redo (50-state history), minify, download.
  - Acceptance: All functions operate without runtime errors; undo/redo reflects edits/format/minify; pointer and path copies valid.

- [x] Toolkit: JSON Tools Multi-Sheet Workbook Export (CSV ZIP & XLSX) (#22, #23)
  - Detects workbook patterns (`sheets[]`, `workbook[]`, or object-of-arrays) and enables: per-sheet CSV inside ZIP (dynamic `jszip`) and native XLSX export (dynamic `xlsx`) with union-of-keys column ordering, safe sheet naming (<=31 chars), large workbook guard (>200k cells confirm dialog).
  - Acceptance: Workbook detection triggers two export buttons; invalid sheet shapes skipped with remaining sheets exported; large data prompt appears when threshold exceeded.

- [x] Toolkit: Color Utility (MVP)
  - Input for HEX; auto-convert to RGB & HSL; basic color preview square.
  - Acceptance: Entering #RRGGBB updates conversions accurately (edge: shorthand #fff expands).

- [x] Toolkit: Lorem Ipsum Generator (MVP)
  - Inputs: paragraphs (1–10); generate; copy button.
  - Acceptance: Generates expected count; no layout shift.

- [x] Theme Persistence Audit
  - Verify cookie/localStorage set and SSR hydration has no flash.
  - Acceptance: No perceptible flash in light or dark across refresh.

- [x] SEO Metadata
  - Add `metadata` export in `layout.tsx` & per-section OG basics.
  - Acceptance: View page source shows meta title/description.

- [x] Toolkit: JWT Decoder (Local) (#12)
  - Decode header/payload (no signature verify) with JSON pretty print.
  - Acceptance: Malformed tokens show error; security warning displayed. (Implemented – 3-part check, base64url decode with padding, per-part JSON parse errors surfaced, exp/iat/nbf surfaced, copy buttons, warning note.)

- [x] Toolkit: Color Palette Extractor (#13)
  - Client-only image upload → dominant colors (top 5–8) via canvas.
  - Acceptance: Displays swatches with hex; handles non-image gracefully. (Implemented – k-means style clustering on sampled pixels, copy hex, re-run, transparent pixels skipped.)

- [x] Toolkit: Text Diff Tool (#14)
  - Two inputs; compute line diff; copy diff button.
  - Acceptance: Differences highlighted; performance acceptable up to moderate size. (Implemented – line-based LCS, context/add/del styling, unified diff copy.)

- [x] Toolkit: Markdown Preview (#15)
  - Live preview (sanitize HTML) with basic styling.
  - Acceptance: Headings, lists, code blocks render; script tags stripped. (Implemented – custom lightweight parser supporting headings 1-6, lists, bold/italic, inline & fenced code, links (http/https); sanitizer via escape & controlled tag emission; copy HTML feature.)

- [x] Toolkit: Slug / Case Converter (#16)
  - Live transforms: slug, camelCase, PascalCase, snake_case, CONSTANT_CASE, Title Case, kebab-case.
  - Acceptance: Non-alphanumeric collapsed; multiple spaces normalized. (Implemented – NFKD diacritic strip, camel boundary detection, copy per row.)

- [x] Toolkit: Audit Log Viewer (#17)
  - Owner-only list of recent `auditLogs` with filter by action/status.
  - Acceptance: Pagination or lazy load; red highlight for errors. (Implemented – Convex query with filters & cursor pagination, action/status selects, error row highlighting, next-page cursor.)

---

## Stretch / Future

- [ ] JSON Tools: Virtualized tree rendering (react-window) for >50k nodes
- [ ] JSON Tools: Persist undo/redo history across sessions (indexedDB or compressed localStorage)
- [ ] JSON Tools: Find & replace (regex + preview) with batch edit confirmation
- [ ] JSON Tools: Export selected subtree as new JSON file
- [ ] JSON Tools: Collapsed state serialization (shareable URL param)
- [ ] Add Blog (MDX) Skeleton
- [ ] Rate Limit Contact Form (basic in-memory or Convex rate doc)
- [ ] Email / Notification on New Message (Convex action or 3rd-party)
- [ ] Tag Filtering or Search for Projects
- [ ] Add Tests (Vitest + React Testing Library) for Contact + Projects
- [ ] Lighthouse / Web Vitals Pass (score ≥ 90 across categories)

---

## Notes / Open Questions

### Security Hardening (Ongoing)

- [x] Convex sync mutation owner/auth enforcement (server-side)
- [x] Added `server-only` directive to GitHub service module
- [ ] Move GitHub sync fetch from client to Convex action using PAT (planned)
- [x] Replace public unauthenticated GitHub fetch with internal API route
- [x] Add rate limiting to internal GitHub proxy endpoint
- [x] Add audit logging (insert a log doc for sync events)

- GitHub API auth strategy: PAT via server action? (Decide before real sync)
- Should toolkit remain fully private or partially public? (Design decision)
- Toast system implemented (custom). Evaluate migration to shadcn/ui toast primitive later for consistency.

---

## Quick Command Reference

```bash
pnpm dev --turbo          # Run app
pnpm dlx convex dev       # Convex + type gen
pnpm build --turbo        # Prod build
pnpm exec tsc --noEmit    # Type check
```
