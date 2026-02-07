import React from 'react';
import { LetterInfo, NumberInfo, LetterCase } from '../types';
import { assetService } from '../services/assets';
import ProgressBar from './ProgressBar';

type TargetInfo = (LetterInfo & { value?: number }) | (NumberInfo & { char?: string });

interface QuizGameProps {
    quizQueueLength: number;
    quizTarget: TargetInfo | null;
    quizOptions: TargetInfo[];
    quizFeedback: 'correct' | 'wrong' | null;
    lastSelectedChar: string | null;
    onChoice: (choice: any) => void;
    onReplayAudio: () => void;
    letterCase: LetterCase;
    targetType: 'ALPHABET' | 'NUMBER';
    totalQuestions: number;
}

const QuizGame: React.FC<QuizGameProps> = ({
    quizQueueLength,
    quizTarget,
    quizOptions,
    quizFeedback,
    lastSelectedChar,
    onChoice,
    onReplayAudio,
    letterCase,
    targetType,
    totalQuestions
}) => {
    const getDisplayValue = (option: TargetInfo) => {
        if (targetType === 'NUMBER' && 'value' in option) return option.value;
        const char = 'char' in option ? option.char : '';
        return letterCase === LetterCase.LOWER ? char.toLowerCase() : char;
    };

    const getIdentifier = (option: TargetInfo) => {
        return targetType === 'NUMBER' && 'value' in option ? option.value.toString() : (option as any).char;
    };

    const getImagePath = (option: TargetInfo) => {
        if (targetType === 'NUMBER' && 'value' in option) return assetService.getNumberImagePath(option.value);
        return assetService.getImagePath((option as any).char);
    };

    const progress = totalQuestions - quizQueueLength;

    return (
        <div className="w-full h-full max-w-4xl flex flex-col items-center justify-between">
            <div className="flex flex-row items-center justify-center gap-4 mt-2">
                <p className="text-xl md:text-3xl font-kids text-gray-700">
                    Which {targetType === 'NUMBER' ? 'number' : 'letter'} do you hear?
                </p>
                <button
                    onClick={onReplayAudio}
                    className="bg-orange-400 hover:bg-orange-500 text-white p-3 rounded-full shadow-lg transition-all active:scale-90"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-lg flex-grow py-4">
                {quizOptions.map((option) => {
                    const id = getIdentifier(option);
                    const isTarget = id === getIdentifier(quizTarget!);
                    return (
                        <button
                            key={id}
                            onClick={() => onChoice(option)}
                            disabled={!!quizFeedback}
                            className={`
                                ${option.color} rounded-2xl shadow-xl flex items-center justify-center text-white text-6xl font-kids transform transition-all 
                                ${!quizFeedback ? 'hover:scale-105 active:scale-95' : ''}
                                ${quizFeedback === 'correct' && isTarget ? 'ring-8 ring-green-400 animate-bounce z-10' : ''}
                                ${quizFeedback === 'wrong' && id === lastSelectedChar ? 'ring-8 ring-red-400' : ''}
                                ${quizFeedback && id !== lastSelectedChar ? 'opacity-50 grayscale' : ''}
                                overflow-hidden
                            `}
                        >
                            {quizFeedback && id === lastSelectedChar ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={getImagePath(option)}
                                        alt={option.word}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <span className="text-white text-4xl font-kids drop-shadow-lg">
                                            {getDisplayValue(option)}
                                        </span>
                                    </div>
                                </div>
                            ) : getDisplayValue(option)}
                        </button>
                    );
                })}
            </div>

            <div className="w-full flex flex-col items-center">
                {quizFeedback ? (
                    <div className={`text-2xl font-kids animate-bounce h-8 ${quizFeedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                        {quizFeedback === 'correct' ? 'Great Job! 🌟' : 'Try again later! 😊'}
                    </div>
                ) : <div className="h-8" />}

                <ProgressBar
                    current={progress}
                    total={totalQuestions}
                    label={`${progress} / ${totalQuestions} done!`}
                    className="mt-6 mb-2"
                />
            </div>
        </div>
    );
};

export default QuizGame;
