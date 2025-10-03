/**
 * Motion Registry - Tracks motion variant usage for tree-shaking optimization
 * This helps identify which variants are actually used in the codebase
 */

export interface MotionUsage {
  component: string;
  variants: string[];
  location: string;
}

export const motionUsageRegistry: MotionUsage[] = [
  {
    component: 'About',
    variants: ['fadeInUp'],
    location: 'src/components/views/About.tsx'
  },
  {
    component: 'Contact',
    variants: ['fadeInUp', 'staggerContainer'],
    location: 'src/components/views/Contact.tsx'
  },
  {
    component: 'FeaturedProject',
    variants: ['fadeInUp'],
    location: 'src/components/views/FeaturedProject.tsx'
  },
  {
    component: 'ProjectCard',
    variants: ['fadeInUp'],
    location: 'src/components/views/ProjectCard.tsx'
  },
  {
    component: 'TechStack',
    variants: ['fadeInUp', 'staggerContainer'],
    location: 'src/components/views/TechStack.tsx'
  },
  {
    component: 'Section',
    variants: ['staggerContainer (via createMotionVariants)'],
    location: 'src/components/layout/Section.tsx'
  },
  {
    component: 'ThemeTokenPanel',
    variants: ['custom animation variants'],
    location: 'src/components/views/tools/ThemeTokenPanel.tsx'
  }
];

/**
 * Bundle analysis for tree-shaking optimization
 */
export const bundleAnalysis = {
  // Most used variants (should be in core bundle)
  core: ['fadeInUp', 'staggerContainer'],
  
  // Specialized variants (can be lazy-loaded)
  specialized: ['makeFade', 'makeFadeInUp'],
  
  // Estimated bundle size reduction potential
  estimatedSavings: '~2-3KB gzipped by removing unused variants',
  
  // Components that could benefit from motion optimization
  heavyMotionComponents: [
    'Contact', 'TechStack', 'ThemeTokenPanel'
  ]
} as const;

/**
 * Performance recommendations based on usage analysis
 */
export const performanceRecommendations = [
  'Create separate motion bundles for core vs specialized variants',
  'Implement lazy loading for complex animation sequences',
  'Consider motion.div alternatives for simple fade animations',
  'Bundle fadeInUp and staggerContainer as core motion primitives',
  'Create motion hooks for common animation patterns'
] as const;