# Personal Website & Toolkit

A modern personal site + utilities hub built with a strict TypeScript-first + App Router stack. It acts as a digital resume, portfolio, and (soon) a set of handy developer tools.

## 🚀 Tech Stack

| Area | Technology |
| ---- | ---------- |
| Framework | Next.js 15 (App Router, Server Components first) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui (New York theme, slate palette) |
| Animations | Framer Motion (centralized variants in `src/lib/motion.ts`) |
| Backend (data) | Convex (real-time queries + mutations) |
| Auth | Clerk (conditionally enabled) |
| Package Manager | pnpm 9 (pinned via `packageManager`) |
| Icons | lucide-react |
| Deployment | Vercel |

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
if (!user || (ownerId && user.id !== ownerId)) redirect('/');
```

### Middleware

Clerk requires middleware to reliably detect auth on App Router server components. Implemented in `src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/toolkit(.*)']);

export default clerkMiddleware((auth, req) => {
   if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return; // Skip if not configured
   if (isProtectedRoute(req)) auth.protect();
});

export const config = { matcher: ['/toolkit/:path*'] };
```

This keeps auth overhead minimal—only `/toolkit` runs through middleware. Without keys set, the middleware becomes a no-op so local dev remains frictionless.

### Graceful Degradation

`toolkit/page.tsx` only calls `currentUser()` when Clerk is actually configured, preventing the runtime error (`auth() was called but Clerk can't detect usage of clerkMiddleware`) if someone forgets the middleware or env vars.

### Next Steps

- Add a sign-in UI surface (modal or redirect) instead of hard redirect.
- Owner-only logic using `NEXT_PUBLIC_OWNER_USER_ID` (already documented) to restrict even signed-in non-owner users.

## 🛠️ Toolkit Roadmap

| Tool | Purpose | Notes |
| ---- | ------- | ----- |
| JSON Formatter | Prettify + validate JSON | Will use worker / try/catch for errors |
| Color Utility | Pick + convert | HEX / RGB / HSL conversions + copy buttons |
| Lorem Ipsum | Generate filler text | Paragraph / words / bytes options |

Each tool will become its own client component under a future `src/components/toolkit/` directory.

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

| Command | Description |
| ------- | ----------- |
| `pnpm dev --turbo` | Run dev server with Turbopack |
| `pnpm build --turbo` | Production build |
| `pnpm dlx convex dev` | Start Convex local + regenerate types |
| `pnpm dlx shadcn add <component>` | Add shadcn/ui component |

## 🐞 Troubleshooting

| Issue | Fix |
| ----- | ---- |
| Convex `api` object empty | Run `pnpm dlx convex dev` so generator picks up modules |
| Clerk publishable key build error | Omit keys (provider stays off) or add valid env vars |
| Dark mode flash | Ensure `ThemeProvider` props include `disableTransitionOnChange` |
| Motion SSR error | Add `'use client'` to components using `framer-motion` |
| Type errors on Convex calls | Remove `@ts-expect-error` only after types regenerate |

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
