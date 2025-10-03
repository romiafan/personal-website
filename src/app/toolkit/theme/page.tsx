import { ThemeTokensPanel } from "@/components/views/tools/ThemeTokensPanel";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ThemeTokensPage() {
  const user = await currentUser();
  const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID;
  if (!user || !ownerId || user.id !== ownerId) {
    redirect("/");
  }
  return <ThemeTokensPanel />;
}
