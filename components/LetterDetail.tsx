
import React from 'react';
import { LetterInfo, LetterCase } from '../types';
import { assetService } from '../services/assets';

interface LetterDetailProps {
    currentLetter: LetterInfo;
    onBack: () => void;
    onHearSound: (letter: LetterInfo) => void;
    letterCase: LetterCase;
}

const LetterDetail: React.FC<LetterDetailProps> = ({
    currentLetter,
    onBack,
    onHearSound,
    letterCase
}) => {
    return (
        <div className="flex flex-col items-center bg-white rounded-3xl p-4 md:p-8 shadow-xl border-4 border-dashed border-gray-200 relative overflow-hidden w-full max-w-4xl max-h-full">
            <button
                onClick={onBack}
                className="absolute top-2 left-2 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>

            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full justify-center overflow-auto py-4">
                <div className="flex flex-col items-center animate-bounce-slow shrink-0">
                    <div className={`text-7xl md:text-9xl font-kids ${currentLetter.color} text-white w-32 h-32 md:w-56 md:h-56 flex items-center justify-center rounded-3xl shadow-lg transform rotate-[-5deg]`}>
                        {letterCase === LetterCase.LOWER ? currentLetter.char.toLowerCase() : currentLetter.char}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-kids text-gray-800 mt-4 md:mt-8 text-center">
                        {currentLetter.word}
                    </h2>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[200px]">
                    <div className="relative group">
                        <div className="relative shrink-0">
                            <img
                                src={assetService.getImagePath(currentLetter.char)}
                                alt={currentLetter.word}
                                className="w-48 h-48 md:w-72 md:h-72 object-cover rounded-2xl shadow-lg border-4 border-white transform rotate-[3deg] transition-transform hover:scale-105"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => onHearSound(currentLetter)}
                        className="mt-4 bg-orange-400 hover:bg-orange-500 text-white px-6 py-2 rounded-xl font-kids text-lg shadow-lg flex items-center gap-2 transform active:scale-95 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        Hear Sound
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LetterDetail;
