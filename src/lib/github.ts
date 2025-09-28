// Ensure this module is only used on the server (avoid leaking any potential tokens)
import 'server-only';

// GitHub API types
export interface GitHubRepo {
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
}

export interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

// GitHub API service
export class GitHubService {
  private static readonly BASE_URL = 'https://api.github.com';
  private readonly token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'personal-website'
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const response = await fetch(`${GitHubService.BASE_URL}${endpoint}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUser(username: string): Promise<GitHubUser> {
    return this.request<GitHubUser>(`/users/${username}`);
  }

  async getRepositories(username: string): Promise<GitHubRepo[]> {
    const repos = await this.request<GitHubRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`);
    return repos;
  }

  async getPublicRepositories(username: string): Promise<GitHubRepo[]> {
    const repos = await this.getRepositories(username);
    return repos.filter(repo => !repo.private);
  }
}

// Default GitHub service instance
export const githubService = new GitHubService(process.env.GITHUB_TOKEN);