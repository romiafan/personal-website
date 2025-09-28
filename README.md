# Personal Website & Toolkit

A modern personal site + utilities hub built with a strict TypeScript-first + App Router stack. It acts as a digital resume, portfolio, and (soon) a set of handy developer tools.

## 🚀 Tech Stack

| Area            | Technology                                                  |
| --------------- | ----------------------------------------------------------- |
| Framework       | Next.js 15 (App Router, Server Components first)            |
| Language        | TypeScript (strict)                                         |
| Styling         | Tailwind CSS v4, shadcn/ui (New York theme, slate palette)  |
| Animations      | Framer Motion (centralized variants in `src/lib/motion.ts`) |
| Backend (data)  | Convex (real-time queries + mutations)                      |
| Auth            | Clerk (always-on provider)                                  |
| Package Manager | pnpm 9 (pinned via `packageManager`)                        |
| Icons           | lucide-react                                                |
| Deployment      | Vercel                                                      |

## 🏗️ Project Structure

```text
src/
   app/
      layout.tsx          # Root layout & global providers
      page.tsx            # Home page
      toolkit/            # Protected utilities hub (placeholder)
   components/
      layout/             # Navbar, Footer
      providers/          # Theme + Convex + (conditional) Clerk
      ui/                 # shadcn/ui components
      views/              # Hero, About, Projects, TechStack, Contact
   lib/
      utils.ts            # cn() helper
      motion.ts           # Framer Motion variants
convex/                 # Convex schema + functions
```

## ⚡ Quick Start

```bash
nvm use                 # Node 22 (see .nvmrc)

pnpm dlx convex dev     # (separate terminal) generate / watch Convex types
pnpm dev --turbo        # start development server
```

Then visit: <http://localhost:3000>

## ✅ Implemented Features

- Tailwind CSS v4 theming + dark/light toggle (`ThemeToggle`)
- Sections: Hero / About / Projects / Tech Stack / Contact
- Framer Motion entrance + stagger animations
- Convex schema: `projects`, `messages`
- Projects list via `useQuery(api.projects.get)` (loading + empty states)
- Contact form posting through `messages.send` mutation
- Always-on `ClerkProvider` (prevents prerender hook errors)
- `/toolkit` protected route scaffold (auth required, placeholder cards)
- Strict TypeScript + ESLint clean build
- Central motion variants file to keep consistency

## 🔜 In Progress / Planned

Tracked issues (see `ROADMAP_ISSUES.md` for full table):

- (#24) Accessibility: Reduced Motion Variant Pruning
- (#25) Theming: Interactive Theme Token Panel
- (#26) Performance: Motion Variant Tree-Shaking
- (#27) Content: Blog Route Group (MDX) Skeleton
- (#28) Contact: Basic Rate Limiting

Recently completed: skip link + initial reduced-motion baseline (CSS)

## 🧩 Convex Integration & Types

Current repo snapshot included an empty generated `convex/_generated/api.d.ts`, so temporary `@ts-expect-error` directives exist where `api.projects.get` and `api.messages.send` are used.

Generate proper types:

```bash
pnpm dlx convex dev
```

While that process runs, it watches `convex/*.ts` and regenerates `_generated/*`. Once populated, remove the `@ts-expect-error` lines in:

- `src/components/views/Projects.tsx`
- `src/components/views/Contact.tsx`

If types stay empty:

1. Ensure functions live directly under `convex/` (not nested folders)
2. Confirm `convex/schema.ts` exports the tables
3. Restart the dev process

## 🔐 Authentication (Clerk)

The `ClerkProvider` only renders when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is defined—avoiding build-time failures. The `/toolkit` page gates content with `currentUser()` and redirects to `/` if unauthenticated. To restrict further to only you:

```ts
const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID;
if (!user || (ownerId && user.id !== ownerId)) redirect("/");
```

### Middleware

Clerk requires middleware to reliably detect auth on App Router server components. Implemented in `src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/toolkit(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return; // Skip if not configured
  if (isProtectedRoute(req)) auth.protect();
});

export const config = { matcher: ["/toolkit/:path*"] };
```

This keeps auth overhead minimal—only `/toolkit` runs through middleware. Without keys set, the middleware becomes a no-op so local dev remains frictionless.

### Graceful Degradation

`toolkit/page.tsx` only calls `currentUser()` when Clerk is actually configured, preventing the runtime error (`auth() was called but Clerk can't detect usage of clerkMiddleware`) if someone forgets the middleware or env vars.

### Next Steps

- Add a sign-in UI surface (modal or redirect) instead of hard redirect.
- Owner-only logic using `NEXT_PUBLIC_OWNER_USER_ID` (already documented) to restrict even signed-in non-owner users.

## 🛠️ Toolkit

Implemented tools (owner-gated):

| Tool                         | Key Features                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON Tools                   | Pretty format, error feedback, minify, JSON → CSV, multi-sheet workbook detection with ZIP & XLSX export, tree/table views, search (plain + regex) with highlighting & navigation, key sorting, depth-based collapse, performance mode (node cap), copy path/value, JSON Pointer copy (RFC6901), inline primitive editing (double-click), undo/redo history (50 states) |
| UUID Generator               | v4 & v7 generation, configurable count, per-item & bulk copy                                                                                                                                                                                                                                                                                                            |
| Timestamp Converter          | Auto-detect input (UNIX s / ms / ISO), outputs ISO, locale, UNIX(s/ms), relative time                                                                                                                                                                                                                                                                                   |
| Base64 / URL Encoder-Decoder | Two-direction encode/decode with error handling, UTF‑8 safe                                                                                                                                                                                                                                                                                                             |
| Regex Tester                 | Pattern + flags, safe execution guard, match highlighting & indices                                                                                                                                                                                                                                                                                                     |
| JSON → TS Interface          | Infers nested interfaces, optional props, array element union inference                                                                                                                                                                                                                                                                                                 |
| JWT Decoder                  | Base64url decode header/payload, structured claims view, validation errors, security disclaimer                                                                                                                                                                                                                                                                         |
| Color Utility                | HEX → RGB/HSL conversion, validation & preview swatch                                                                                                                                                                                                                                                                                                                   |
| Color Palette Extractor      | Image upload → dominant palette (5–8 colors), copy hex, skips transparent pixels                                                                                                                                                                                                                                                                                        |
| Text Diff Tool               | Line-level diff (LCS), add/del/context styling, copy unified diff                                                                                                                                                                                                                                                                                                       |
| Markdown Preview             | Live sanitized preview (headings, lists, code blocks, links) with HTML copy                                                                                                                                                                                                                                                                                             |
| Slug / Case Converter        | slug, camelCase, PascalCase, snake_case, CONSTANT_CASE, Title, kebab-case; diacritic stripping                                                                                                                                                                                                                                                                          |
| Lorem Ipsum Generator        | Paragraph count (1–10), copy output                                                                                                                                                                                                                                                                                                                                     |
| Audit Log Viewer             | Paged Convex query, action/status filters, error highlighting                                                                                                                                                                                                                                                                                                           |

Planned / Backlog:

- Virtualized JSON tree rendering for very large payloads
- Undo/redo persistence across sessions
- Bulk multi-node JSON edits & find/replace
- Shareable permalink state for JSON tool configurations
<!-- XLSX export implemented via Issue #23 -->

### Resilient XLSX Loading

The XLSX export uses a resilient dynamic loader that attempts multiple entrypoints (`xlsx`, `xlsx/xlsx.mjs`, `xlsx/dist/xlsx.full.min.js`) with a retry + idle prefetch to mitigate transient chunk load failures in some production edge cases. Ambient module declarations ensure strict typing.

### Health Check Endpoint

`/api/health` returns JSON `{ status: "ok", buildTime, uptimeMs }` for basic uptime monitoring and can be extended later with dependency status.

All toolkit components live under `src/components/views/tools/` and are loaded only inside the protected `/toolkit` route to keep public bundle size lean.

## 🌈 Theming & Motion

Dark/light theme handled by `next-themes` (CSS variables, not class toggling). Animations use standardized variants:

```tsx
<motion.section
  variants={staggerContainer}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true }}
>
  <motion.h2 variants={fadeInUp}>Section</motion.h2>
</motion.section>
```

Keep animations subtle (performance & accessibility). Avoid excessive parallax or long-running infinite loops.

### Layout System & Section Wrapper

The homepage and future marketing pages use a `Section` component that standardizes vertical rhythm and width tiers.

Variants:

| Variant   | Max Width       | Use Case                                   |
| --------- | --------------- | ------------------------------------------ |
| `prose`   | ~65ch           | Text-heavy content blocks (About, Contact) |
| `default` | 80rem (≈1280px) | General content / mixed media              |
| `wide`    | 1400px          | Hero / visually rich or grids              |

Vertical spacing: `py-[clamp(4rem,8vw,8rem)]` applied uniformly so large screens get breathing room without wasting space on mobile.

Subtle separators: Each section has a faint top border (`border-t border-border/40`) except the first—creating structure without heavy dividers.

Usage example:

```tsx
import { Section } from "@/components/layout/Section";

export function About() {
  return (
    <Section id="about" variant="prose">
      <h2 className="text-3xl font-semibold tracking-tight mb-6">About</h2>
      <p className="text-muted-foreground leading-relaxed">
        I craft performant full‑stack products with an emphasis on accessible,
        resilient interfaces.
      </p>
    </Section>
  );
}
```

### Dark Theme (Dracula-Inspired)

The dark palette approximates Dracula colors using OKLCH for perceptual consistency: purple primary, balanced foreground, softened secondary surfaces, subtle noise + radial gradients for depth. Light theme remains minimal for clarity.

### Background Layers

Two large radial gradients plus a procedural noise overlay (`radial-gradient` dots via CSS) are injected in `layout.tsx`. This keeps the page visually engaging while avoiding large image assets. Opacity is tuned separately for light/dark.

### Motion Accessibility

Motion is concentrated in entrance transitions (opacity + small translate). For users with `prefers-reduced-motion: reduce`, consider future enhancement to neutralize transforms entirely (current usage already low-impact).

### Forms & Surfaces

Interactive surfaces (cards, form panels) use translucent `bg-card/40` + `backdrop-blur` to layer over gradient backgrounds, reinforcing depth without increasing contrast fatigue. Focus rings use `ring-primary/40` for consistency.

### Future Enhancements

Core accessibility & theming:

- Additional reduced-motion variant pruning (already partially implemented)
- Theme token live preview panel (visualize OKLCH adjustments)
- Skip link (implemented) & focus outline audit in dark mode

Performance & polish:

- Motion variant tree-shaking (import-on-demand)
- Conditional radial gradient intensity based on scroll depth
- Pre-render critical section skeletons for faster FCP

Content & structure:

- Add blog/notes route group with MDX & RSC streaming
- Expand Projects with tag filtering & pagination via Convex
- Case studies with light/dark adaptive diagrams

Tooling & DX:

- Storybook or Ladle for isolated component review (subset only)
- Visual regression tests on key sections (Playwright)
- Lint rule to enforce Section wrapper for top-level homepage sections

## 🔧 Environment Variables

Create `.env.local`:

```bash
# Convex (required for data functionality + type generation)
NEXT_PUBLIC_CONVEX_URL=your-convex-url
CONVEX_DEPLOYMENT=your-convex-deployment

# Clerk (optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Optional: restrict toolkit route to a single user
NEXT_PUBLIC_OWNER_USER_ID=user_1234
```

## 🧪 Scripts

| Command                           | Description                           |
| --------------------------------- | ------------------------------------- |
| `pnpm dev --turbo`                | Run dev server with Turbopack         |
| `pnpm build --turbo`              | Production build                      |
| `pnpm dlx convex dev`             | Start Convex local + regenerate types |
| `pnpm dlx shadcn add <component>` | Add shadcn/ui component               |

## 🐞 Troubleshooting

| Issue                             | Fix                                                              |
| --------------------------------- | ---------------------------------------------------------------- |
| Convex `api` object empty         | Run `pnpm dlx convex dev` so generator picks up modules          |
| Clerk publishable key build error | Omit keys (provider stays off) or add valid env vars             |
| Dark mode flash                   | Ensure `ThemeProvider` props include `disableTransitionOnChange` |
| Motion SSR error                  | Add `'use client'` to components using `framer-motion`           |
| Type errors on Convex calls       | Remove `@ts-expect-error` only after types regenerate            |

## 🧱 Architectural Notes

- Server Components by default; promote to Client only when using state, hooks, or motion.
- Shared styling via Tailwind utility classes; `cn()` merges conditionally.
- Keep animations centralized to variants for consistency.

## 📚 Additional Docs

- `website-plan.md` – broader roadmap & intent
- `.github/` instruction files – enforced conventions

## 📄 License

Personal project – not licensed for redistribution.

---

Built with ❤️ using Next.js, TypeScript, Convex, and modern web tooling.

## 🛡️ Security & Token Scope

- `.env.local` (and any `.env*`) are already ignored via `.gitignore` (pattern `.env*`). Do not commit secrets.
- `GITHUB_TOKEN` should have the minimal scope needed (typically `public_repo` or read-only repo scope). Avoid full `repo` if not required.
- Consider rotating the token periodically or using a fine-grained PAT restricted to public repos if possible.

## 🚢 Production Deployment Checklist

Before first deploy (e.g. to Vercel):

1. Set the following env vars in the hosting platform:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER`
- `NEXT_PUBLIC_OWNER_USER_ID`
- `GITHUB_TOKEN`

1. Deploy the site.
1. Sign in as the owner and trigger a projects sync.
1. Verify:

- Sync succeeds (toast shows imported repo count)
- `Last sync` line updates with relative time
- Convex dashboard shows function invocation with your Clerk user id

1. Test visiting `/toolkit` while signed out (should redirect or hide tools).
1. Test visiting `/toolkit` with a non-owner account (should not expose owner-only actions like sync).

Post-deploy hardening (optional):

- Enable automatic project sync via Convex cron (see below) to reduce manual operations.
- Add monitoring (e.g. health check endpoint) to uptime service.

## ⏱️ Future: Automated Daily Sync (Scheduling)

Convex supports scheduled tasks (cron). A future enhancement can trigger `syncViaGithub` action daily:

Pseudo-config (conceptual example – adapt when enabling cron):

```ts
// convex/crons.ts
import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();
crons.daily("daily github sync", { hourUTC: 2, minuteUTC: 0 }, async (ctx) => {
  await ctx.runAction(api.projects.syncViaGithub, { username: "romiafan" });
});

export default crons;
```

Then remove or hide the manual sync button for production visitors (keeping a hidden owner override if desired).

## � Clerk + Convex Authentication (JWT Template)

Convex needs a Clerk-issued JWT to authenticate users. The Convex <-> Clerk bridge looks for a JWT template named `convex`.

### 1. Create Clerk JWT Template

In the Clerk dashboard:

1. Navigate: Application → JWT Templates → New Template
2. Name: `convex` (must match exactly)
3. Algorithm: `RS256`
4. (Optional) Custom claims – minimal example:

   ```json
   {
     "sub": "{{user.id}}",
     "email": "{{user.primary_email_address.email_address}}"
   }
   ```

5. Save & Enable.

### 2. Configure Issuer Env Var

Add to `.env.local`:

```bash
CLERK_JWT_ISSUER=https://YOUR_SUBDOMAIN.clerk.accounts.dev
```

Use the exact issuer shown in the template details page (it ends with `.accounts.dev` for test or your production domain).

### 3. Convex Auth Config

`convex/auth.config.ts` lists providers:

```ts
export default {
  providers: [
    { domain: process.env.CLERK_JWT_ISSUER || "", applicationID: "convex" },
  ].filter((p) => p.domain),
};
```

If the issuer is missing, the provider list is empty and authentication will fail (you'll see `Failed to authenticate: "No auth provider found matching the given token"`).

### 4. Client Provider Bridge

`ConvexProviderWithClerk` (in `convex-provider.tsx`) passes Clerk `useAuth()` to Convex so requests include a fresh JWT.

### 5. Common Errors & Fixes

| Error Message                                            | Cause                                | Fix                                           |
| -------------------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| `No JWT template exists with name: convex`               | Template missing                     | Create template named `convex`                |
| `No auth provider found matching the given token`        | Missing / wrong `CLERK_JWT_ISSUER`   | Set correct issuer env var                    |
| `Unauthorized: sign in required` in Convex function logs | Token not sent / invalid             | Ensure template enabled & provider configured |
| Owner-only sync button says not owner though signed in   | `NEXT_PUBLIC_OWNER_USER_ID` mismatch | Copy correct Clerk user id                    |
| Works locally but fails in production                    | Prod env vars incomplete             | Replicate `.env.local` to Vercel              |

### 6. Verification Checklist

After setup, open DevTools Network tab:

- Trigger a Convex query/mutation
- Request should include `Authorization: Bearer <jwt>` header (or WebSocket auth message)
- The Convex dashboard’s function logs should show your user subject (Clerk user id) in audit entries.

### 7. Security Notes

- Do not expose `CLERK_SECRET_KEY` client-side; only `NEXT_PUBLIC_*` keys are shipped to browser.
- The JWT template controls which claims reach Convex—keep it minimal.
- Rotate keys or disable template if compromised.

---

## �🔐 Toolkit Access & Owner Setup

The `/toolkit` route is strictly owner-gated when Clerk is configured. Without Clerk env vars it hard-redirects to `/` (never publicly exposed).

### 1. Environment Variables

Create `.env.local` with (example):

```bash
NEXT_PUBLIC_CONVEX_URL=https://YOUR_CONVEX_URL
CONVEX_DEPLOYMENT=dev:YOUR_DEPLOYMENT_ID

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Lock toolkit to just your Clerk user id
NEXT_PUBLIC_OWNER_USER_ID=user_1234567890
```

You can retrieve your Clerk user id from the dashboard (Users → select yourself) or via `currentUser()` in a temporary debug component.

### 2. Start Convex & Dev Server

Two terminals recommended:

```bash
pnpm dlx convex dev   # Terminal A (watches schema & regenerates types)
pnpm dev --turbo      # Terminal B (Next.js app)
```

### 3. Sign In & Authorization Flow

1. Visit `http://localhost:3000` – you should see the public site.
2. Use the Clerk sign-in (if surfaced) or navigate directly to `/toolkit` — unauthenticated users will be redirected home.
3. After signing in as the owner (matching `NEXT_PUBLIC_OWNER_USER_ID`), visit `/toolkit` again – tools load.
4. Any non-owner authenticated user hitting `/toolkit` is redirected to `/`.

### 4. Verifying Convex Connectivity

Open the browser devtools Network tab and perform an action (e.g., trigger any Convex-backed mutation if exposed). You should see WebSocket or HTTP requests to your Convex deployment. If the `api` object was previously empty, ensure the Convex dev process is running.

### 5. Common Pitfalls

| Symptom                        | Cause                                        | Fix                                           |
| ------------------------------ | -------------------------------------------- | --------------------------------------------- |
| Redirect loop on `/toolkit`    | Missing Clerk env vars but middleware active | Remove keys or supply valid values            |
| 500 error from Convex calls    | Wrong `NEXT_PUBLIC_CONVEX_URL`               | Copy correct URL from Convex dashboard        |
| `api.auditLogs.list` undefined | Convex dev not running during import         | Start `pnpm dlx convex dev` then restart Next |
| Owner blocked despite sign-in  | `NEXT_PUBLIC_OWNER_USER_ID` mismatch         | Confirm actual user id in Clerk dashboard     |

### 6. Production Deployment Checklist

Set the same env vars in Vercel:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_OWNER_USER_ID`

Then deploy. The `/toolkit` route will remain private to your account.

### 7. Extending Audit Logs

Audit entries currently added on GitHub project sync. To add more:

```ts
await ctx.db.insert("auditLogs", {
  actor: identity?.subject ?? "system",
  action: "some.action",
  status: "success",
  created_at: new Date().toISOString(),
});
```

Add new `action` values to the `<select>` in `AuditLogViewer` for quick filtering.

---
