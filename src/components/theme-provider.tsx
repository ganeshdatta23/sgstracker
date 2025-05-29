"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"        // Use `class` strategy (Tailwind-friendly)
      defaultTheme="system"    // Can be "light", "dark", or "system"
      enableSystem={true}      // Enables system theme detection
      disableTransitionOnChange // Avoids animation glitches on theme switch
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
