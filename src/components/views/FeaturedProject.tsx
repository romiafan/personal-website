import React from 'react';
import { cn } from '@/lib/utils';
import { Star, GitFork, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion';

interface FeaturedProjectProps {
  name: string;
  description?: string;
  html_url: string;
  homepage?: string;
  stars: number;
  forks: number;
  topics: string[];
  language?: string;
  updated_at: string;
}

function relativeTime(fromISO: string): string {
  try {
    const then = new Date(fromISO).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    const mo = Math.floor(day / 30);
    if (mo < 12) return `${mo}mo ago`;
    const yr = Math.floor(day / 365);
    return `${yr}y ago`;
  } catch { return ''; }
}

export const FeaturedProject: React.FC<FeaturedProjectProps> = ({
  name, description, html_url, homepage, stars, forks, topics, language, updated_at
}) => {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-background to-muted/40 p-6 shadow-sm',
        'ring-1 ring-border/50'
      )}
    >
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(circle_at_30%_20%,white,transparent_70%)] bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.15),transparent_60%)]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="text-primary font-semibold">Featured</span>
            {language && <span className="text-muted-foreground">{language}</span>}
          </div>
          <h3 className="text-2xl font-bold tracking-tight leading-tight">{name}</h3>
          {description && <p className="max-w-prose text-sm text-muted-foreground leading-relaxed">{description}</p>}
          <div className="flex flex-wrap gap-1">
            {topics.slice(0,6).map(t => (
              <span key={t} className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{t}</span>
            ))}
            {topics.length > 6 && (
              <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">+{topics.length - 6}</span>
            )}
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" />{stars}</span>
            <span className="inline-flex items-center gap-1"><GitFork className="h-4 w-4" />{forks}</span>
            <span>Updated {relativeTime(updated_at)}</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Repo
            </a>
            {homepage && (
              <a
                href={homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Live
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
