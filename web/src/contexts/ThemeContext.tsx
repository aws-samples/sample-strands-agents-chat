import React, { createContext, useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, ThemeContextType } from '../types/theme';

// Zustand store interface
interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Create Zustand store with persistence
const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme: Theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'theme-preference',
    }
  )
);

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Export for useTheme hook
export { ThemeContext };

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, toggleTheme } = useThemeStore();

  // Effect to handle document class manipulation
  useEffect(() => {
    try {
      // Apply or remove dark class on document element for Tailwind dark mode
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch (error) {
      console.warn('Failed to apply theme:', error);
    }
  }, [theme]);

  // Context value
  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
