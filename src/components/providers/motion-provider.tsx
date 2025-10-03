"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface MotionContextValue {
  prefersReducedMotion: boolean;
  isInitialized: boolean;
}

const MotionContext = createContext<MotionContextValue>({
  prefersReducedMotion: false,
  isInitialized: false,
});

export function useMotionPreference() {
  return useContext(MotionContext);
}

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    setIsInitialized(true);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <MotionContext.Provider value={{ prefersReducedMotion, isInitialized }}>
      {children}
    </MotionContext.Provider>
  );
}
