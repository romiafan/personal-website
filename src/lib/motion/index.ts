/**
 * Motion Library - Tree-shaking optimized exports
 * 
 * Choose the right import for your use case:
 * - Core bundle: Most common animations (fadeInUp, stagger, fade)
 * - Specialized bundle: Advanced animations (lazy-loaded)
 * - Hooks: Preference-aware motion utilities
 * - Legacy: Backward compatibility (will be deprecated)
 */

// Core motion primitives (always loaded)
export * from './core';

// Motion hooks (recommended approach)
export * from './hooks';

// Motion registry and performance analytics
export * from './registry';

// Legacy compatibility (prefer hooks over direct imports)
export * from './base';

// Specialized animations (lazy-loaded)
// Import directly from './specialized' when needed:
// import { createSlideInLeft } from '@/lib/motion/specialized';
