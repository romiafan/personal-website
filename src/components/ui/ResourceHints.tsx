"use client";

import { useResourcePreloading, useLazyLoading } from "@/lib/performance";

export function ResourceHints() {
  useResourcePreloading();
  useLazyLoading();

  return (
    <>
      {/* Preload critical routes */}
      <link rel="prefetch" href="/toolkit" />

      {/* Resource hints */}
      <link rel="dns-prefetch" href="//github.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
    </>
  );
}
