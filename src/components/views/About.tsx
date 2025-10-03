"use client";
import { motion } from "framer-motion";
import { useMotion } from "@/lib/motion/hooks";
import { Section } from "@/components/layout/Section";

export function About() {
  const { fadeInUp } = useMotion();

  return (
    <Section
      id="about"
      variant="prose"
      className="items-center text-center gap-8"
    >
      <motion.div variants={fadeInUp} className="space-y-6">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          About Me
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          I&apos;m a full-stack engineer focused on building resilient,
          accessible, and high-performance web applications. I enjoy working
          across the stack: crafting cohesive design systems, optimizing API
          layers, and leveraging real-time infrastructure for compelling user
          experiences. My approach balances strong fundamentals with pragmatic
          tooling—always iterating with intention and clarity.
        </p>
      </motion.div>
    </Section>
  );
}
