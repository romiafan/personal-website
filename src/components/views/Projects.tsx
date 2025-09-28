"use client";

import { useQuery, useAction } from "convex/react";
import * as React from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { ProjectCard } from "./ProjectCard";
import { FeaturedProject } from "./FeaturedProject";
import { useToast } from "@/components/providers/toast-provider";
import { relativeTime } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

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

export function Projects() {
  const projects = useQuery(api.projects.get);
  const lastSync = useQuery(api.projects.getLastSync);
  const syncViaGithub = useAction(api.projects.syncViaGithub);
  const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID; // Exposed via build-time
  const { push } = useToast();
  const { user } = useUser();

  const isOwner = !!ownerId && user?.id === ownerId;

  const [syncing, setSyncing] = React.useState(false);
  const [lastLocalSyncAt, setLastLocalSyncAt] = React.useState<number | null>(
    null
  );
  const COOLDOWN_MS = 60_000; // 60s cooldown
  const now = Date.now();
  const inCooldown =
    lastLocalSyncAt !== null && now - lastLocalSyncAt < COOLDOWN_MS;
  const cooldownRemaining = inCooldown
    ? Math.ceil((COOLDOWN_MS - (now - lastLocalSyncAt)) / 1000)
    : 0;
  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const username = "romiafan"; // TODO: externalize to config/constant
      const result = await syncViaGithub({ username });
      setLastLocalSyncAt(Date.now());
      push({
        title: "Sync Complete",
        description: `Imported ${result?.count ?? 0} repositories`,
        variant: "success",
      });
    } catch (e: unknown) {
      let message = e instanceof Error ? e.message : "Unknown error";
      if (/Unauthorized/i.test(message)) {
        message = "You must be signed in as the site owner to sync projects.";
      } else if (/Forbidden: not owner/i.test(message)) {
        message = "Only the configured owner account can sync.";
      } else if (/GitHub fetch failed/i.test(message)) {
        message = "GitHub API request failed. Check token/rate limits.";
      }
      push({
        title: "Sync Failed",
        description: message,
        variant: "error",
      });
    } finally {
      setSyncing(false);
    }
  }

  const loading = projects === undefined;
  const empty = !loading && projects && projects.length === 0;

  // Determine a featured project (first sorted by stars / updated_at locally for now)
  let featured: ProjectDoc | undefined;
  let rest: ProjectDoc[] = [];
  if (!loading && projects && projects.length) {
    const sorted = [...projects].sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count)
        return b.stargazers_count - a.stargazers_count;
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
    featured = sorted[0];
    rest = sorted.slice(1);
  }

  return (
    <section
      id="projects"
      className="w-full py-16 md:py-28 bg-gray-50 dark:bg-gray-900"
    >
      <div className="container px-4 md:px-6">
        {/* JSON-LD structured data for the featured project (SEO) */}
        {featured && (
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "SoftwareSourceCode",
                  name: featured.name,
                  description: featured.description || undefined,
                  codeRepository: featured.html_url,
                  url: featured.homepage || featured.html_url,
                  programmingLanguage: featured.language || undefined,
                  keywords:
                    featured.topics && featured.topics.length
                      ? featured.topics
                      : undefined,
                  dateCreated: featured.created_at,
                  dateModified: featured.updated_at,
                  aggregateRating:
                    featured.stargazers_count > 0
                      ? {
                          "@type": "AggregateRating",
                          ratingCount: featured.stargazers_count,
                          ratingValue: featured.stargazers_count, // GitHub stars as a proxy metric
                        }
                      : undefined,
                  forkCount: featured.forks_count || undefined,
                  isAccessibleForFree: true,
                },
                null,
                0
              ),
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
          <motion.div
            variants={fadeInUp}
            className="flex flex-col gap-4 text-center items-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Projects
            </h2>
            <p className="text-gray-500 md:text-lg dark:text-gray-400 max-w-2xl">
              Selected engineering work, experiments, and tools. Continuously
              synced from GitHub into Convex storage.
            </p>
            {isOwner && (
              <div className="pt-1 flex flex-col items-center gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing || inCooldown}
                  className="inline-flex items-center gap-1 rounded-md border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors disabled:opacity-60 hover:enabled:opacity-90"
                  aria-disabled={syncing || inCooldown}
                >
                  {syncing && (
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  )}
                  <span>
                    {syncing
                      ? "Syncing…"
                      : inCooldown
                        ? `Cooldown ${cooldownRemaining}s`
                        : "Refresh from GitHub"}
                  </span>
                </button>
                {lastSync && (
                  <span className="text-xs text-muted-foreground">
                    Last sync:{" "}
                    {relativeTime(new Date(lastSync.created_at).getTime())} •{" "}
                    {lastSync.count} repos
                  </span>
                )}
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
            {!loading && empty && (
              <div className="w-full border border-dashed rounded-xl p-8 text-center flex flex-col items-center gap-4 bg-background/40 dark:bg-background/20">
                <h3 className="text-lg font-semibold">
                  No projects synced yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Trigger a GitHub sync to pull your public repositories into
                  Convex and populate this section.
                </p>
                {isOwner && (
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-1 rounded-md border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors disabled:opacity-60 hover:enabled:opacity-90"
                  >
                    {syncing && (
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    <span>{syncing ? "Syncing…" : "Sync Now"}</span>
                  </button>
                )}
                {!isOwner && (
                  <p className="text-xs text-muted-foreground">
                    Owner has not synced repositories yet.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="max-w-5xl mx-auto w-full space-y-6">
            {!loading && rest.length > 0 && (
              <h3 className="text-lg font-semibold tracking-tight">
                More Projects
              </h3>
            )}
            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-44 rounded-lg border bg-background"
                  />
                ))}
              </div>
            )}
            {!loading && rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((project) => (
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
