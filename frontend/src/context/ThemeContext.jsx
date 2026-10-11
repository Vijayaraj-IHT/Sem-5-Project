import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const THEME_STORAGE_KEY = 'lexguard_theme';

export const ThemeContext = createContext(null);

/**
 * ThemeProvider component that manages application theme (light / dark).
 * Persists theme selection in localStorage under 'lexguard_theme'
 * and updates document.documentElement class accordingly.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
    } catch {
      // Gracefully handle restricted storage environments
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Gracefully handle storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === 'dark',
    }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Custom hook to consume the ThemeContext.
 *
 * @returns {{
 *   theme: 'light' | 'dark',
 *   setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>,
 *   toggleTheme: () => void,
 *   isDark: boolean
 * }}
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
