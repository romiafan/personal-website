# Personal Website & Toolkit

A modern personal website and toolkit built with a strict TypeScript-first architecture. This serves as a digital resume, portfolio showcase, and collection of useful web utilities for a software engineer.

## 🚀 Tech Stack

**Core Technologies (Mandatory - DO NOT substitute):**

- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript (strict mode)
- **Package Manager:** pnpm (exclusively)
- **Bundler:** Turbopack
- **Backend:** Convex for database/serverless functions
- **Authentication:** Clerk (integrated with Convex)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (new-york style, slate color)
- **Icons:** lucide-react
- **Animations:** Framer Motion
- **Fonts:** Geist and Geist Mono
- **Deployment:** Vercel

## 🏗️ Project Structure

```text
src/
├── app/                  # Next.js App Router pages
│   ├── toolkit/         # Protected utility tools (future)
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Home page
├── components/
│   ├── layout/          # Navbar, Footer
│   ├── ui/              # shadcn/ui components
│   ├── views/           # Page sections (Hero, About, Projects)
│   └── providers/       # Theme, Convex providers
├── lib/
│   ├── utils.ts         # cn() utility for class merging
│   └── convex.ts        # Convex client setup (future)
convex/                  # Convex backend functions
```

## 🛠️ Development

**Prerequisites:**

- Node.js 18+
- pnpm (install with `npm install -g pnpm`)

**Commands (use pnpm exclusively):**

```bash
# Development with Turbopack
pnpm dev --turbo

# Production build with Turbopack
pnpm build --turbo

# Start production server
pnpm start

# Linting
pnpm lint

# Add shadcn/ui components
pnpm dlx shadcn add [component]

# Initialize Convex (when ready)
pnpm dlx convex init
```

## 🎯 Key Features

### Current Implementation

- ✅ Modern responsive design with Tailwind CSS
- ✅ Dark/light mode support
- ✅ Hero section with smooth scrolling
- ✅ Projects showcase section
- ✅ TypeScript strict mode
- ✅ Server/Client component architecture

### Planned Features

- 🔄 Convex backend integration
- 🔄 Clerk authentication
- 🔄 Contact form with database storage
- 🔄 Protected `/toolkit` route with utilities:
  - JSON Formatter
  - Color Picker & Converter
  - Lorem Ipsum Generator
- 🔄 Project portfolio with real data
- 🔄 Blog functionality (optional)

## 📝 Development Guidelines

### Architecture Patterns

- **Server Components** by default (for static content, data fetching)
- **Client Components** only when needed (`"use client"` for interactivity)
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Import aliases: `@/components`, `@/lib`, `@/ui`

### Component Organization

- Page sections → `src/components/views/`
- Reusable UI → `src/components/ui/` (shadcn/ui managed)
- Layout components → `src/components/layout/`
- Providers → `src/components/providers/`

### Styling Approach

- Tailwind CSS v4 with CSS variables
- Component variants via class-variance-authority
- Responsive design with mobile-first approach
- Semantic HTML with accessibility in mind

### Data Patterns (Future)

- Convex `useQuery` for data fetching
- Convex `useMutation` for form submissions
- Real-time updates via Convex subscriptions

## 🚀 Deployment

1. **Environment Setup:**

   ```bash
   cp .env.example .env.local
   # Add your Convex and Clerk environment variables
   ```

2. **Vercel Deployment:**
   - Push to GitHub repository
   - Connect to Vercel
   - Add environment variables in Vercel dashboard
   - Auto-deploy on push to main branch

## 📚 Documentation

- [`website-plan.md`](./website-plan.md) - Detailed project specifications
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) - AI development guidelines
- [`.github/instructions/`](./.github/instructions/) - Development standards

## 🔧 Environment Variables

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
CONVEX_DEPLOYMENT=your-deployment-name

# Clerk (future)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret
```

## 🎨 Design System

- **Colors:** Slate color scheme with CSS variables
- **Typography:** Geist font family (sans & mono)
- **Components:** shadcn/ui with "new-york" style
- **Icons:** lucide-react icon library
- **Animations:** Subtle Framer Motion transitions

## 📄 License

This project is personal and proprietary.

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
