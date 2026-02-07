
import React from 'react';
import { LetterInfo, LetterCase } from '../types';
import { ALPHABET } from '../constants';

interface ExploreGridProps {
    onLetterSelect: (letter: LetterInfo) => void;
    letterCase: LetterCase;
}

const ExploreGrid: React.FC<ExploreGridProps> = ({ onLetterSelect, letterCase }) => {
    return (
        <div className="w-full px-2">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-3 md:gap-4 max-w-7xl mx-auto">
                {ALPHABET.map((item) => (
                    <button
                        key={item.char}
                        onClick={() => onLetterSelect(item)}
                        className={`${item.color} aspect-square rounded-2xl shadow-md transform transition-all hover:scale-105 active:scale-95 flex items-center justify-center text-white text-3xl md:text-5xl font-kids relative group`}
                    >
                        <span className="z-10">
                            {letterCase === LetterCase.LOWER ? item.char.toLowerCase() : item.char}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ExploreGrid;
