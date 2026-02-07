import React from 'react';
import { LetterInfo, NumberInfo, LetterCase } from '../types';
import { assetService } from '../services/assets';
import ProgressBar from './ProgressBar';

type TargetInfo = (LetterInfo & { value?: number }) | (NumberInfo & { char?: string });

interface SpeechChallengeProps {
    quizTarget: TargetInfo | null;
    quizFeedback: 'correct' | 'wrong' | null;
    isListening: boolean;
    speechTranscript: string;
    quizQueueLength: number;
    onStartListening: () => void;
    onStopListening: () => void;
    letterCase: LetterCase;
    targetType: 'ALPHABET' | 'NUMBER';
    totalQuestions: number;
}

const SpeechChallenge: React.FC<SpeechChallengeProps> = ({
    quizTarget,
    quizFeedback,
    isListening,
    speechTranscript,
    quizQueueLength,
    onStartListening,
    onStopListening,
    letterCase,
    targetType,
    totalQuestions
}) => {
    const [showHint, setShowHint] = React.useState(false);
    const isCorrect = quizFeedback === 'correct';
    const isWrong = quizFeedback === 'wrong';

    const getIdentifier = (target: TargetInfo | null) => {
        if (!target) return '';
        return targetType === 'NUMBER' && 'value' in target ? target.value.toString() : (target as any).char;
    };

    const getDisplayValue = (target: TargetInfo | null) => {
        if (!target) return '';
        if (targetType === 'NUMBER' && 'value' in target) return target.value;
        const char = 'char' in target ? target.char : '';
        return letterCase === LetterCase.LOWER ? char.toLowerCase() : char;
    };

    const getImagePath = (target: TargetInfo) => {
        if (targetType === 'NUMBER' && 'value' in target) return assetService.getNumberImagePath(target.value);
        return assetService.getImagePath((target as any).char);
    };

    // Reset hint when target changes
    React.useEffect(() => {
        setShowHint(false);
    }, [getIdentifier(quizTarget)]);

    const isFlipped = isCorrect || showHint;
    const progress = totalQuestions - quizQueueLength;

    return (
        <div className="w-full h-full flex flex-col items-center justify-between pb-12 pt-4 px-4 select-none">
            <ProgressBar
                current={progress}
                total={totalQuestions}
                className="mt-2"
            />

            {/* Central Stage: Flip Card Area */}
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
                <div
                    onClick={() => !isCorrect && setShowHint(!showHint)}
                    className={`relative w-64 h-64 md:w-80 md:h-80 perspective-1000 cursor-pointer ${isCorrect ? 'animate-bounce' : ''}`}
                >
                    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                        {/* Front: The Item */}
                        <div className={`absolute inset-0 backface-hidden flex items-center justify-center rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)] text-[10rem] md:text-[14rem] font-kids text-white ${quizTarget?.color} border-8 border-white`}>
                            {getDisplayValue(quizTarget)}
                            {isListening && (
                                <div className="absolute inset-0 rounded-[2.6rem] ring-[12px] ring-white/40 animate-pulse" />
                            )}
                        </div>

                        {/* Back: The Image */}
                        <div className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)] bg-white border-8 border-white overflow-hidden`}>
                            {quizTarget && (
                                <>
                                    <img
                                        src={getImagePath(quizTarget)}
                                        alt={quizTarget.word}
                                        className="w-full h-full object-cover bg-white"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-6">
                                        <span className="text-white text-4xl md:text-5xl font-kids drop-shadow-lg">{quizTarget.word}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls Area */}
            <div className="flex flex-col items-center gap-6 w-full max-w-lg mb-4">
                {/* Transcript Area */}
                <div className="h-14 flex items-center justify-center w-full">
                    {isListening ? (
                        <div className="flex flex-col items-center gap-0 animate-in fade-in duration-300">
                            <span className="text-red-500 font-kids text-base animate-pulse flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                Listening...
                            </span>
                            {speechTranscript && (
                                <p className="text-gray-400 font-kids text-sm italic truncate max-w-[200px]">
                                    "{speechTranscript}..."
                                </p>
                            )}
                        </div>
                    ) : speechTranscript ? (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="bg-white/90 backdrop-blur-sm px-5 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                                <span className="text-blue-600 font-kids text-xl">"{speechTranscript}"</span>
                                {isWrong && <span className="text-2xl animate-shake">❌</span>}
                                {isCorrect && <span className="text-2xl">🌟</span>}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Mic Button */}
                <button
                    onMouseDown={onStartListening}
                    onMouseUp={onStopListening}
                    onMouseLeave={onStopListening}
                    onTouchStart={(e) => { e.preventDefault(); onStartListening(); }}
                    onTouchEnd={(e) => { e.preventDefault(); onStopListening(); }}
                    className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-full shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center relative
                        ${isListening ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-600'}
                        text-white z-10
                    `}
                >
                    {isListening && (
                        <>
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-40 scale-125" />
                        </>
                    )}

                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default SpeechChallenge;
