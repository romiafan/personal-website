"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import type { Id } from "../../../convex/_generated/dataModel";

export interface ProjectCardProps {
  id: Id<"projects">;
  name: string;
  description?: string;
  language?: string;
  topics: string[];
  stars: number;
  forks: number;
  className?: string;
}

export function ProjectCard({
  id,
  name,
  description,
  language,
  topics,
  stars,
  forks,
  className,
}: ProjectCardProps) {
  return (
    <motion.div
      layout
      variants={fadeInUp}
      key={id}
      className={
        "flex flex-col justify-between rounded-lg border bg-background p-4 text-left hover:shadow-md transition-shadow " +
        (className ?? "")
      }
    >
      <div className="space-y-2">
        <h3 className="font-semibold tracking-tight line-clamp-1">{name}</h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{description}</p>
        )}
        <div className="flex flex-wrap gap-1 pt-1">
          {language && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{language}</span>
          )}
          {topics.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>★ {stars}</span>
        <span>Forks {forks}</span>
      </div>
    </motion.div>
  );
}
