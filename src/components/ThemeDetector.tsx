"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeDetector() {
  const { theme, resolvedTheme } = useTheme();
  
  useEffect(() => {
    // Apply theme class to document element
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    const currentTheme = resolvedTheme || theme;
    if (currentTheme) {
      root.classList.add(currentTheme);
    }
  }, [theme, resolvedTheme]);
  
  // This component doesn't render anything
  return null;
} 