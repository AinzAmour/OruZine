import { create } from 'zustand';

export type SpotColor = 'pink' | 'blue';
export type ColorMode = 'system' | 'light' | 'dark';

interface ThemeState {
  spotColor: SpotColor;
  colorMode: ColorMode;
  effectiveDarkMode: boolean;
  setSpotColor: (color: SpotColor) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleSpotColor: () => void;
  toggleDarkMode: () => void;
  initTheme: () => void;
}

const getSystemDarkPreference = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyDomTheme = (isDark: boolean, spotColor: SpotColor) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.setAttribute('data-spot', spotColor);
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  spotColor: 'pink',
  colorMode: 'system',
  effectiveDarkMode: false,

  setSpotColor: (spotColor) => {
    set({ spotColor });
    applyDomTheme(get().effectiveDarkMode, spotColor);
    try {
      localStorage.setItem('oruzine_spot_color', spotColor);
    } catch {
      // Ignore storage errors
    }
  },

  setColorMode: (colorMode) => {
    const isDark = colorMode === 'system' ? getSystemDarkPreference() : colorMode === 'dark';
    set({ colorMode, effectiveDarkMode: isDark });
    applyDomTheme(isDark, get().spotColor);
    try {
      localStorage.setItem('oruzine_color_mode', colorMode);
    } catch {
      // Ignore storage errors
    }
  },

  toggleSpotColor: () => {
    const next: SpotColor = get().spotColor === 'pink' ? 'blue' : 'pink';
    get().setSpotColor(next);
  },

  toggleDarkMode: () => {
    const current = get().effectiveDarkMode;
    const nextMode: ColorMode = current ? 'light' : 'dark';
    get().setColorMode(nextMode);
  },

  initTheme: () => {
    let savedSpot: SpotColor = 'pink';
    let savedMode: ColorMode = 'system';

    try {
      const storedSpot = localStorage.getItem('oruzine_spot_color');
      if (storedSpot === 'pink' || storedSpot === 'blue') {
        savedSpot = storedSpot;
      }
      const storedMode = localStorage.getItem('oruzine_color_mode');
      if (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark') {
        savedMode = storedMode;
      }
    } catch {
      // Ignore
    }

    const isDark = savedMode === 'system' ? getSystemDarkPreference() : savedMode === 'dark';
    set({ spotColor: savedSpot, colorMode: savedMode, effectiveDarkMode: isDark });
    applyDomTheme(isDark, savedSpot);

    // Listen to OS dark-mode changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (get().colorMode === 'system') {
          const newDark = e.matches;
          set({ effectiveDarkMode: newDark });
          applyDomTheme(newDark, get().spotColor);
        }
      });
    }
  },
}));
