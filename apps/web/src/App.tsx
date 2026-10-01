import type React from 'react';
import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { EditorShell } from './features/editor/EditorShell';
import { LandingPage } from './features/landing/LandingPage';
import { useThemeStore } from './stores/themeStore';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'editor'>('landing');
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-mono">
      <Navbar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1">
        {currentView === 'landing' ? (
          <LandingPage onStart={() => setCurrentView('editor')} />
        ) : (
          <EditorShell />
        )}
      </main>
    </div>
  );
};
