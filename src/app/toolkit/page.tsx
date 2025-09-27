import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ToolkitPage() {
  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let user = null;
  if (clerkEnabled) {
    // Only attempt Clerk call if middleware + keys are configured
    try {
      user = await currentUser();
    } catch {
      // If middleware not present yet, allow rendering but mark unauthenticated
      user = null;
    }
    if (!user) {
      redirect('/');
    }
  }

  return (
    <div className="container py-12 px-4 md:px-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Toolkit</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-2xl">Internal utilities (JSON formatter, color tools, lorem ipsum) coming soon.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder tool cards */}
        <div className="rounded-lg border bg-background p-4">
          <h2 className="font-semibold mb-1">JSON Formatter</h2>
          <p className="text-sm text-muted-foreground">Format and validate JSON payloads.</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <h2 className="font-semibold mb-1">Color Picker</h2>
          <p className="text-sm text-muted-foreground">Select and convert color values.</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <h2 className="font-semibold mb-1">Lorem Ipsum</h2>
          <p className="text-sm text-muted-foreground">Generate placeholder text.</p>
        </div>
      </div>
    </div>
  );
}
