"use client";

import { useState, FormEvent, useMemo } from "react";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Section } from "@/components/layout/Section";

interface FormState {
  name: string;
  email: string;
  message: string;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(80, "Name too long"),
  email: z.string().trim().email("Invalid email"),
  message: z
    .string()
    .trim()
    .min(5, "Message too short")
    .max(1000, "Message too long"),
});

export function Contact() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<
    null | "idle" | "submitting" | "success" | "error"
  >(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Live validation per field
    const candidate = { ...form, [name]: value };
    const parsed = contactSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldIssue = parsed.error.issues.find(
        (issue) => issue.path[0] === name
      );
      setErrors((prev) => ({
        ...prev,
        [name]: fieldIssue ? fieldIssue.message : undefined,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const sendMessage = useMutation(api.messages.send);

  const formValid = useMemo(
    () => contactSchema.safeParse(form).success,
    [form]
  );

  interface SendResultSuccess {
    id: string;
  }
  interface SendResultRateLimited {
    error: { code: "RATE_LIMIT"; retry_after_ms: number; message: string };
  }
  type SendResult = SendResultSuccess | SendResultRateLimited | undefined;

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
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const result: SendResult = await sendMessage({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      });
      if (result && "error" in result && result.error.code === "RATE_LIMIT") {
        setStatus("error");
        setErrors((prev) => ({
          ...prev,
          message: result.error.message,
        }));
        return;
      }
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
      setErrors({});
    } catch {
      setStatus("error");
    }
  };

  return (
    <Section
      id="contact"
      variant="prose"
      className="items-center text-center gap-12"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="w-full space-y-8"
      >
        <motion.div variants={fadeInUp} className="space-y-4">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Get In Touch
          </h2>
          <p className="text-muted-foreground max-w-prose mx-auto">
            Have a project, collaboration idea, or just want to say hi? Reach
            out below.
          </p>
        </motion.div>
        <motion.form
          variants={fadeInUp}
          onSubmit={handleSubmit}
          className="relative space-y-6 rounded-xl border border-border/60 bg-card/40 backdrop-blur px-6 py-8 shadow-sm"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="flex h-11 w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/40 focus-visible:border-primary/50 transition"
                placeholder="Your name"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="flex h-11 w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/40 focus-visible:border-primary/50 transition"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={form.message}
              onChange={handleChange}
              className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/40 focus-visible:border-primary/50 transition resize-none"
              placeholder="Tell me a bit about it..."
              aria-invalid={!!errors.message}
            />
            {errors.message && (
              <p className="text-xs text-red-500">{errors.message}</p>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={status === "submitting" || !formValid}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/40 disabled:opacity-60"
            >
              {status === "submitting" ? "Sending…" : "Send Message"}
            </motion.button>
            {status === "success" && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-500"
              >
                Message sent!
              </motion.p>
            )}
            {status === "error" && !errors.message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500"
              >
                Something went wrong.
              </motion.p>
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-border/40 [mask:linear-gradient(180deg,white,transparent)]" />
        </motion.form>
      </motion.div>
    </Section>
  );
}
