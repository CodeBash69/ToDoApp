import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Appearance } from 'react-native';

const lightTheme = {
  mode: 'light',
  accent: '#2563eb',
  background: '#f6f8fa',
  card: '#fff',
  border: '#e5e7eb',
  text: '#222',
  textSecondary: '#6b7280',
  inputBackground: '#f9fafb',
  inputBorder: '#e5e7eb',
  button: '#2563eb',
  buttonText: '#fff',
  shadow: 'rgba(0,0,0,0.08)',
  error: '#ef4444',
  success: '#22c55e',
};

const darkTheme = {
  mode: 'dark',
  accent: '#60a5fa',
  background: '#181a20',
  card: '#23262f',
  border: '#23262f',
  text: '#f3f4f6',
  textSecondary: '#a1a1aa',
  inputBackground: '#23262f',
  inputBorder: '#23262f',
  button: '#2563eb',
  buttonText: '#fff',
  shadow: 'rgba(0,0,0,0.32)',
  error: '#f87171',
  success: '#4ade80',
};

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => listener.remove();
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}; 