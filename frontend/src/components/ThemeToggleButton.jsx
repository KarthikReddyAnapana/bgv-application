import React, { useEffect, useState } from 'react';

export default function ThemeToggleButton() {
  const getCurrentTheme = () => {
    const fromStorage = window.localStorage.getItem('app-theme');
    if (fromStorage === 'dark' || fromStorage === 'light') return fromStorage;
    const fromDom = document.documentElement.getAttribute('data-theme');
    if (fromDom === 'dark' || fromDom === 'light') return fromDom;
    return 'light';
  };

  const [theme, setTheme] = useState(getCurrentTheme);

  useEffect(() => {
    const initialTheme = getCurrentTheme();
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    window.localStorage.setItem('app-theme', nextTheme);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{ position: 'fixed', top: 16, right: 20, zIndex: 2100 }}
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
