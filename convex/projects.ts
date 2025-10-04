import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Define types for GitHub API responses
type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  private: boolean;
  fork: boolean;
  owner: {
    login: string;
  } | null;
};

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
    // Authentication and authorization checks
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: sign in required');
    }
    
    const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID;
    if (ownerId && identity.subject !== ownerId) {
      throw new Error('Forbidden: not owner');
    }

    // Get GitHub token from environment
    const token = process.env.GITHUB_TOKEN;
    if (!token || token === 'placeholder_token_here') {
      throw new Error('GitHub token not configured. Please set GITHUB_TOKEN environment variable.');
    }

    // Prepare headers for authenticated GitHub API request
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'personal-website/1.0'
    };

    try {
      // Use authenticated endpoint to get better rate limits and access to more repos
      const endpoint = `https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,organization_member&type=all`;
      
      const res = await fetch(endpoint, { headers });
      
      // Handle rate limiting
      if (res.status === 403) {
        const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
        const rateLimitReset = res.headers.get('x-ratelimit-reset');
        if (rateLimitRemaining === '0') {
          const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : 'unknown';
          throw new Error(`GitHub API rate limit exceeded. Resets at: ${resetTime}`);
        }
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}. ${errorText.slice(0, 200)}`);
      }

      const repos = await res.json();
      if (!Array.isArray(repos)) {
        throw new Error('Unexpected GitHub API response format');
      }

      // Filter and normalize repository data
      const normalizedRepos = (repos as GitHubRepo[])
        .filter((repo: GitHubRepo) => {
          // Only include repos owned by the specified username (case-insensitive)
          return repo.owner?.login?.toLowerCase() === username.toLowerCase() && 
                 !repo.private; // Exclude private repos from public display
        })
        .map((repo: GitHubRepo) => ({
          name: repo.name,
          description: repo.description ?? undefined,
          html_url: repo.html_url,
          homepage: repo.homepage || undefined,
          language: repo.language || undefined,
          topics: repo.topics || [],
          stargazers_count: repo.stargazers_count ?? 0,
          forks_count: repo.forks_count ?? 0,
          updated_at: repo.updated_at,
          created_at: repo.created_at,
          private: false, // We already filtered out private repos
          fork: !!repo.fork,
        }));

      // Safety validations
      if (normalizedRepos.length > 300) {
        throw new Error('Too many repositories returned (limit 300)');
      }

      // Check for suspicious low count that might indicate API issues
      const existing = await ctx.runQuery(api.projects.get);
      if (existing.length > 5 && normalizedRepos.length <= 1) {
        throw new Error(
          `Aborting sync: suspicious low repo count (existing ${existing.length} -> new ${normalizedRepos.length}). This might indicate an API issue.`
        );
      }

      // Perform the sync using the existing mutation
      const result = await ctx.runMutation(api.projects.syncFromGitHub, { 
        username, 
        projects: normalizedRepos 
      });

      // Log successful sync
      console.log(`GitHub sync successful: ${normalizedRepos.length} repositories synced for ${username}`);
      
      return { 
        count: result.count, 
        success: true 
      };

    } catch (error) {
      // Enhanced error logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`GitHub sync failed for ${username}:`, errorMessage);
      
      // Log failed sync attempt
      try {
        await ctx.runMutation(api.auditLogs.insert, {
          actor: identity.subject,
          action: 'github.sync',
          target: username,
          count: 0,
          status: 'error',
          message: errorMessage,
          created_at: new Date().toISOString(),
        });
      } catch (logError) {
        console.error('Failed to log sync error:', logError);
      }
      
      // Re-throw with user-friendly message
      if (errorMessage.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        throw new Error('GitHub authentication failed. Please check the API token configuration.');
      } else if (errorMessage.includes('404')) {
        throw new Error(`GitHub user "${username}" not found or repositories are not accessible.`);
      } else {
        throw new Error(`Sync failed: ${errorMessage}`);
      }
    }
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