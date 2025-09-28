"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { ProjectCard } from "./ProjectCard";
import { FeaturedProject } from './FeaturedProject';
import { useToast } from "@/components/providers/toast-provider";

interface ProjectDoc {
  _id: Id<"projects">;
  _creationTime: number;
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

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  private: boolean;
  fork: boolean;
}

export function Projects() {
  const projects = useQuery(api.projects.get);
  const sync = useMutation(api.projects.syncFromGitHub);
  const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID; // Exposed via build-time
  const { push } = useToast();

  async function handleSync() {
    // Placeholder: client-side fetch of public GitHub repos (unauthenticated)
    try {
  const username = "romiafan"; // Hard-coded for now – future: derive from config or metadata
  const res = await fetch(`/api/github/repos?username=${username}`);
      if (!res.ok) throw new Error("GitHub API error");
  const data = await res.json();

      // Map to mutation shape
  const mapped = (data.repos as GitHubRepo[]).map((r) => ({
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

      await sync({ username: username, projects: mapped });
      push({
        title: 'Sync Complete',
        description: `Imported ${mapped.length} repositories`,
        variant: 'success'
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      push({
        title: 'Sync Failed',
        description: message,
        variant: 'error'
      });
    }
  }

  const loading = projects === undefined;
  const empty = !loading && projects && projects.length === 0;

  // Determine a featured project (first sorted by stars / updated_at locally for now)
  let featured: ProjectDoc | undefined;
  let rest: ProjectDoc[] = [];
  if (!loading && projects && projects.length) {
    const sorted = [...projects].sort((a,b) => {
      if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    featured = sorted[0];
    rest = sorted.slice(1);
  }

  return (
    <section id="projects" className="w-full py-16 md:py-28 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        {/* JSON-LD structured data for the featured project (SEO) */}
        {featured && (
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SoftwareSourceCode',
                name: featured.name,
                description: featured.description || undefined,
                codeRepository: featured.html_url,
                url: featured.homepage || featured.html_url,
                programmingLanguage: featured.language || undefined,
                keywords: featured.topics && featured.topics.length ? featured.topics : undefined,
                dateCreated: featured.created_at,
                dateModified: featured.updated_at,
                aggregateRating: featured.stargazers_count > 0 ? {
                  '@type': 'AggregateRating',
                  ratingCount: featured.stargazers_count,
                  ratingValue: featured.stargazers_count, // GitHub stars as a proxy metric
                } : undefined,
                forkCount: featured.forks_count || undefined,
                isAccessibleForFree: true,
              }, null, 0),
            }}
          />
        )}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="flex flex-col space-y-12"
        >
          <motion.div variants={fadeInUp} className="flex flex-col gap-4 text-center items-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Projects</h2>
            <p className="text-gray-500 md:text-lg dark:text-gray-400 max-w-2xl">Selected engineering work, experiments, and tools. Continuously synced from GitHub into Convex storage.</p>
            {ownerId && (
              <div className="pt-1">
                <button
                  onClick={handleSync}
                  className="inline-flex items-center gap-1 rounded-md border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-colors"
                >
                  <span>Refresh from GitHub</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Featured */}
          <div className="max-w-5xl mx-auto w-full">
            {loading && (
              <div className="h-64 w-full animate-pulse rounded-xl border bg-background" />
            )}
            {!loading && featured && (
              <FeaturedProject
                name={featured.name}
                description={featured.description}
                html_url={featured.html_url}
                homepage={featured.homepage}
                stars={featured.stargazers_count}
                forks={featured.forks_count}
                topics={featured.topics}
                language={featured.language}
                updated_at={featured.updated_at}
              />
            )}
            {!loading && !featured && empty && (
              <div className="text-sm text-muted-foreground">No projects available yet.</div>
            )}
          </div>

          {/* Grid */}
          <div className="max-w-5xl mx-auto w-full space-y-6">
            {!loading && rest.length > 0 && (
              <h3 className="text-lg font-semibold tracking-tight">More Projects</h3>
            )}
            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-44 rounded-lg border bg-background" />
                ))}
              </div>
            )}
            {!loading && rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map(project => (
                  <ProjectCard
                    key={project._id}
                    id={project._id}
                    name={project.name}
                    description={project.description}
                    language={project.language}
                    topics={project.topics}
                    stars={project.stargazers_count}
                    forks={project.forks_count}
                    updated_at={project.updated_at}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}