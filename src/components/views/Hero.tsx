"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import { Section } from "@/components/layout/Section";

export function Hero() {
  const scrollToProjects = () => {
    const target = document.getElementById("projects");
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Radial gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 size-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/30 via-primary/5 to-transparent blur-3xl opacity-50 dark:from-primary/15 dark:via-primary/5" />
      </div>
      <Section
        id="home"
        variant="wide"
        className="items-center text-center gap-10"
      >
        <motion.div
          variants={fadeInUp}
          className="flex flex-col gap-6 max-w-3xl"
        >
          <h1 className="font-bold tracking-tight text-balance text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95]">
            Hi, I&apos;m <span className="text-primary">Romiafan</span>
          </h1>
          <p className="mx-auto text-lg md:text-xl text-muted-foreground max-w-prose">
            Full‑Stack Engineer & Creative Technologist crafting performant,
            human‑centered web experiences.
          </p>
        </motion.div>
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.button
            onClick={scrollToProjects}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/40"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            View My Work
          </motion.button>
          <a
            href="#contact"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border/60 bg-background/60 backdrop-blur px-8 text-sm font-medium shadow-sm transition-colors hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/30"
          >
            Contact
          </a>
        </motion.div>
      </Section>
    </div>
  );
}
