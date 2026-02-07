
import React, { useState, useCallback, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { NUMBERS } from '../constants';
import { NumberInfo, GameMode, GameState, LetterCase } from '../types';
import { assetService } from '../services/assets';

// Components
import QuizGame from '../components/QuizGame';
import SpeechChallenge from '../components/SpeechChallenge';
import WinModal from '../components/WinModal';

interface MathPageProps {
    onBack: () => void;
}

const MathPage: React.FC<MathPageProps> = ({ onBack }) => {
    const [state, setState] = useState<GameState>({
        currentLetter: (null as any),
        currentNumber: null,
        mode: GameMode.EXPLORE,
        letterCase: LetterCase.UPPER,
        appSection: (null as any),
    });

    // Quiz & Speech State
    const [quizQueue, setQuizQueue] = useState<number[]>([]);
    const [quizTarget, setQuizTarget] = useState<NumberInfo | null>(null);
    const [quizOptions, setQuizOptions] = useState<NumberInfo[]>([]);
    const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [lastSelectedValue, setLastSelectedValue] = useState<string | null>(null);

    // Speech Challenge Specific State
    const [isListening, setIsListening] = useState(false);
    const [speechTranscript, setSpeechTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    // Win Modal State
    const [showWinModal, setShowWinModal] = useState(false);
    const [winMessage, setWinMessage] = useState('');
    const quizTargetRef = useRef<NumberInfo | null>(quizTarget);
    const quizQueueRef = useRef<number[]>(quizQueue);
    const quizFeedbackRef = useRef<'correct' | 'wrong' | null>(quizFeedback);

    const latestTranscriptRef = useRef('');

    useEffect(() => { quizTargetRef.current = quizTarget; }, [quizTarget]);
    useEffect(() => { quizQueueRef.current = quizQueue; }, [quizQueue]);
    useEffect(() => { quizFeedbackRef.current = quizFeedback; }, [quizFeedback]);

    const setupNextQuizTurn = async (targetValue: number, currentQueue: number[]) => {
        const target = NUMBERS.find(n => n.value === targetValue)!;
        setQuizTarget(target);
        setQuizFeedback(null);
        setLastSelectedValue(null);

        const distractors = NUMBERS
            .filter(n => n.value !== targetValue)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const options = [target, ...distractors].sort(() => Math.random() - 0.5);
        setQuizOptions(options);

        assetService.playNumberSound(target.value);
    };

    const startQuiz = useCallback(() => {
        const shuffled = [...NUMBERS].map(n => n.value).sort(() => Math.random() - 0.5);
        setQuizQueue(shuffled);
        setState(prev => ({ ...prev, mode: GameMode.QUIZ, currentNumber: null }));
        setupNextQuizTurn(shuffled[0], shuffled);
    }, []);

    const startSpeechChallenge = useCallback(() => {
        const shuffled = [...NUMBERS].map(n => n.value).sort(() => Math.random() - 0.5);
        setQuizQueue(shuffled);
        setState(prev => ({ ...prev, mode: GameMode.SPEECH_CHALLENGE, currentNumber: null }));
        const target = NUMBERS.find(n => n.value === shuffled[0])!;
        setQuizTarget(target);
        setQuizFeedback(null);
        setSpeechTranscript('');
    }, []);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, []);

    const startListening = () => {
        if (isListening) return;
        setSpeechTranscript('');
        setQuizFeedback(null);
        handleSpeechInput();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const handleSpeechInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                return;
            } catch (e) { }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
            latestTranscriptRef.current = '';
        };

        recognition.onend = () => {
            setIsListening(false);

            const transcript = latestTranscriptRef.current;
            if (!transcript || quizFeedbackRef.current) return;

            const target = quizTargetRef.current;
            const currentQueue = quizQueueRef.current;
            if (!target) return;

            const targetWord = target.word.toLowerCase();
            const targetValue = target.value.toString();

            const words = transcript.split(/\s+/);
            const hasWordMatch = transcript.includes(targetWord);
            const hasValueMatch = words.includes(targetValue);

            if (hasWordMatch || hasValueMatch) {
                setQuizFeedback('correct');
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#ff4444', '#ffbb33', '#99cc00', '#33b5e5', '#aa66cc']
                });
                setTimeout(() => {
                    const nextQueue = currentQueue.slice(1);
                    if (nextQueue.length === 0) {
                        setWinMessage("Incredible! You counted all the numbers!");
                        setShowWinModal(true);
                        assetService.playCommonSound('win_speak');
                        setState(prev => ({ ...prev, mode: GameMode.EXPLORE }));
                    } else {
                        setQuizQueue(nextQueue);
                        const nextTarget = NUMBERS.find(n => n.value === nextQueue[0])!;
                        setQuizTarget(nextTarget);
                        setQuizFeedback(null);
                        setSpeechTranscript('');
                    }
                }, 1500);
            } else {
                setQuizFeedback('wrong');
                setTimeout(() => setQuizFeedback(null), 1500);
            }
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPart = event.results[i][0].transcript.toLowerCase().trim().replace(/[.?!]/g, "");
                if (event.results[i].isFinal) {
                    finalTranscript = transcriptPart;
                } else {
                    interimTranscript = transcriptPart;
                }
            }

            const transcript = (finalTranscript || interimTranscript).toLowerCase().trim();
            if (transcript) {
                setSpeechTranscript(transcript);
                latestTranscriptRef.current = transcript;
            }
        };

        try {
            recognition.start();
        } catch (e) { }
        recognitionRef.current = recognition;
    };

    const handleQuizChoice = async (choice: NumberInfo) => {
        if (quizFeedback || !quizTarget) return;

        setLastSelectedValue(choice.value.toString());

        if (choice.value === quizTarget.value) {
            setQuizFeedback('correct');
            confetti({
                particleCount: 150, spread: 70, origin: { y: 0.6 },
                colors: ['#ff4444', '#ffbb33', '#99cc00', '#33b5e5', '#aa66cc']
            });

            setTimeout(() => {
                const nextQueue = quizQueue.slice(1);
                if (nextQueue.length === 0) {
                    setWinMessage("Yay! You got all numbers right!");
                    setShowWinModal(true);
                    assetService.playCommonSound('win_listen');
                    setState(prev => ({ ...prev, mode: GameMode.EXPLORE }));
                } else {
                    setQuizQueue(nextQueue);
                    setupNextQuizTurn(nextQueue[0], nextQueue);
                }
            }, 2000);
        } else {
            setQuizFeedback('wrong');
            setTimeout(() => {
                setQuizFeedback(null);
                setLastSelectedValue(null);
            }, 2000);
        }
    };

    const handleNumberSelect = (num: NumberInfo) => {
        setState(prev => ({ ...prev, currentNumber: num }));
        assetService.playNumberSound(num.value);
    };

    const backToGrid = () => {
        setState(prev => ({ ...prev, currentNumber: null, mode: GameMode.EXPLORE }));
    };

    const setMode = (mode: GameMode) => {
        setState(prev => ({ ...prev, mode, currentNumber: null }));
    };

    return (
        <div className="h-full w-full flex flex-col overflow-hidden relative">
            <button
                onClick={state.mode === GameMode.EXPLORE && !state.currentNumber ? onBack : backToGrid}
                className="absolute top-4 left-4 z-50 bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg hover:bg-white transition-all text-orange-500 font-kids active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>

            <main className="flex-grow flex flex-col items-center justify-center p-4 overflow-hidden relative">
                {state.mode === GameMode.QUIZ ? (
                    <QuizGame
                        quizQueueLength={quizQueue.length}
                        quizTarget={quizTarget}
                        quizOptions={quizOptions}
                        quizFeedback={quizFeedback}
                        lastSelectedChar={lastSelectedValue}
                        onChoice={handleQuizChoice}
                        onReplayAudio={() => {
                            if (quizTarget) assetService.playNumberSound(quizTarget.value);
                        }}
                        letterCase={state.letterCase}
                        targetType="NUMBER"
                        totalQuestions={NUMBERS.length}
                    />
                ) : state.mode === GameMode.SPEECH_CHALLENGE ? (
                    <SpeechChallenge
                        quizTarget={quizTarget}
                        quizFeedback={quizFeedback}
                        isListening={isListening}
                        speechTranscript={speechTranscript}
                        quizQueueLength={quizQueue.length}
                        onStartListening={startListening}
                        onStopListening={stopListening}
                        letterCase={state.letterCase}
                        targetType="NUMBER"
                        totalQuestions={NUMBERS.length}
                    />
                ) : state.currentNumber ? (
                    <div className="flex flex-col items-center bg-white rounded-3xl p-4 md:p-8 shadow-xl border-4 border-dashed border-gray-200 relative overflow-hidden w-full max-w-4xl max-h-full animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full justify-center overflow-auto py-4">
                            <div className="flex flex-col items-center animate-bounce-slow shrink-0">
                                <div className={`text-7xl md:text-9xl font-kids ${state.currentNumber.color} text-white w-32 h-32 md:w-56 md:h-56 flex items-center justify-center rounded-3xl shadow-lg transform rotate-[-5deg]`}>
                                    {state.currentNumber.value}
                                </div>
                                <h2 className="text-3xl md:text-5xl font-kids text-gray-800 mt-4 md:mt-8 text-center text-orange-600">
                                    {state.currentNumber.word}
                                </h2>
                            </div>

                            <div className="flex flex-col items-center justify-center min-h-[200px]">
                                <div className="relative group">
                                    <div className="relative shrink-0">
                                        <img
                                            src={assetService.getNumberImagePath(state.currentNumber.value)}
                                            alt={state.currentNumber.word}
                                            className="w-48 h-48 md:w-72 md:h-72 object-contain rounded-2xl shadow-lg border-4 border-white transform rotate-[3deg] transition-transform hover:scale-105 bg-white"
                                        />
                                    </div>
                                </div>

                                <p className="mt-4 text-xl md:text-2xl font-kids text-orange-900/60 leading-relaxed italic text-center max-w-xs">
                                    "{state.currentNumber.sentence}"
                                </p>

                                <button
                                    onClick={() => assetService.playNumberSound(state.currentNumber!.value)}
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
                ) : (
                    <div className="h-full w-full flex flex-col items-center relative overflow-hidden">
                        <div className="w-full h-full overflow-y-auto scrollbar-hide px-6 py-10 pb-40">
                            <div className="text-center mb-10">
                                <h1 className="text-5xl md:text-6xl font-kids text-orange-500 mb-2 drop-shadow-sm">Number Magic! ✨</h1>
                                <p className="text-xl md:text-2xl text-orange-900/60 font-kids">Let's count together!</p>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 md:gap-6 w-full max-w-4xl mx-auto pb-10">
                                {NUMBERS.map((num) => (
                                    <button
                                        key={num.value}
                                        onClick={() => handleNumberSelect(num)}
                                        className={`
                      aspect-square rounded-[2rem] flex items-center justify-center text-5xl md:text-6xl font-kids text-white shadow-lg
                      transition-all transform hover:-translate-y-3 hover:rotate-2 active:scale-90
                      ${num.color} border-4 border-white
                    `}
                                    >
                                        {num.value}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Truly Floating Navigation Controls */}
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 duration-500 bg-white/40 backdrop-blur-md p-2 rounded-[2.5rem] shadow-2xl border border-white/50">
                            <button
                                onClick={startQuiz}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-kids text-xl md:text-2xl shadow-lg flex items-center gap-2 transform transition-all hover:scale-105 active:scale-95 border-2 border-white"
                            >
                                <span className="text-2xl">🎧</span>
                                Listen
                            </button>
                            <button
                                onClick={startSpeechChallenge}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-kids text-xl md:text-2xl shadow-lg flex items-center gap-2 transform transition-all hover:scale-105 active:scale-95 border-2 border-white"
                            >
                                <span className="text-2xl">🎤</span>
                                Speak
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <WinModal
                show={showWinModal}
                onClose={() => setShowWinModal(false)}
                message={winMessage}
            />
        </div>
    );
};

export default MathPage;
