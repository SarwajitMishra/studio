// src/components/theme-provider.tsx

"use client";

import { useEffect } from 'react';
import { COLOR_THEMES } from '@/lib/theme';

const applyColorTheme = (color: string) => {
  const theme = COLOR_THEMES[color] || COLOR_THEMES['default'];
  const root = document.documentElement;

  Object.entries(theme.light).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
  
  Object.entries(theme.dark).forEach(([key, value]) => {
    root.style.setProperty(`--theme-dark-${key}`, value);
  });
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply theme mode on initial load
    const storedTheme = localStorage.getItem('theme') || 'light';
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply color theme on initial load
    const storedColor = localStorage.getItem('favoriteColor') || 'default';
    applyColorTheme(storedColor);
  }, []);

  return <>{children}</>;
}

export { applyColorTheme };
