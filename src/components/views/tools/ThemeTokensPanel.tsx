"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Section } from "@/components/layout/Section";
import { cn } from "@/lib/utils";

interface TokenRow {
  name: string;
  value: string;
  computed: string;
}

// Basic semantic token prefix heuristics (adjust as design system evolves)
const TOKEN_PREFIXES = [
  "--background",
  "--foreground",
  "--primary",
  "--secondary",
  "--muted",
  "--accent",
  "--destructive",
  "--border",
  "--radius",
]; // includes radii for dev introspection

export function ThemeTokensPanel() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [filter, setFilter] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const rows: TokenRow[] = [];
    for (let i = 0; i < style.length; i++) {
      const name = style[i];
      if (!name.startsWith("--")) continue;
      if (!TOKEN_PREFIXES.some((p) => name.startsWith(p))) continue;
      const value = style.getPropertyValue(name).trim();
      // Create a temporary element to resolve potential nested var() usage
      const computed = value; // For simplicity; could attempt resolution if needed
      rows.push({ name, value, computed });
    }
    rows.sort((a, b) => a.name.localeCompare(b.name));
    setTokens(rows);
  }, []);

  const shown = tokens.filter((t) => !filter || t.name.includes(filter));

  const doCopy = (text: string, tokenName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(tokenName);
      setTimeout(() => setCopied(null), 1600);
    });
  };

  return (
    <Section id="theme-tokens" variant="prose" className="gap-10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="w-full space-y-8"
      >
        <motion.div variants={fadeInUp} className="space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Theme Tokens</h2>
          <p className="text-muted-foreground max-w-prose mx-auto text-sm">
            Developer-only panel listing core semantic CSS variables. Copy names
            or values to aid design iteration.
          </p>
          <div className="mx-auto max-w-xs">
            <input
              className="mt-2 w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/40 focus-visible:border-primary/50"
              placeholder="Filter tokens..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </motion.div>
        <motion.div variants={fadeInUp} className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((t) => {
              const isColor = /^(#|oklch|hsl|rgb)/i.test(t.value);
              return (
                <div
                  key={t.name}
                  className="group relative rounded-lg border border-border/60 bg-card/40 backdrop-blur p-4 text-left shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <code className="text-xs font-medium break-all">
                      {t.name}
                    </code>
                    {isColor && (
                      <span
                        className="h-5 w-5 rounded border border-border/50"
                        style={{ background: `var(${t.name})` }}
                        aria-label="color swatch"
                      />
                    )}
                  </div>
                  <p className="text-xs font-mono break-all text-muted-foreground mb-2">
                    {t.value}
                  </p>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => doCopy(t.name, t.name + ":name")}
                      className={cn(
                        "px-2 py-1 rounded border border-border/60 bg-background/60 hover:bg-background/80 transition",
                        copied === t.name + ":name" && "ring-1 ring-primary"
                      )}
                    >
                      {copied === t.name + ":name" ? "Copied" : "Name"}
                    </button>
                    <button
                      onClick={() => doCopy(t.value, t.name + ":val")}
                      className={cn(
                        "px-2 py-1 rounded border border-border/60 bg-background/60 hover:bg-background/80 transition",
                        copied === t.name + ":val" && "ring-1 ring-primary"
                      )}
                    >
                      {copied === t.name + ":val" ? "Copied" : "Value"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {shown.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              No tokens match filter.
            </p>
          )}
        </motion.div>
      </motion.div>
    </Section>
  );
}
