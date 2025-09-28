import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get all projects
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

// Query to get featured projects (non-fork, has description, recent activity)
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    
    return projects
      .filter(project => 
        !project.fork && 
        project.description && 
        project.stargazers_count >= 0
      )
      .sort((a, b) => {
        // Sort by stars first, then by recent activity
        if (b.stargazers_count !== a.stargazers_count) {
          return b.stargazers_count - a.stargazers_count;
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
      .slice(0, 6); // Get top 6 projects
  },
});

// Mutation to sync projects from GitHub API
export const syncFromGitHub = mutation({
  args: {
    username: v.string(),
    projects: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        html_url: v.string(),
        homepage: v.optional(v.string()),
        language: v.optional(v.string()),
        topics: v.array(v.string()),
        stargazers_count: v.number(),
        forks_count: v.number(),
        updated_at: v.string(),
        created_at: v.string(),
        private: v.boolean(),
        fork: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Enforce authentication & ownership (defense-in-depth beyond UI gating)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID;
    if (ownerId && identity.subject !== ownerId) {
      throw new Error("Forbidden: not owner");
    }

    // Basic sanity check: limit bulk inserts
    if (args.projects.length > 300) {
      throw new Error("Too many projects to sync in one request");
    }

    // Replace existing set atomically (best-effort simple approach)
    const existing = await ctx.db.query("projects").collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    let inserted = 0;
    for (const project of args.projects) {
      await ctx.db.insert("projects", project);
      inserted++;
    }
    // Audit log
    await ctx.db.insert('auditLogs', {
      actor: identity.subject,
      action: 'github.sync',
      target: args.username,
      count: inserted,
      status: 'success',
      created_at: new Date().toISOString(),
    });
    return { success: true, count: inserted };
  },
});