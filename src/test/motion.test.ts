import { describe, it, expect } from 'vitest';
import { prefersReducedMotion, createMotionVariants } from '@/lib/motion/base';

describe('Motion Library', () => {
  it('should detect reduced motion preference', () => {
    // Test with default mock (returns false)
    expect(prefersReducedMotion()).toBe(false);
  });

  it('should create appropriate variants for reduced motion', () => {
    const variants = createMotionVariants(true);
    
    // Test fadeInUp with reduced motion
    const fadeInUp = variants.makeFadeInUp();
    expect(fadeInUp.hidden).toEqual({ opacity: 0 });
    
    // Cast to any for testing purposes since Variant type is complex
    const showVariant = fadeInUp.show as any;
    expect(showVariant.opacity).toBe(1);
    expect(showVariant.transition?.duration).toBe(0.2);
    
    // Should not have y movement for reduced motion
    const hiddenVariant = fadeInUp.hidden as any;
    expect(hiddenVariant.y).toBeUndefined();
    expect(showVariant.y).toBeUndefined();
  });

  it('should create full motion variants when not reduced', () => {
    const variants = createMotionVariants(false);
    
    // Test fadeInUp with full motion
    const fadeInUp = variants.makeFadeInUp();
    expect(fadeInUp.hidden).toEqual({ opacity: 0, y: 24 });
    
    const showVariant = fadeInUp.show as any;
    expect(showVariant.opacity).toBe(1);
    expect(showVariant.y).toBe(0);
    expect(showVariant.transition?.duration).toBe(0.55);
  });

  it('should disable stagger when reduced motion is enabled', () => {
    const variants = createMotionVariants(true);
    const stagger = variants.staggerContainer(0.1);
    
    const showVariant = stagger.show as any;
    expect(showVariant.transition?.staggerChildren).toBe(0);
  });

  it('should enable stagger when reduced motion is disabled', () => {
    const variants = createMotionVariants(false);
    const stagger = variants.staggerContainer(0.1);
    
    const showVariant = stagger.show as any;
    expect(showVariant.transition?.staggerChildren).toBe(0.1);
  });
});