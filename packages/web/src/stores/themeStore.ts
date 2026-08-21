import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('jingju-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggle: () => set((s) => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('jingju-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
}));

// Apply theme attribute to document on init
if (typeof document !== 'undefined') {
  const theme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', theme);
}
