import { Moon, Sun } from 'lucide-react';
import type React from 'react';
import { useThemeStore } from '../stores/themeStore';

interface NavbarProps {
  currentView: 'landing' | 'editor';
  onNavigate: (view: 'landing' | 'editor') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { spotColor, effectiveDarkMode, toggleSpotColor, toggleDarkMode } = useThemeStore();

  return (
    <header className="border-b border-chrome-border bg-chrome px-4 py-3 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 font-mono font-bold tracking-tight text-lg hover:opacity-80 transition-opacity"
        >
          <span className="w-4 h-4 bg-spot inline-block" />
          <span className="text-ink">OruZine</span>
        </button>
        <span className="text-xs px-2 py-0.5 border border-chrome-border font-mono text-ink/70 rounded">
          v0.1.0-alpha
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Spot color toggle */}
        <button
          type="button"
          onClick={toggleSpotColor}
          className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 border border-chrome-border hover:bg-paper transition-colors"
          title={`Switch spot color (currently ${spotColor})`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: spotColor === 'pink' ? '#ff2d6b' : '#0078ff' }}
          />
          <span className="capitalize text-ink">{spotColor}</span>
        </button>

        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-1.5 border border-chrome-border hover:bg-paper transition-colors text-ink"
          title={effectiveDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {effectiveDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Navigation / GitHub */}
        {currentView === 'landing' ? (
          <button
            type="button"
            onClick={() => onNavigate('editor')}
            className="text-xs font-mono font-bold px-3 py-1.5 bg-spot text-spot-contrast hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <span>Open Editor</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="text-xs font-mono px-3 py-1.5 border border-chrome-border hover:bg-paper transition-colors text-ink"
          >
            Home
          </button>
        )}

        <a
          href="https://github.com/AinzAmour/OruZine"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 border border-chrome-border hover:bg-paper transition-colors text-ink"
          title="GitHub Repository"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <title>GitHub</title>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
