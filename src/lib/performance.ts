"use client";

import { useEffect } from "react";

/**
 * Performance optimization hooks and utilities
 */

// Preload critical resources
export function useResourcePreloading() {
  useEffect(() => {
    // DNS prefetch for external domains
    const dnsPrefetch = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = href;
      document.head.appendChild(link);
    };

    // Preconnect to external origins
    const preconnect = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    // Only preload in production for actual performance gains
    if (process.env.NODE_ENV === 'production') {
      // DNS prefetch external domains
      dnsPrefetch('//github.com');
      dnsPrefetch('//api.github.com');
      
      // Preconnect to external services
      preconnect('https://fonts.googleapis.com');
      preconnect('https://fonts.gstatic.com');
    }
  }, []);
}

// Intersection Observer for lazy loading
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    return () => observer.disconnect();
  }, [callback, options]);
}

// Lazy load components
export function useLazyLoading() {
  useEffect(() => {
    // Lazy load non-critical images
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      lazyImages.forEach((img) => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      lazyImages.forEach((img) => {
        const element = img as HTMLImageElement;
        element.src = element.dataset.src || '';
      });
    }
  }, []);
}

// Performance metrics tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  const vitalsUrl = '/api/vitals';

  function sendToAnalytics(metric: { name: string; value: number; delta: number; id: string }) {
    const body = JSON.stringify(metric);
    
    // Use sendBeacon if available, otherwise fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(vitalsUrl, body);
    } else {
      fetch(vitalsUrl, {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(console.error);
    }
  }

  // Import web-vitals dynamically to avoid blocking
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics); // INP replaced FID in web-vitals v4+
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }).catch(() => {
    // web-vitals not available, skip tracking
  });
}