"use client";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Section } from "@/components/layout/Section";

const technologies: { name: string; description: string }[] = [
  { name: "TypeScript", description: "Strictly typed JavaScript at scale" },
  { name: "React", description: "Component-driven UI architecture" },
  {
    name: "Next.js",
    description: "Full-stack React framework for the modern web",
  },
  { name: "Convex", description: "Realtime backend & data layer" },
  { name: "Tailwind CSS", description: "Utility-first styling system" },
  {
    name: "shadcn/ui",
    description: "Composable accessible component primitives",
  },
  { name: "Framer Motion", description: "Animation & micro-interactions" },
  { name: "Node.js", description: "High-performance server runtime" },
];

export function TechStack() {
  return (
    <Section id="tech" variant="wide" className="gap-12">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-10"
      >
        <motion.div
          variants={fadeInUp}
          className="space-y-4 text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Tech Stack
          </h2>
          <p className="text-muted-foreground">
            A curated set of tools and platforms I leverage to build
            maintainable, fast, and delightful software.
          </p>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {technologies.map((tech, i) => (
            <motion.div
              variants={fadeInUp}
              key={tech.name}
              custom={i * 0.05}
              className="group relative rounded-lg border border-border/50 bg-card/60 backdrop-blur p-4 shadow-sm transition-colors hover:border-border hover:bg-card/80"
            >
              <h3 className="font-semibold tracking-tight text-foreground/90 group-hover:text-foreground">
                {tech.name}
              </h3>
              <p className="text-sm mt-1 text-muted-foreground leading-snug">
                {tech.description}
              </p>
              <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}
