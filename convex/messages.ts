import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Simple fixed-window rate limit: 5 submissions / 10 minutes per email.
// NOTE: IP-based limiting could be layered later; emails can be spoofed so treat as light abuse prevention only.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const WINDOW_MAX = 5;

// Email notification configuration
const NOTIFICATION_EMAIL = "romiafan@gmail.com"; // Replace with your email
const FROM_EMAIL = "noreply@romiafan.com"; // Replace with your domain email

async function sendEmailNotification(args: {
  name: string;
  email: string;
  message: string;
}) {
  // Skip email sending if no API key is configured
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  try {
    // Dynamic import to avoid bundling Resend in client code
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const emailContent = `
New Contact Form Submission

From: ${args.name} <${args.email}>
Submitted: ${new Date().toLocaleString()}

Message:
${args.message}

---
This message was sent via the contact form on your personal website.
You can reply directly to this email to respond to ${args.name}.
    `.trim();

    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `New Contact: ${args.name}`,
      text: emailContent,
      replyTo: args.email, // Allow direct replies to the sender
    });

    console.log("Email notification sent successfully");
  } catch (error) {
    // Log error but don't fail the mutation - email is a nice-to-have
    console.error("Failed to send email notification:", error);
  }
}

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

    // Send email notification asynchronously (don't await to avoid blocking the response)
    sendEmailNotification(args).catch((error) => {
      console.error("Email notification failed:", error);
    });

    return { id: messageId } as const;
  },
});