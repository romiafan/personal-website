import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Simple fixed-window rate limit: 5 submissions / 10 minutes per email.
// NOTE: IP-based limiting could be layered later; emails can be spoofed so treat as light abuse prevention only.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const WINDOW_MAX = 5;

export const send = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const key = args.email.toLowerCase();

    // Fetch existing rate limit record (at most one) by key.
    const existing = await ctx.db
      .query("contactRateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      const currentWindowStart = existing.window_start;
      let count = existing.count;
      // If record window is older than our fresh window, reset.
      if (currentWindowStart < windowStart) {
        count = 0;
      }
      if (count >= WINDOW_MAX && currentWindowStart >= windowStart) {
        return {
          error: {
            code: "RATE_LIMIT",
            retry_after_ms: existing.window_start + WINDOW_MS - now,
            message: `Too many messages. Please wait a few minutes and try again.`,
          },
        } as const;
      }
      // Update record
      await ctx.db.patch(existing._id, {
        count: count + 1,
        window_start: currentWindowStart < windowStart ? now : currentWindowStart,
        last_attempt: now,
      });
    } else {
      await ctx.db.insert("contactRateLimits", {
        key,
        window_start: now,
        count: 1,
        last_attempt: now,
      });
    }

    const messageId = await ctx.db.insert("messages", {
      name: args.name,
      email: args.email,
      message: args.message,
      created_at: new Date().toISOString(),
    });

    return { id: messageId } as const;
  },
});