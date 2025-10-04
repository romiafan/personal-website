import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Insert an audit log entry
export const insert = mutation({
  args: {
    actor: v.string(),
    action: v.string(),
    target: v.optional(v.string()),
    count: v.optional(v.number()),
    status: v.string(),
    message: v.optional(v.string()),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", args);
  },
});

// Paginated fetch of audit logs with optional filters on action and status.
// Uses the by_action_time index when action filter provided, else full scan (acceptable for low volume; optimize later).
export const list = query({
  args: {
    action: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()), // ISO date cursor (created_at) for pagination
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const afterTime = args.cursor; // fetch records older than this time
    type Audit = {
      _id: string;
      actor: string; action: string; target?: string; count?: number; status: string; message?: string; created_at: string;
    };
    let results: Audit[];
    if (args.action) {
      const action = args.action; // narrowed
      const q = ctx.db.query('auditLogs').withIndex('by_action_time', x => x.eq('action', action));
      results = await q.collect() as Audit[];
    } else {
      results = await ctx.db.query('auditLogs').collect() as Audit[];
    }
    results.sort((a,b) => b.created_at.localeCompare(a.created_at));
    if (afterTime) {
      results = results.filter(r => r.created_at < afterTime);
    }
    if (args.status) {
      results = results.filter(r => r.status === args.status);
    }
    const page = results.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length-1].created_at : null;
    return { items: page, nextCursor };
  }
});
