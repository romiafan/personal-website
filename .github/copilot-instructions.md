# GitHub Copilot Instructions

## Project Overview

This is a modern personal website and toolkit built with a strict TypeScript-first architecture. It serves as a digital resume, portfolio showcase, and collection of useful web utilities for a software engineer.

## Architecture & Tech Stack

**Core Stack (Mandatory - DO NOT substitute):**

- Next.js 15+ with App Router (not Pages Router)
- TypeScript (strict mode)
- Tailwind CSS v4 (not v3)
- shadcn/ui with "new-york" style and slate color scheme
- Framer Motion for animations
- lucide-react for icons
- pnpm as package manager (never npm/yarn)

**Planned Integrations (not yet implemented):**

- Convex for backend/database
- Clerk for authentication
- Vercel for deployment

## Development Workflow

**Commands (use pnpm exclusively):**

```bash
pnpm dev --turbo          # Development with Turbopack
pnpm build --turbo        # Production build with Turbopack
pnpm dlx shadcn add [component]  # Add shadcn/ui components
```

**File Structure Conventions:**

```
src/
├── app/                  # Next.js App Router pages
│   ├── toolkit/         # Protected utility tools (future)
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Home page
├── components/
│   ├── layout/          # Navbar, Footer
│   ├── ui/              # shadcn/ui components
│   └── views/           # Page sections (Hero, About, Projects)
├── lib/
│   ├── utils.ts         # cn() utility for class merging
│   └── convex.ts        # Convex client setup (future)
```

## Key Patterns & Conventions

**Component Architecture:**

- Use React Server Components by default
- Client components only when needed (animations, interactions)
- Each page section as separate component in `src/components/views/`
- shadcn/ui components go in `src/components/ui/` (auto-managed)

**Styling Approach:**

- Tailwind CSS v4 with CSS variables enabled
- Use `cn()` utility from `src/lib/utils.ts` for conditional classes
- Dark/light mode via CSS variables (not class-based)
- Component variants via class-variance-authority

**Data Patterns (future):**

- Convex `useQuery` for data fetching
- Convex `useMutation` for form submissions
- Real-time updates via Convex subscriptions

## Critical Implementation Notes

**Font Setup:**

- Uses Geist and Geist Mono fonts via `next/font/google`
- CSS variables: `--font-geist-sans` and `--font-geist-mono`

**Animation Strategy:**

- Framer Motion for page transitions and micro-interactions
- Subtle entrance animations on component load
- Hover/focus effects on interactive elements

**Form Handling:**

- Contact forms will save to Convex database
- Success/error states for user feedback
- Client-side validation before submission

## Protected Routes

The `/toolkit` route will be protected by Clerk authentication - only the site owner can access utility tools like JSON formatter, color picker, and Lorem ipsum generator.

## Import Aliases

Always use these configured aliases:

```typescript
@/components  // src/components
@/lib        // src/lib
@/hooks      // src/hooks
@/ui         // src/components/ui
```

## Code Quality Standards

- TypeScript strict mode enabled
- ESLint configuration follows Next.js recommendations
- All components must be typed
- Prefer explicit return types for complex functions
- Use proper semantic HTML and accessibility practices

When implementing new features, always reference the `website-plan.md` for detailed specifications and maintain strict adherence to the defined technology stack.

Before and after doing task, always check and update the `todo.md` file to check next steps and put next plans to implement.

Put the P0 and P1 task on github issues and link them in the `todo.md` and `ROADMAP_ISSUE.md` file.
