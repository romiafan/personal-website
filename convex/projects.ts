import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
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
      throw new Error("Unauthorized: missing authentication (sign in required)");
    }
    const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID;
    if (ownerId && identity.subject !== ownerId) {
      throw new Error("Forbidden: not owner (only site owner can sync)");
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

// Action: server-side fetch from GitHub (preferred sync path)
export const syncViaGithub = action({
  args: { username: v.string() },
  handler: async (ctx, { username }): Promise<{ count: number; success?: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized: sign in required');
    const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID;
    if (ownerId && identity.subject !== ownerId) throw new Error('Forbidden: not owner');

    const token = process.env.GITHUB_TOKEN; // should be set in .env (non-public)
    const headers: Record<string,string> = { 'Accept': 'application/vnd.github+json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['X-GitHub-Api-Version'] = '2022-11-28';
    }

    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub fetch failed: ${res.status} ${text.slice(0,200)}`);
    }
    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error('Unexpected GitHub response');

    // Normalize
    const projects = raw.map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      name: r.name,
      description: r.description ?? undefined,
      html_url: r.html_url,
      homepage: r.homepage || undefined,
      language: r.language || undefined,
      topics: r.topics || [],
      stargazers_count: r.stargazers_count ?? 0,
      forks_count: r.forks_count ?? 0,
      updated_at: r.updated_at,
      created_at: r.created_at,
      private: !!r.private,
      fork: !!r.fork,
    }));

    if (projects.length > 300) {
      throw new Error('Too many repositories returned (limit 300)');
    }

    // Reuse existing mutation to persist normalized list atomically
    const result = await ctx.runMutation(api.projects.syncFromGitHub, { username, projects });
    return result as { count: number; success?: boolean };
  }
});

// Query: last sync timestamp
export const getLastSync = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query('auditLogs').collect();
    const last = logs
      .filter(l => l.action === 'github.sync')
      .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    if (!last) return null;
    return { created_at: last.created_at, count: last.count };
  }
});