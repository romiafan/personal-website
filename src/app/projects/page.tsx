"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import {
  ExternalLink,
  Github,
  Globe,
  Search,
  Star,
  GitFork,
  Code,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/Section";
import { motion, AnimatePresence } from "framer-motion";
import { useMotion } from "@/lib/motion/hooks";

interface ProjectFilters {
  searchTerm: string;
  language: string;
  sortBy: "updated" | "stars" | "name";
  sortOrder: "asc" | "desc";
  page: number;
}

export default function ProjectsPage() {
  const { fadeInUp, staggerContainer } = useMotion();

  const [filters, setFilters] = useState<ProjectFilters>({
    searchTerm: "",
    language: "",
    sortBy: "updated",
    sortOrder: "desc",
    page: 1,
  });

  const [isLoading, setIsLoading] = useState(false);

  const limit = 12;
  const offset = (filters.page - 1) * limit;

  // Convex queries
  const projectsData = useQuery(api.projects.getWithFilters, {
    limit,
    offset,
    language: filters.language || undefined,
    searchTerm: filters.searchTerm || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    excludeForks: true,
  });

  const languages = useQuery(api.projects.getLanguages);
  const stats = useQuery(api.projects.getStats);

  // Handle filter changes
  const updateFilters = (newFilters: Partial<ProjectFilters>) => {
    setIsLoading(true);
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except for page changes)
      page: "page" in newFilters ? newFilters.page! : 1,
    }));

    // Simulate loading for smooth UX
    setTimeout(() => setIsLoading(false), 300);
  };

  // Memoized project cards for performance
  const projectCards = useMemo(() => {
    if (!projectsData?.projects) return [];

    return projectsData.projects.map((project) => (
      <motion.div
        key={project._id}
        variants={fadeInUp}
        layout
        className="h-full"
      >
        <ProjectCard project={project} />
      </motion.div>
    ));
  }, [projectsData?.projects, fadeInUp]);

  if (!projectsData || !languages || !stats) {
    return (
      <main className="min-h-screen">
        <Section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-muted rounded-lg mx-auto w-64"></div>
                  <div className="h-6 bg-muted rounded mx-auto w-96"></div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>
    );
  }

  const { projects, pagination } = projectsData;

  return (
    <main className="min-h-screen">
      <Section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Projects</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Exploring technology through code. A collection of{" "}
                {stats.totalProjects} open-source projects with{" "}
                {stats.totalStars} total stars across {stats.languages}{" "}
                programming languages.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">
                    {stats.totalProjects}
                  </div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{stats.totalStars}</div>
                  <div className="text-sm text-muted-foreground">Stars</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{stats.totalForks}</div>
                  <div className="text-sm text-muted-foreground">Forks</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{stats.languages}</div>
                  <div className="text-sm text-muted-foreground">Languages</div>
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="mb-12 space-y-6"
            >
              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={filters.searchTerm}
                  onChange={(e) =>
                    updateFilters({ searchTerm: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4 justify-center items-center">
                {/* Language Filter */}
                <select
                  value={filters.language}
                  onChange={(e) => updateFilters({ language: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Languages</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>

                {/* Sort Controls */}
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    updateFilters({
                      sortBy: e.target.value as "updated" | "stars" | "name",
                    })
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="stars">Most Stars</option>
                  <option value="name">Name</option>
                </select>

                <button
                  onClick={() =>
                    updateFilters({
                      sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
                    })
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                >
                  {filters.sortOrder === "desc" ? "↓" : "↑"}
                </button>

                {/* Clear Filters */}
                {(filters.searchTerm || filters.language) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateFilters({ searchTerm: "", language: "" })
                    }
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Projects Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${filters.page}-${filters.language}-${filters.searchTerm}`}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                exit="hidden"
                className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 ${
                  isLoading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {projectCards}
              </motion.div>
            </AnimatePresence>

            {/* No Results */}
            {projects.length === 0 && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="show"
                className="text-center py-12"
              >
                <div className="text-muted-foreground mb-4">
                  No projects found
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    updateFilters({ searchTerm: "", language: "" })
                  }
                >
                  Clear Filters
                </Button>
              </motion.div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="show"
                className="flex justify-center items-center gap-4 mt-12"
              >
                <Button
                  variant="outline"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => updateFilters({ page: filters.page - 1 })}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === pagination.currentPage
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => updateFilters({ page: pageNum })}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => updateFilters({ page: filters.page + 1 })}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Call to Action */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="text-center mt-16 p-8 rounded-lg bg-muted/50"
            >
              <h3 className="text-xl font-semibold mb-4">
                Interested in Collaboration?
              </h3>
              <p className="text-muted-foreground mb-6">
                I&apos;m always open to discussing new projects and
                opportunities.
              </p>
              <Button asChild>
                <Link href="/#contact">Get In Touch</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </Section>
    </main>
  );
}

interface Project {
  _id: string;
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

function ProjectCard({ project }: { project: Project }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 group flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed line-clamp-3">
              {project.description || "No description available"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          {/* Language and Topics */}
          <div className="flex flex-wrap gap-2">
            {project.language && (
              <Badge variant="default" className="text-xs">
                <Code className="w-3 h-3 mr-1" />
                {project.language}
              </Badge>
            )}
            {project.topics.slice(0, 2).map((topic: string) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
            {project.topics.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{project.topics.length - 2}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {project.stargazers_count}
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="w-4 h-4" />
              {project.forks_count}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(project.updated_at)}
            </div>
          </div>
        </div>

        {/* Action Buttons - Always at bottom */}
        <div className="flex gap-2 w-full overflow-hidden mt-auto">
          <Button asChild size="sm" className="flex-1 min-w-0">
            <Link
              href={project.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full"
            >
              <Github className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">View Code</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </Link>
          </Button>

          {project.homepage && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-shrink-0 w-auto max-w-[120px]"
            >
              <Link
                href={project.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3"
              >
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-xs">Live</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
