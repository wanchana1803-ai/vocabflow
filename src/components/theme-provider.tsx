"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

// Filter out the React 19 false-positive script tag warning in development
// next-themes intentionally renders a script to prevent theme flash before hydration.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    origError.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    try {
      const isReduced = localStorage.getItem("vocabflow_reduced_motion") === "true";
      document.documentElement.classList.toggle("reduce-motion", isReduced);
    } catch {
      // ignore
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

