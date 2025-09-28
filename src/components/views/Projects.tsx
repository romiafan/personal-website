"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { ProjectCard } from "./ProjectCard";
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

  return (
    <section id="projects" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-col items-center justify-center space-y-8 text-center"
        >
          <motion.div variants={fadeInUp} className="space-y-2 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">My Projects</h2>
            <p className="text-gray-500 md:text-lg dark:text-gray-400">
              A selection of repositories and experiments. Synced from Convex storage.
            </p>
            {ownerId && (
              <div className="pt-2">
                <button
                  onClick={handleSync}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-colors"
                >
                  Sync from GitHub
                </button>
              </div>
            )}
          </motion.div>
          <div className="w-full max-w-5xl min-h-[120px]">
            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-40 rounded-lg border bg-background" />
                ))}
              </div>
            )}
            {empty && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No projects stored yet. Populate via the sync mutation.
              </div>
            )}
            {!loading && !empty && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(projects ?? []).map((project: ProjectDoc) => (
                  <ProjectCard
                    key={project._id}
                    id={project._id}
                    name={project.name}
                    description={project.description}
                    language={project.language}
                    topics={project.topics}
                    stars={project.stargazers_count}
                    forks={project.forks_count}
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