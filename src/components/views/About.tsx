"use client";
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion';

export function About() {
  return (
    <section id="about" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <motion.div
          variants={fadeInUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center space-y-6"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">About Me</h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            I&apos;m a full-stack engineer focused on building resilient, accessible, and high-performance web applications.
            I enjoy working across the stack: crafting cohesive design systems, optimizing API layers, and leveraging
            real-time infrastructure for compelling user experiences. My approach balances strong fundamentals with
            pragmatic tooling—always iterating with intention and clarity.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
