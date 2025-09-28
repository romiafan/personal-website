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
| Auth            | Clerk (conditionally enabled)                               |
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
- Conditional `ClerkProvider` (site builds without env keys)
- `/toolkit` protected route scaffold (auth required, placeholder cards)
- Strict TypeScript + ESLint clean build
- Central motion variants file to keep consistency

## 🔜 In Progress / Planned

- UI trigger for `projects.syncFromGitHub`
- Replace temporary `@ts-expect-error` after Convex types regenerate
- JSON Formatter (pretty + error highlight)
- Color Picker / Converter (HEX ⇄ RGB ⇄ HSL)
- Lorem Ipsum generator
- Owner-only guard (env-driven user id) for toolkit
- Optional blog / MDX content

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

| Tool | Key Features |
| ---- | ------------ |
| JSON Tools | Pretty format, error feedback, minify, JSON → CSV, tree/table views, search (plain + regex) with highlighting & navigation, key sorting, depth-based collapse, performance mode (node cap), copy path/value, JSON Pointer copy (RFC6901), inline primitive editing (double-click), undo/redo history (50 states) |
| UUID Generator | v4 & v7 generation, configurable count, per-item & bulk copy |
| Timestamp Converter | Auto-detect input (UNIX s / ms / ISO), outputs ISO, locale, UNIX(s/ms), relative time |
| Base64 / URL Encoder-Decoder | Two-direction encode/decode with error handling, UTF‑8 safe |
| Regex Tester | Pattern + flags, safe execution guard, match highlighting & indices |
| JSON → TS Interface | Infers nested interfaces, optional props, array element union inference |
| JWT Decoder | Base64url decode header/payload, structured claims view, validation errors, security disclaimer |
| Color Utility | HEX → RGB/HSL conversion, validation & preview swatch |
| Color Palette Extractor | Image upload → dominant palette (5–8 colors), copy hex, skips transparent pixels |
| Text Diff Tool | Line-level diff (LCS), add/del/context styling, copy unified diff |
| Markdown Preview | Live sanitized preview (headings, lists, code blocks, links) with HTML copy |
| Slug / Case Converter | slug, camelCase, PascalCase, snake_case, CONSTANT_CASE, Title, kebab-case; diacritic stripping |
| Lorem Ipsum Generator | Paragraph count (1–10), copy output |
| Audit Log Viewer | Paged Convex query, action/status filters, error highlighting |

Planned / Backlog:

- Virtualized JSON tree rendering for very large payloads
- Undo/redo persistence across sessions
- Bulk multi-node JSON edits & find/replace
- Shareable permalink state for JSON tool configurations

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

## 🔐 Toolkit Access & Owner Setup

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
