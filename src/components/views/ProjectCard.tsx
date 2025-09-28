"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import { Star, GitFork } from 'lucide-react';
import { relativeTime, languageColor, cn } from '@/lib/utils';
import type { Id } from "../../../convex/_generated/dataModel";

export interface ProjectCardProps {
  id: Id<"projects">;
  name: string;
  description?: string;
  language?: string;
  topics: string[];
  stars: number;
  forks: number;
  updated_at?: string;
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
  updated_at
}: ProjectCardProps) {
  return (
    <motion.div
      layout
      variants={fadeInUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      key={id}
      className={cn(
        "flex flex-col justify-between rounded-lg border bg-background p-4 text-left hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold tracking-tight line-clamp-1 flex-1">{name}</h3>
          {language && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              {languageColor(language) && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: languageColor(language) || undefined }}
                />
              )}
              {language}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{description}</p>
        )}
        <div className="flex flex-wrap gap-1 pt-1">
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
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-500" />{stars}</span>
          <span className="inline-flex items-center gap-1"><GitFork className="h-3.5 w-3.5" />{forks}</span>
        </div>
        {updated_at && (
          <span className="whitespace-nowrap">{relativeTime(updated_at)}</span>
        )}
      </div>
    </motion.div>
  );
}
