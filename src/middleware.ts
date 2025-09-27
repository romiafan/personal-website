import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Only protect toolkit (and future owner routes) when Clerk is configured.
// If keys are missing, middleware still runs but will allow public access.
const isProtectedRoute = createRouteMatcher([
  '/toolkit(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // If Clerk isn't configured (no publishable key), skip enforcement.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return; // Allow through without auth
  }

  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Run middleware for toolkit and root path (minimal scope to reduce overhead)
    '/toolkit/:path*',
  ],
};