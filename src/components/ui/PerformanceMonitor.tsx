"use client";

import { useEffect, useState } from "react";

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

interface WebVitalThresholds {
  lcp: { good: number; needs_improvement: number };
  fid: { good: number; needs_improvement: number };
  cls: { good: number; needs_improvement: number };
  fcp: { good: number; needs_improvement: number };
  ttfb: { good: number; needs_improvement: number };
}

const THRESHOLDS: WebVitalThresholds = {
  lcp: { good: 2500, needs_improvement: 4000 },
  fid: { good: 100, needs_improvement: 300 },
  cls: { good: 0.1, needs_improvement: 0.25 },
  fcp: { good: 1800, needs_improvement: 3000 },
  ttfb: { good: 800, needs_improvement: 1800 },
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when performance debugging is enabled
    const shouldShow =
      process.env.NODE_ENV === "development" ||
      localStorage.getItem("debug_performance") === "true";

    if (!shouldShow) return;

    setIsVisible(true);

    // Basic performance metrics collection
    const collectMetrics = () => {
      try {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          setMetrics((prev) => ({
            ...prev,
            ttfb: navigation.responseStart - navigation.requestStart,
          }));
        }

        // FCP (First Contentful Paint)
        const fcp = performance
          .getEntriesByType("paint")
          .find((entry) => entry.name === "first-contentful-paint");
        if (fcp) {
          setMetrics((prev) => ({ ...prev, fcp: fcp.startTime }));
        }

        // Observe LCP and CLS with PerformanceObserver if available
        if (typeof PerformanceObserver !== "undefined") {
          // LCP Observer
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              if (lastEntry) {
                setMetrics((prev) => ({ ...prev, lcp: lastEntry.startTime }));
              }
            });
            lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
          } catch (e) {
            console.debug("LCP observer not supported:", e);
          }

          // CLS Observer
          try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const layoutShiftEntry = entry as PerformanceEntry & {
                  hadRecentInput?: boolean;
                  value?: number;
                };
                if (
                  !layoutShiftEntry.hadRecentInput &&
                  layoutShiftEntry.value
                ) {
                  clsValue += layoutShiftEntry.value;
                }
              }
              setMetrics((prev) => ({ ...prev, cls: clsValue }));
            });
            clsObserver.observe({ entryTypes: ["layout-shift"] });
          } catch (e) {
            console.debug("CLS observer not supported:", e);
          }

          // FID Observer
          try {
            const fidObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const firstInputEntry = entry as PerformanceEntry & {
                  processingStart?: number;
                };
                if (firstInputEntry.processingStart) {
                  setMetrics((prev) => ({
                    ...prev,
                    fid: firstInputEntry.processingStart! - entry.startTime,
                  }));
                }
              }
            });
            fidObserver.observe({ entryTypes: ["first-input"] });
          } catch (e) {
            console.debug("FID observer not supported:", e);
          }
        }
      } catch (e) {
        console.debug("Performance metrics collection error:", e);
      }
    };

    // Collect initial metrics
    collectMetrics();

    // Collect metrics after page load
    if (document.readyState === "complete") {
      collectMetrics();
    } else {
      window.addEventListener("load", collectMetrics);
      return () => window.removeEventListener("load", collectMetrics);
    }
  }, []);

  if (!isVisible) return null;

  const getScoreColor = (
    value: number | null,
    thresholds: { good: number; needs_improvement: number }
  ) => {
    if (value === null) return "text-gray-400";
    if (value <= thresholds.good) return "text-green-500";
    if (value <= thresholds.needs_improvement) return "text-yellow-500";
    return "text-red-500";
  };

  const formatValue = (value: number | null, unit: string) => {
    if (value === null) return "—";
    return `${Math.round(value)}${unit}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg shadow-lg text-xs font-mono">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold">Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
          title="Hide performance monitor"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getScoreColor(metrics.lcp, THRESHOLDS.lcp)}>
            {formatValue(metrics.lcp, "ms")}
          </span>
        </div>
        <div className="flex justify-between">
          <span>FID:</span>
          <span className={getScoreColor(metrics.fid, THRESHOLDS.fid)}>
            {formatValue(metrics.fid, "ms")}
          </span>
        </div>
        <div className="flex justify-between">
          <span>CLS:</span>
          <span
            className={getScoreColor(metrics.cls ? metrics.cls * 1000 : null, {
              good: 100,
              needs_improvement: 250,
            })}
          >
            {metrics.cls !== null ? metrics.cls.toFixed(3) : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getScoreColor(metrics.fcp, THRESHOLDS.fcp)}>
            {formatValue(metrics.fcp, "ms")}
          </span>
        </div>
        <div className="flex justify-between col-span-2">
          <span>TTFB:</span>
          <span className={getScoreColor(metrics.ttfb, THRESHOLDS.ttfb)}>
            {formatValue(metrics.ttfb, "ms")}
          </span>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-gray-400">
        🟢 Good 🟡 Needs Improvement 🔴 Poor
      </div>
    </div>
  );
}
