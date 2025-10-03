import { describe, it, expect } from 'vitest';
import { createFadeInUp, createStaggerContainer, bundleInfo } from '@/lib/motion/core';
import { motionUsageRegistry, bundleAnalysis } from '@/lib/motion/registry';

describe('Motion Tree-Shaking Optimization', () => {
  it('should create optimized core motion variants', () => {
    const fadeInUp = createFadeInUp({ reducedMotion: false });
    
    expect(fadeInUp.hidden).toEqual({ opacity: 0, y: 24 });
    expect((fadeInUp.show as any).opacity).toBe(1);
    expect((fadeInUp.show as any).y).toBe(0);
  });

  it('should respect reduced motion in core variants', () => {
    const fadeInUp = createFadeInUp({ reducedMotion: true });
    
    expect(fadeInUp.hidden).toEqual({ opacity: 0 });
    expect((fadeInUp.show as any).opacity).toBe(1);
    expect((fadeInUp.show as any).y).toBeUndefined();
  });

  it('should create optimized stagger container', () => {
    const stagger = createStaggerContainer({ stagger: 0.1, reducedMotion: false });
    
    expect((stagger.show as any).transition?.staggerChildren).toBe(0.1);
  });

  it('should disable stagger when reduced motion is enabled', () => {
    const stagger = createStaggerContainer({ stagger: 0.1, reducedMotion: true });
    
    expect((stagger.show as any).transition?.staggerChildren).toBe(0);
  });

  it('should track motion usage for bundle analysis', () => {
    expect(motionUsageRegistry).toBeInstanceOf(Array);
    expect(motionUsageRegistry.length).toBeGreaterThan(0);
    
    // Check that About component is tracked
    const aboutUsage = motionUsageRegistry.find(usage => usage.component === 'About');
    expect(aboutUsage).toBeDefined();
    expect(aboutUsage?.variants).toContain('fadeInUp');
  });

  it('should provide bundle optimization insights', () => {
    expect(bundleAnalysis.core).toContain('fadeInUp');
    expect(bundleAnalysis.core).toContain('staggerContainer');
    expect(bundleAnalysis.estimatedSavings).toContain('KB');
  });

  it('should track bundle size information', () => {
    expect(bundleInfo.name).toBe('Core Motion Bundle');
    expect(bundleInfo.variants).toContain('fadeInUp');
    expect(bundleInfo.estimatedSize).toContain('KB');
  });

  it('should identify heavy motion components', () => {
    expect(bundleAnalysis.heavyMotionComponents).toContain('Contact');
    expect(bundleAnalysis.heavyMotionComponents).toContain('TechStack');
  });
});