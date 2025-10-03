import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { JsonTools } from "@/components/views/tools/JsonTools";
import { ColorTool } from "@/components/views/tools/ColorTool";
import { LoremIpsumTool } from "@/components/views/tools/LoremIpsum";
import { UuidGeneratorTool } from "@/components/views/tools/UuidGenerator";
import { TimestampConverter } from "@/components/views/tools/TimestampConverter";
import { CodecTool } from "@/components/views/tools/CodecTool";
import { RegexTester } from "@/components/views/tools/RegexTester";
import { JsonToTsInterfaceTool } from "@/components/views/tools/JsonToTsInterface";
import { JwtDecoder } from "@/components/views/tools/JwtDecoder";
import { ColorPaletteExtractor } from "@/components/views/tools/ColorPaletteExtractor";
import { TextDiffTool } from "@/components/views/tools/TextDiffTool";
import { MarkdownPreviewTool } from "@/components/views/tools/MarkdownPreviewTool";
import { CaseConverterTool } from "@/components/views/tools/CaseConverterTool";
import { AuditLogViewer } from "@/components/views/tools/AuditLogViewer";
import { ThemeTokenPanel } from "@/components/views/tools/ThemeTokenPanel";

// Server Component (default) – owner protected route
export default async function ToolkitPage() {
  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID;

  if (clerkEnabled) {
    let user = null;
    try {
      user = await currentUser();
    } catch {
      // Swallow errors when Clerk middleware not fully configured yet
      user = null;
    }

    // If not signed in, redirect away
    if (!user) {
      redirect("/");
    }

    // If an owner id is configured, enforce it strictly
    if (ownerId && user.id !== ownerId) {
      redirect("/");
    }
  } else {
    // If Clerk not enabled at all, never expose toolkit publicly
    redirect("/");
  }

  return (
    <div className="container py-12 px-4 md:px-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Toolkit</h1>
      <p className="text-muted-foreground max-w-2xl">
        Internal utilities (JSON formatting & CSV, JSON→TS, JWT decode, palette
        extraction, UUIDs, timestamps, encoding, regex, text diff, markdown
        preview, case conversion, audit logs, color, lorem ipsum, theme tokens).
        More coming soon.
      </p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border bg-background p-4">
            <JsonTools />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <JsonToTsInterfaceTool />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <ThemeTokenPanel />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border bg-background p-4">
            <UuidGeneratorTool />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <TimestampConverter />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <CodecTool />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <RegexTester />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <JwtDecoder />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <ColorPaletteExtractor />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <TextDiffTool />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <MarkdownPreviewTool />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <CaseConverterTool />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <AuditLogViewer />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <ColorTool />
          </div>
          <div className="rounded-lg border bg-background p-4">
            <LoremIpsumTool />
          </div>
        </div>
      </div>
    </div>
  );
}
