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

// Enhanced query with pagination, filtering, and search
export const getWithFilters = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    language: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    sortBy: v.optional(v.union(v.literal("updated"), v.literal("stars"), v.literal("name"))),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    excludeForks: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const {
      limit = 12,
      offset = 0,
      language,
      searchTerm,
      sortBy = "updated",
      sortOrder = "desc",
      excludeForks = true,
    } = args;

    // Get all projects first
    let projects = await ctx.db.query("projects").collect();

    // Apply filters
    if (excludeForks) {
      projects = projects.filter(p => !p.fork);
    }

    if (language) {
      projects = projects.filter(p => 
        p.language?.toLowerCase() === language.toLowerCase()
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        p.topics.some(topic => topic.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    projects.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "stars":
          comparison = a.stargazers_count - b.stargazers_count;
          break;
        case "updated":
        default:
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Calculate pagination
    const total = projects.length;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    const paginatedProjects = projects.slice(offset, offset + limit);

    return {
      projects: paginatedProjects,
      pagination: {
        total,
        totalPages,
        currentPage: Math.floor(offset / limit) + 1,
        hasMore,
        limit,
        offset,
      },
      filters: {
        language,
        searchTerm,
        sortBy,
        sortOrder,
        excludeForks,
      },
    };
  },
});

// Query to get unique languages for filter options
export const getLanguages = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    
    const languages = projects
      .filter(p => p.language && !p.fork)
      .map(p => p.language!)
      .filter((lang, index, arr) => arr.indexOf(lang) === index)
      .sort();

    return languages;
  },
});

// Query to get project statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    
    const nonForkProjects = projects.filter(p => !p.fork);
    const totalStars = nonForkProjects.reduce((sum, p) => sum + p.stargazers_count, 0);
    const totalForks = nonForkProjects.reduce((sum, p) => sum + p.forks_count, 0);
    
    const languageStats = nonForkProjects.reduce((acc, p) => {
      if (p.language) {
        acc[p.language] = (acc[p.language] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProjects: nonForkProjects.length,
      totalStars,
      totalForks,
      languages: Object.keys(languageStats).length,
      topLanguages: Object.entries(languageStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([lang, count]) => ({ language: lang, count })),
    };
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
    // Fetch strategy:
    // 1. If token present: use authenticated /user/repos to include owner, collaborator, org repos (public + private) then filter.
    // 2. Else fallback to public only /users/:username/repos.
    let endpoint: string;
    if (token) {
      // affiliation can be owner,collaborator,organization_member; pick owner + member for now to avoid huge lists.
      endpoint = `https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,organization_member`;
    } else {
      endpoint = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;
    }

    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub fetch failed: ${res.status} ${text.slice(0,200)}`);
    }
    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error('Unexpected GitHub response');

    // Normalize (limit to repos owned by the username OR explicitly allow when token path used)
    const normalized = raw.map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      owner: r.owner?.login || undefined,
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

    // Keep only repos actually owned by the specified username (case-insensitive).
    const owned = normalized.filter(p => (p.owner || '').toLowerCase() === username.toLowerCase());

    // Exclude private repos from public listing.
    let projects = owned.filter(p => !p.private).map(p => ({
      name: p.name,
      description: p.description,
      html_url: p.html_url,
      homepage: p.homepage,
      language: p.language,
      topics: p.topics,
      stargazers_count: p.stargazers_count,
      forks_count: p.forks_count,
      updated_at: p.updated_at,
      created_at: p.created_at,
      private: p.private,
      fork: p.fork,
    }));

    // Fallback: if suspiciously low count (<=1) but raw normalized has more public repos, include those
    if (projects.length <= 1) {
      const publicNonPrivate = normalized.filter(p => !p.private).map(p => ({
        name: p.name,
        description: p.description,
        html_url: p.html_url,
        homepage: p.homepage,
        language: p.language,
        topics: p.topics,
        stargazers_count: p.stargazers_count,
        forks_count: p.forks_count,
        updated_at: p.updated_at,
        created_at: p.created_at,
        private: p.private,
        fork: p.fork,
      }));
      if (publicNonPrivate.length > projects.length) {
        projects = publicNonPrivate;
      }
    }

    if (projects.length > 300) throw new Error('Too many repositories returned (limit 300)');

    // Safety guard against accidental truncation: if existing > 5 and new <= 1, abort.
  // Actions cannot access db directly; use runQuery.
  const existing = await ctx.runQuery(api.projects.get);
    if (existing.length > 5 && projects.length <= 1) {
      throw new Error(`Aborting sync: suspicious low repo count (existing ${existing.length} -> new ${projects.length}).`);
    }

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