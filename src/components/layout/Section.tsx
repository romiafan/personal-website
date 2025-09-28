import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";

// Server component wrapper for consistent section layout & rhythm
// Variants control max-width tiers: prose (narrow text), default, wide (hero / expansive)
// Optionally apply a subtle background treatment via `subdued`.

export interface SectionProps {
  id?: string;
  variant?: "prose" | "default" | "wide";
  subdued?: boolean;
  className?: string;
  disableMotion?: boolean;
  children: ReactNode;
}

const widthByVariant: Record<NonNullable<SectionProps["variant"]>, string> = {
  prose: "max-w-[65ch]",
  default: "max-w-5xl",
  wide: "max-w-[1400px]",
};

export function Section({
  id,
  variant = "default",
  subdued = false,
  className,
  disableMotion,
  children,
}: SectionProps) {
  const Wrapper = disableMotion ? "div" : motion.div;
  return (
    <section
      id={id}
      className={cn(
        "relative w-full py-[clamp(4rem,8vw,8rem)]",
        subdued && "bg-muted/30 dark:bg-muted/10",
        "border-t border-border/40 first:border-t-0"
      )}
    >
      <Wrapper
        variants={disableMotion ? undefined : staggerContainer}
        initial={disableMotion ? undefined : "hidden"}
        whileInView={disableMotion ? undefined : "show"}
        viewport={disableMotion ? undefined : { once: true, amount: 0.2 }}
        className={cn(
          "mx-auto px-6 md:px-8",
          widthByVariant[variant],
          "flex flex-col",
          className
        )}
      >
        {children}
      </Wrapper>
    </section>
  );
}
