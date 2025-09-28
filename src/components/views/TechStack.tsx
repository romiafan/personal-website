"use client";
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion';

const technologies: { name: string; description: string }[] = [
  { name: 'TypeScript', description: 'Strictly typed JavaScript at scale' },
  { name: 'React', description: 'Component-driven UI architecture' },
  { name: 'Next.js', description: 'Full-stack React framework for the modern web' },
  { name: 'Convex', description: 'Realtime backend & data layer' },
  { name: 'Tailwind CSS', description: 'Utility-first styling system' },
  { name: 'shadcn/ui', description: 'Composable accessible component primitives' },
  { name: 'Framer Motion', description: 'Animation & micro-interactions' },
  { name: 'Node.js', description: 'High-performance server runtime' },
];

export function TechStack() {
  return (
    <section id="tech" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-5xl space-y-8"
        >
          <motion.div variants={fadeInUp} className="space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tech Stack</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              A curated set of tools and platforms I leverage to build maintainable, fast, and delightful software.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {technologies.map((tech, i) => (
              <motion.div
                variants={fadeInUp}
                key={tech.name}
                custom={i * 0.05}
                className="rounded-lg border bg-background p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold tracking-tight">{tech.name}</h3>
                <p className="text-sm mt-1 text-gray-500 dark:text-gray-400 leading-snug">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
