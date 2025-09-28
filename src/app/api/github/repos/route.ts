import { NextResponse } from 'next/server';
import { githubService } from '@/lib/github';

// Slim repo type for client sync usage
interface SlimRepo {
  name: string;
  description?: string;
  html_url: string;
  homepage?: string;
  language?: string;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  private: boolean;
  fork: boolean;
}

// Basic in-memory caches (ephemeral – fine for single-region edge/dev)
// Rate limit store: key = ip, value timestamps array
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP (adjust as needed)
const rateStore: Record<string, number[]> = {};

// Repo cache: key = username, value { data, expires }
interface CacheEntry { data: SlimRepo[]; expires: number }
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const repoCache: Record<string, CacheEntry> = {};

function getIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRate(ip: string): boolean {
  const now = Date.now();
  const arr = (rateStore[ip] = (rateStore[ip] || []).filter(ts => now - ts < RATE_LIMIT_WINDOW_MS));
  if (arr.length >= RATE_LIMIT_MAX) return false;
  arr.push(now);
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || 'romiafan';
  const ip = getIp(request);

  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } });
  }
  try {
    // Cache lookup
    const cached = repoCache[username];
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ repos: cached.data, cached: true });
    }

    const repos = await githubService.getPublicRepositories(username);
    const slim: SlimRepo[] = repos.map(r => ({
      name: r.name,
      description: r.description ?? undefined,
      html_url: r.html_url,
      homepage: r.homepage || undefined,
      language: r.language || undefined,
      topics: r.topics ?? [],
      stargazers_count: r.stargazers_count ?? 0,
      forks_count: r.forks_count ?? 0,
      updated_at: r.updated_at,
      created_at: r.created_at,
      private: r.private,
      fork: r.fork,
    }));
    repoCache[username] = { data: slim, expires: Date.now() + CACHE_TTL_MS };
    return NextResponse.json({ repos: slim, cached: false });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
