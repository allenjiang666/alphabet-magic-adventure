
import React, { useState } from 'react';
import { AppSection, GameMode, LetterCase, GameState } from './types';

// Pages
import HomePage from './pages/HomePage';
import AlphabetPage from './pages/AlphabetPage';
import MathPage from './pages/MathPage';

// Shared Components
import ReloadPrompt from './components/ReloadPrompt';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    currentLetter: null,
    mode: GameMode.EXPLORE,
    letterCase: LetterCase.UPPER,
    appSection: AppSection.HOME
  });

  const goToSection = (section: AppSection) => {
    setState(prev => ({ ...prev, appSection: section }));
  };

  const renderContent = () => {
    switch (state.appSection) {
      case AppSection.ALPHABET:
        return <AlphabetPage onBack={() => goToSection(AppSection.HOME)} />;
      case AppSection.MATH:
        return <MathPage onBack={() => goToSection(AppSection.HOME)} />;
      case AppSection.HOME:
      default:
        return (
          <HomePage
            onSelectAlphabet={() => goToSection(AppSection.ALPHABET)}
            onSelectMath={() => goToSection(AppSection.MATH)}
          />
        );
    }
  };

  return (
    <div className="h-screen w-full bg-[#fdfcf0] flex flex-col overflow-hidden select-none pt-[env(safe-area-inset-top)]">
      <main className="flex-grow overflow-hidden relative">
        {renderContent()}
      </main>

      <ReloadPrompt />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
