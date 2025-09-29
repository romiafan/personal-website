// Temporary compatibility shim after refactor to directory-based barrel.
// TODO(#26): Remove once all imports confirmed updated and Turbopack cache invalidations are clean.
export * from './motion/base';
// Thin re-export layer kept for backwards compatibility.
// Prefer importing from '@/lib/motion/base' for tree-shaking (#26).
export * from './motion/base';
