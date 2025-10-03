import { Variants } from 'framer-motion';

// Legacy function for backward compatibility - prefer useMotionPreference hook
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Optimized motion variants that respect user preferences
export function createMotionVariants(reducedMotion: boolean = false) {
  return {
    makeFadeInUp: (options?: { distance?: number; duration?: number }): Variants => {
      const { distance = 24, duration = 0.55 } = options || {};
      return {
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: distance },
        show: reducedMotion
          ? { opacity: 1, transition: { duration: 0.2 } }
          : { opacity: 1, y: 0, transition: { duration, ease: [0.25, 0.1, 0.25, 1] } },
      };
    },

    makeFade: (options?: { duration?: number }): Variants => {
      const { duration = 0.4 } = options || {};
      return {
        hidden: { opacity: 0 },
        show: { 
          opacity: 1, 
          transition: { duration: reducedMotion ? 0.2 : duration } 
        },
      };
    },

    staggerContainer: (stagger: number = 0.12): Variants => ({
      hidden: {},
      show: {
        transition: { staggerChildren: reducedMotion ? 0 : stagger },
      },
    }),
  };
}

// Legacy exports using old approach for backward compatibility
export function makeFadeInUp(options?: { distance?: number; duration?: number }): Variants {
  const { distance = 24, duration = 0.55 } = options || {};
  const reduce = prefersReducedMotion();
  return {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: distance },
    show: reduce
      ? { opacity: 1, transition: { duration: Math.min(0.3, duration) } }
      : { opacity: 1, y: 0, transition: { duration, ease: [0.25, 0.1, 0.25, 1] } },
  };
}

export function makeFade(options?: { duration?: number }): Variants {
  const { duration = 0.4 } = options || {};
  const reduce = prefersReducedMotion();
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: reduce ? Math.min(0.25, duration) : duration } },
  };
}

export const fadeInUp: Variants = makeFadeInUp();
export const fadeIn: Variants = makeFade();

export const staggerContainer: Variants = {
  hidden: {},
  show: (stagger: number = 0.12) => ({
    transition: { staggerChildren: prefersReducedMotion() ? 0 : stagger },
  }),
};

export const motionPrimitives = { fadeInUp, fadeIn, makeFadeInUp, makeFade, staggerContainer };
