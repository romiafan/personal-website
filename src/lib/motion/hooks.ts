import { useMemo } from 'react';
import { Variants } from 'framer-motion';
import { useMotionPreference } from '@/components/providers/motion-provider';
import { createFadeInUp, createStaggerContainer, createFade } from './core';

/**
 * Optimized motion hook with tree-shaking support
 * Only loads the motion variants that are actually used
 */

export interface UseMotionOptions {
  distance?: number;
  duration?: number;
  stagger?: number;
}

/**
 * Core motion hook - provides the most commonly used variants
 * Automatically respects user motion preferences
 */
export function useMotion(options: UseMotionOptions = {}) {
  const { prefersReducedMotion } = useMotionPreference();
  
  return useMemo(() => {
    const motionOptions = { ...options, reducedMotion: prefersReducedMotion };
    
    return {
      fadeInUp: createFadeInUp(motionOptions),
      staggerContainer: createStaggerContainer(motionOptions),
      fade: createFade(motionOptions),
    };
  }, [prefersReducedMotion, options]);
}

/**
 * Specialized motion hook - lazy loads advanced variants
 * Only imports when specifically requested
 */
export function useSpecializedMotion(options: UseMotionOptions = {}) {
  const { prefersReducedMotion } = useMotionPreference();
  
  return useMemo(() => {
    // Dynamic import for tree-shaking - only loads when used
    const loadSpecialized = async () => {
      const { 
        createSlideInLeft, 
        createSlideInRight, 
        createScaleIn,
        createGridStagger,
        createPageTransition 
      } = await import('./specialized');
      
      const motionOptions = { ...options, reducedMotion: prefersReducedMotion };
      
      return {
        slideInLeft: createSlideInLeft(motionOptions),
        slideInRight: createSlideInRight(motionOptions),
        scaleIn: createScaleIn(motionOptions),
        gridStagger: createGridStagger(motionOptions),
        pageTransition: createPageTransition(motionOptions),
      };
    };
    
    return { loadSpecialized };
  }, [prefersReducedMotion, options]);
}

/**
 * Simple motion hook for minimal animations
 * Smallest bundle impact - only fade animations
 */
export function useSimpleMotion(options: UseMotionOptions = {}) {
  const { prefersReducedMotion } = useMotionPreference();
  
  return useMemo(() => {
    const { duration = 0.4 } = options;
    
    return {
      fade: createFade({ duration, reducedMotion: prefersReducedMotion }),
    };
  }, [prefersReducedMotion, options]);
}

/**
 * Motion variant factory for custom animations
 * Tree-shaking friendly - only creates what's needed
 */
export function createCustomMotion(
  type: 'fade' | 'fadeInUp' | 'stagger',
  options: UseMotionOptions & { reducedMotion?: boolean } = {}
): Variants {
  switch (type) {
    case 'fade':
      return createFade(options);
    case 'fadeInUp':
      return createFadeInUp(options);
    case 'stagger':
      return createStaggerContainer(options);
    default:
      return createFade(options);
  }
}

/**
 * Motion performance utilities
 */
export const motionPerformance = {
  // Check if motion should be disabled for performance
  shouldDisableMotion: (reducedMotion: boolean, lowEndDevice?: boolean) => {
    return reducedMotion || lowEndDevice || false;
  },
  
  // Get optimized motion settings for different scenarios
  getOptimizedSettings: (scenario: 'mobile' | 'desktop' | 'low-end') => {
    switch (scenario) {
      case 'mobile':
        return { duration: 0.3, distance: 16 };
      case 'low-end':
        return { duration: 0.2, distance: 8 };
      case 'desktop':
      default:
        return { duration: 0.55, distance: 24 };
    }
  },
} as const;