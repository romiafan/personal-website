"use client";

import { useState, FormEvent, useMemo } from 'react';
import { z } from 'zod';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion';

interface FormState {
  name: string;
  email: string;
  message: string;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(80, 'Name too long'),
  email: z.string().trim().email('Invalid email'),
  message: z.string().trim().min(5, 'Message too short').max(1000, 'Message too long'),
});

export function Contact() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<null | 'idle' | 'submitting' | 'success' | 'error'>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Live validation per field
    const candidate = { ...form, [name]: value };
    const parsed = contactSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldIssue = parsed.error.issues.find(issue => issue.path[0] === name);
      setErrors(prev => ({ ...prev, [name]: fieldIssue ? fieldIssue.message : undefined }));
    } else {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const sendMessage = useMutation(api.messages.send);

  const formValid = useMemo(() => contactSchema.safeParse(form).success, [form]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      await sendMessage({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      });
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
      setErrors({});
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mx-auto max-w-3xl space-y-8"
        >
          <motion.div variants={fadeInUp} className="space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get In Touch</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Have a project, collaboration idea, or just want to say hi? Reach out below.
            </p>
          </motion.div>
          <motion.form variants={fadeInUp} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input
                  id="name"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/30"
                  placeholder="Your name"
                />
                {errors.name && <p className="text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>
              <div className="flex flex-col space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/30"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/30 resize-none"
                placeholder="Tell me a bit about it..."
              />
              {errors.message && <p className="text-xs text-red-600 dark:text-red-400">{errors.message}</p>}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status === 'submitting' || !formValid}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/30 disabled:opacity-60"
              >
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
              </button>
              {status === 'success' && <p className="text-sm text-green-600 dark:text-green-400">Message sent!</p>}
              {status === 'error' && <p className="text-sm text-red-600 dark:text-red-400">Something went wrong.</p>}
            </div>
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
}
