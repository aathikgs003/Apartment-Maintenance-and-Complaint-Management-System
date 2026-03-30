import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => toggleTheme()}
      className="inline-flex items-center justify-center p-2 rounded-full hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
    >
      {theme === 'dark' ? (
        <SunIcon className="h-6 w-6 text-yellow-400" />
      ) : (
        <MoonIcon className="h-6 w-6 text-text-secondary" />
      )}
    </button>
  );
};

export default ThemeToggle;
