# Instruction MD for AI Code Assistant: Personal Branding & Toolkit Website

## Guiding Principles for the AI Assistant

- **Strict Stack Adherence:**
  The technology stack defined in Section 2 is mandatory. Do not substitute technologies (e.g., do not use plain JavaScript where TypeScript is specified) or use different major versions than those requested. If a specified version is pre-release (e.g., Tailwind CSS v4), use the latest available official version and clearly note this in your implementation comments.

- **No Unrequested Technologies:**
  Do not introduce any libraries, frameworks, or tools not explicitly listed in the stack without asking for permission first.

- **Clarity Over Assumption:**
  If any part of this instruction is unclear or seems contradictory, ask for clarification before generating code.

---

## 1. Project Overview

The goal is to build a high-performance, modern personal website for a software engineer. This website will serve as a digital resume, portfolio, and a personal "toolkit" of useful web-based utilities. It must be visually appealing, fast, and built on a modern, full-stack TypeScript architecture.

---

## 2. Core Technology Stack

This project will be built exclusively using the following technologies. **Adherence is not optional.** Before generating any code, confirm that you will use the exact stack listed below.

- **Framework:** Next.js 14+ (using the App Router)
- **Language:** TypeScript
- **Package Manager:** pnpm (all commands must use pnpm)
- **Bundler:** Turbopack (enabled via the `next dev --turbo` command)
- **Backend & Database:** Convex for real-time data persistence, serverless functions, and cron jobs
- **Authentication:** Clerk for user authentication, integrated with Convex
- **Styling:** Tailwind CSS for all styling
- **UI Components:** shadcn/ui for the base component library (add components as needed via its CLI)
- **Icons:** lucide-react
- **Animations:** Framer Motion for page transitions and micro-interactions
- **Deployment:** Vercel

---

## 3. Project Setup & Initialization

**Follow these steps to initialize the project:**

1. **Create Next.js App:**

   ```sh
   pnpm create next-app@latest personal-website --typescript --tailwind --eslint --app --src-dir --import-alias="@/*"
   ```

2. **Initialize Convex:**

   ```sh
   cd personal-website
   pnpm dlx convex init
   ```

3. **Initialize shadcn/ui:**

   ```sh
   pnpm dlx shadcn-ui@latest init
   ```

   - **Configuration:**
     - Default style
     - Slate color
     - Use CSS Variables: Yes
     - `tailwind.config.ts` path: `src/tailwind.config.ts` (or default if not using src)
     - Import Alias: `@/*`
     - `utils.ts` path: `@/lib/utils`
     - React Server Components: Yes

4. **Install Additional Dependencies:**

   ```sh
   pnpm install framer-motion lucide-react
   ```

---

## 4. High-Level File Structure

```text
/personal-website
|-- /convex/              # Convex functions and schema
|   |-- schema.ts
|   |-- messages.ts
|   |-- projects.ts
|   |-- http.ts
|-- /public/              # Static assets (images, favicon)
|-- /src/
|   |-- /app/             # Next.js App Router pages
|   |   |-- /api/         # API routes (if needed)
|   |   |-- /toolkit/     # Folder for toolkit pages
|   |   |-- layout.tsx    # Root layout
|   |   |-- page.tsx      # Home page
|   |-- /components/      # Reusable components
|   |   |-- /layout/      # Layout components (Navbar, Footer)
|   |   |-- /ui/          # shadcn/ui components
|   |   |-- /views/       # Page-specific sections (Hero, About, Projects)
|   |-- /lib/             # Helper functions and utilities
|   |   |-- convex.ts     # Convex client setup
|   |   |-- utils.ts      # shadcn/ui utility functions
|-- .env.local            # Environment variables
|-- next.config.mjs
|-- postcss.config.js
|-- tailwind.config.ts
|-- tsconfig.json
```

---

## 5. Page & Component Breakdown

### 5.1. Layout

- **`src/app/layout.tsx`:** The root layout. It should include:
  - The ConvexClientProvider
  - Clerk's `<ClerkProvider>`
  - A main font (e.g., Inter from next/font/google)
  - The Navbar and Footer components
  - A ThemeProvider for light/dark mode

- **Navbar (`/components/layout/Navbar.tsx`):**
  - Sticky header
  - Logo/Name on the left
  - Navigation links (Home, About, Projects, Toolkit, Contact)
  - Light/Dark mode toggle button
  - Clerk UserButton (displays avatar if logged in, or a "Sign In" button)

- **Footer (`/components/layout/Footer.tsx`):**
  - Social media links (GitHub, LinkedIn, Twitter)
  - Copyright notice

---

### 5.2. Home Page (`/app/page.tsx`)

This page is composed of several sections. Create each section as a separate component in `/components/views/`.

- **Hero Section (`Hero.tsx`):**
  - Large, bold heading (e.g., "Hi, I'm [Your Name]")
  - Subheading describing your role (e.g., "Full-Stack Engineer & Creative Technologist")
  - A brief, engaging bio paragraph
  - Call-to-action buttons: "View Projects" and "Contact Me"
  - Use Framer Motion for subtle text and button animations on load

- **About Section (`About.tsx`):**
  - A more detailed description of your background, passion, and expertise
  - Can include a professional photo

- **Tech Stack Section (`TechStack.tsx`):**
  - A grid of logos or icons representing the technologies you are proficient in (React, TypeScript, Node.js, etc.)

- **Projects Section (`Projects.tsx`):**
  - Fetches project data from Convex using `useQuery`
  - Displays projects in a responsive grid of cards (`ProjectCard.tsx`)
  - Each card should contain: Project Image, Title, Short Description, Tech Tags, and links to GitHub/Live Demo

- **Contact Section (`Contact.tsx`):**
  - A simple and clean contact form with fields: Name, Email, Message
  - On submit, it will use a Convex `useMutation` to save the message to the database
  - Display a success/error message upon submission

---

### 5.3. Toolkit Page (`/app/toolkit/page.tsx`)

- This page will be a dashboard of small, useful web tools.
- Protect this route with Clerk, so only you (the signed-in user) can access it.
- **Example Tools (as components):**
  - **JSON Formatter:** A text area to paste JSON and a button to format it
  - **Color Picker & Converter:** A tool to pick a color and see its HEX, RGB, and HSL values
  - **Lorem Ipsum Generator:** Generate placeholder text

---

## 6. Convex Backend (in `/convex/`)

### 6.1. Schema (`schema.ts`)

Define the database schema with two tables:

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    projects: defineTable({
        title: v.string(),
        description: v.string(),
        tags: v.array(v.string()),
        imageUrl: v.string(),
        githubUrl: v.optional(v.string()),
        liveUrl: v.optional(v.string()),
    }),
    messages: defineTable({
        name: v.string(),
        email: v.string(),
        message: v.string(),
    }).searchIndex("by_email", { searchField: "email" }),
});
```

### 6.2. Queries & Mutations

- **`projects.ts`:**
  - `get`: A query function to fetch all documents from the projects table

- **`messages.ts`:**
  - `send`: A mutation that takes name, email, and message and inserts a new document into the messages table

---

## 7. Final Polish & Deployment

- **Responsiveness:** Ensure the entire website is fully responsive and looks great on mobile, tablet, and desktop devices.
- **Animations:** Use Framer Motion for page transitions when navigating and for subtle hover/focus effects on interactive elements.
- **SEO:** Use Next.js metadata API in layouts and pages to set appropriate titles and descriptions.
- **Deployment:**
  - Push the project to a GitHub repository.
  - Create a new project on Vercel and link the repository.
  - Add the Convex and Clerk environment variables (`.env.local`) to the Vercel project settings.
  - Vercel will automatically deploy on every push to the main branch.
