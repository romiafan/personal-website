"use client";

import { useEffect } from "react";
import { trackWebVitals } from "@/lib/performance";

export function WebVitalsTracker() {
  useEffect(() => {
    // Track web vitals only in production or when debugging
    if (
      process.env.NODE_ENV === "production" ||
      localStorage.getItem("debug_performance") === "true"
    ) {
      trackWebVitals();
    }
  }, []);

  return null; // This component doesn't render anything
}
