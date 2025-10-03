import { Variants } from 'framer-motion';

/**
 * Specialized Motion Bundle - Advanced animations
 * Lazy-loaded for components that need complex motion patterns
 * Tree-shaking friendly: only imports when specifically needed
 */

export interface SpecializedMotionOptions {
  distance?: number;
  duration?: number;
  delay?: number;
  ease?: number[];
  reducedMotion?: boolean;
}

/**
 * Slide animations for layouts and cards
 */
export function createSlideInLeft(options: SpecializedMotionOptions = {}): Variants {
  const { 
    distance = 48, 
    duration = 0.6, 
    delay = 0,
    reducedMotion = false 
  } = options;

  return {
    hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, x: -distance },
    show: reducedMotion
      ? { opacity: 1, transition: { duration: 0.2, delay } }
      : { 
          opacity: 1, 
          x: 0, 
          transition: { 
            duration, 
            delay,
            ease: [0.25, 0.1, 0.25, 1] 
          } 
        },
  };
}

export function createSlideInRight(options: SpecializedMotionOptions = {}): Variants {
  const { 
    distance = 48, 
    duration = 0.6, 
    delay = 0,
    reducedMotion = false 
  } = options;

  return {
    hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, x: distance },
    show: reducedMotion
      ? { opacity: 1, transition: { duration: 0.2, delay } }
      : { 
          opacity: 1, 
          x: 0, 
          transition: { 
            duration, 
            delay,
            ease: [0.25, 0.1, 0.25, 1] 
          } 
        },
  };
}

/**
 * Scale animations for interactive elements
 */
export function createScaleIn(options: SpecializedMotionOptions = {}): Variants {
  const { 
    duration = 0.4, 
    delay = 0,
    reducedMotion = false 
  } = options;

  return {
    hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 },
    show: reducedMotion
      ? { opacity: 1, transition: { duration: 0.2, delay } }
      : { 
          opacity: 1, 
          scale: 1, 
          transition: { 
            duration, 
            delay,
            ease: [0.25, 0.1, 0.25, 1] 
          } 
        },
  };
}

/**
 * Rotation animations for loading states
 */
export function createRotateIn(options: SpecializedMotionOptions = {}): Variants {
  const { 
    duration = 0.5, 
    delay = 0,
    reducedMotion = false 
  } = options;

  return {
    hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, rotate: -180 },
    show: reducedMotion
      ? { opacity: 1, transition: { duration: 0.2, delay } }
      : { 
          opacity: 1, 
          rotate: 0, 
          transition: { 
            duration, 
            delay,
            ease: [0.25, 0.1, 0.25, 1] 
          } 
        },
  };
}

/**
 * Complex stagger patterns for lists and grids
 */
export function createGridStagger(options: SpecializedMotionOptions = {}): Variants {
  const { 
    duration = 0.1, 
    delay = 0,
    reducedMotion = false 
  } = options;

  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reducedMotion ? 0 : duration,
        delayChildren: delay,
      },
    },
  };
}

/**
 * Page transition variants
 */
export function createPageTransition(options: SpecializedMotionOptions = {}): Variants {
  const { 
    distance = 24, 
    duration = 0.3,
    reducedMotion = false 
  } = options;

  return {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: distance },
    animate: reducedMotion
      ? { opacity: 1, transition: { duration: 0.2 } }
      : { 
          opacity: 1, 
          y: 0, 
          transition: { 
            duration,
            ease: [0.25, 0.1, 0.25, 1] 
          } 
        },
    exit: reducedMotion
      ? { opacity: 0, transition: { duration: 0.2 } }
      : { 
          opacity: 0, 
          y: -distance, 
          transition: { 
            duration,
            ease: [0.25, 0.1, 0.25, 1] 
          } 
        },
  };
}

/**
 * Specialized bundle info for monitoring
 */
export const specializedBundleInfo = {
  name: 'Specialized Motion Bundle',
  variants: [
    'slideInLeft', 'slideInRight', 'scaleIn', 'rotateIn', 
    'gridStagger', 'pageTransition'
  ],
  estimatedSize: '~2.1KB gzipped',
  usage: 'Lazy-loaded for advanced animations',
  loadingStrategy: 'Dynamic import when needed',
} as const;