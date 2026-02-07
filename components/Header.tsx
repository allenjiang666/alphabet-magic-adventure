
import React from 'react';
import { GameMode, LetterCase } from '../types';

interface HeaderProps {
    currentMode: GameMode;
    letterCase: LetterCase;
    onExplore: () => void;
    onQuiz: () => void;
    onSpeech: () => void;
    onToggleCase: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentMode, letterCase, onExplore, onQuiz, onSpeech, onToggleCase }) => {
    return (
        <header className="w-full flex flex-col items-center py-2 px-4 border-b border-orange-100 bg-white/50">
            <h1 className="text-2xl md:text-3xl font-kids text-orange-500 drop-shadow-sm text-center">
                Alphabet Magic ✨
            </h1>

            <nav className="flex flex-wrap justify-center gap-2 mt-2">
                <button
                    onClick={onExplore}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${currentMode === GameMode.EXPLORE
                        ? 'bg-orange-500 text-white scale-105'
                        : 'bg-white text-orange-500 border-2 border-orange-500 hover:bg-orange-50'
                        }`}
                >
                    Explore
                </button>
                <button
                    onClick={onQuiz}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md ${currentMode === GameMode.QUIZ
                        ? 'bg-green-500 text-white scale-105'
                        : 'bg-white text-green-500 border-2 border-green-500 hover:bg-green-50'
                        }`}
                >
                    Listen 🎧
                </button>
                <button
                    onClick={onSpeech}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md ${currentMode === GameMode.SPEECH_CHALLENGE
                        ? 'bg-blue-500 text-white scale-105'
                        : 'bg-white text-blue-500 border-2 border-blue-500 hover:bg-blue-50'
                        }`}
                >
                    Speak 🎤
                </button>

                <div className="w-[1px] h-6 bg-orange-100 mx-1" />

                <button
                    onClick={onToggleCase}
                    className="flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-50/50 hover:bg-orange-100/50 transition-all border border-orange-200"
                >
                    <span className={`text-[10px] font-bold ${letterCase === LetterCase.UPPER ? 'text-orange-600' : 'text-gray-400'}`}>ABC</span>
                    <div className="w-7 h-3.5 bg-gray-200 rounded-full relative">
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-300 ${letterCase === LetterCase.UPPER ? 'left-4 bg-orange-500' : 'left-0.5 bg-gray-400'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${letterCase === LetterCase.LOWER ? 'text-orange-600' : 'text-gray-400'}`}>abc</span>
                </button>
            </nav>
        </header>
    );
};

export default Header;
