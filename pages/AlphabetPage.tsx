
import React, { useState, useCallback, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ALPHABET } from '../constants';
import { LetterInfo, GameMode, GameState, LetterCase } from '../types';
import { assetService } from '../services/assets';

// Components
import QuizGame from '../components/QuizGame';
import SpeechChallenge from '../components/SpeechChallenge';
import ExploreGrid from '../components/ExploreGrid';
import LetterDetail from '../components/LetterDetail';
import WinModal from '../components/WinModal';

interface AlphabetPageProps {
    onBack: () => void;
}

const AlphabetPage: React.FC<AlphabetPageProps> = ({ onBack }) => {
    const [state, setState] = useState<GameState>({
        currentLetter: null,
        mode: GameMode.EXPLORE,
        letterCase: LetterCase.UPPER,
        appSection: (null as any), // Internal state for alphabet doesn't strictly need this but types require it
    });

    // Quiz & Speech State
    const [quizQueue, setQuizQueue] = useState<string[]>([]);
    const [quizTarget, setQuizTarget] = useState<LetterInfo | null>(null);
    const [quizOptions, setQuizOptions] = useState<LetterInfo[]>([]);
    const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [lastSelectedChar, setLastSelectedChar] = useState<string | null>(null);

    // Speech Challenge Specific State
    const [isListening, setIsListening] = useState(false);
    const [speechTranscript, setSpeechTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    // Win Modal State
    const [showWinModal, setShowWinModal] = useState(false);
    const [winMessage, setWinMessage] = useState('');
    const quizTargetRef = useRef<LetterInfo | null>(quizTarget);
    const quizQueueRef = useRef<string[]>(quizQueue);
    const quizFeedbackRef = useRef<'correct' | 'wrong' | null>(quizFeedback);

    const latestTranscriptRef = useRef('');

    useEffect(() => { quizTargetRef.current = quizTarget; }, [quizTarget]);
    useEffect(() => { quizQueueRef.current = quizQueue; }, [quizQueue]);
    useEffect(() => { quizFeedbackRef.current = quizFeedback; }, [quizFeedback]);

    const setupNextQuizTurn = async (targetChar: string, currentQueue: string[]) => {
        const target = ALPHABET.find(l => l.char === targetChar)!;
        setQuizTarget(target);
        setQuizFeedback(null);
        setLastSelectedChar(null);

        const distractors = ALPHABET
            .filter(l => l.char !== targetChar)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const options = [target, ...distractors].sort(() => Math.random() - 0.5);
        setQuizOptions(options);

        assetService.playLetterSound(target.char);
    };

    const startQuiz = useCallback(() => {
        const shuffled = [...ALPHABET].map(l => l.char).sort(() => Math.random() - 0.5);
        setQuizQueue(shuffled);
        setState(prev => ({ ...prev, mode: GameMode.QUIZ, currentLetter: null }));
        setupNextQuizTurn(shuffled[0], shuffled);
    }, []);

    const startSpeechChallenge = useCallback(() => {
        const shuffled = [...ALPHABET].map(l => l.char).sort(() => Math.random() - 0.5);
        setQuizQueue(shuffled);
        setState(prev => ({ ...prev, mode: GameMode.SPEECH_CHALLENGE, currentLetter: null }));
        const target = ALPHABET.find(l => l.char === shuffled[0])!;
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

            const targetChar = target.char.toLowerCase();
            const targetWord = target.word.toLowerCase();

            const phoneticAliases: Record<string, string[]> = {
                'a': ['hey', 'ay', 'a', 'eh', 'aa', 'aye', 'eight', 'hie'],
                'b': ['be', 'bee', 'beee', 'bee-bee', 'me'],
                'c': ['see', 'sea', 'si', 'cee', 'seee', 'she'],
                'd': ['dee', 'deee', 'di', 'the', 'tea'],
                'e': ['ee', 'eee', 'e', 'he', 'eat'],
                'f': ['ef', 'eff', 'efff', 'if'],
                'g': ['gee', 'geee', 'ji', 'j'],
                'h': ['aitch', 'edge', 'ech', 'aych', 'hey', 'age'],
                'i': ['eye', 'i', 'ai', 'my', 'hi'],
                'j': ['jay', 'jei', 'hey'],
                'k': ['kay', 'kei', 'que', 'kayy', 'ok'],
                'l': ['el', 'ell', 'el-el', 'al', 'all'],
                'm': ['em', 'emm', 'am', 'and'],
                'n': ['en', 'enn', 'and', 'in'],
                'o': ['oh', 'o', 'owe', 'ooo', 'all'],
                'p': ['pee', 'peee', 'pi', 'pea'],
                'q': ['cue', 'queue', 'kyu', 'you'],
                'r': ['are', 'our', 'or', 'ar', 'her'],
                's': ['es', 'ess', 'is', 'yes', 'si', 'esss', 'ice'],
                't': ['tee', 'tea', 'ti', 'teee', 'to', 'two'],
                'u': ['you', 'u', 'yu', 'to'],
                'v': ['vee', 'veee', 'vi', 'we', 'the', 'v'],
                'w': ['double u', 'w', 'dubya', 'w4', 'water', 'with'],
                'x': ['ex', 'eks', 'acts', 'x'],
                'y': ['why', 'y', 'wai', 'hi', 'y'],
                'z': ['zee', 'zed', 'zi', 'zeee', 'the', 'z']
            };

            const words = transcript.split(/\s+/);
            const hasWordMatch = transcript.includes(targetWord);
            const hasCharMatch = words.some(w =>
                w === targetChar ||
                phoneticAliases[targetChar]?.includes(w)
            ) || transcript.includes(`${targetChar} `) || transcript.startsWith(`${targetChar} `) || transcript === targetChar;

            if (hasWordMatch || hasCharMatch) {
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
                        setWinMessage("Amazing! You said all the letters!");
                        setShowWinModal(true);
                        assetService.playCommonSound('win_speak');
                        setState(prev => ({ ...prev, mode: GameMode.EXPLORE }));
                    } else {
                        setQuizQueue(nextQueue);
                        const nextTarget = ALPHABET.find(l => l.char === nextQueue[0])!;
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

        recognition.onerror = (event: any) => {
            console.error("Speech error", event.error);
            setIsListening(false);
            if (event.error === 'no-speech') {
                setSpeechTranscript(' (no sound heard) ');
            }
        };

        try {
            recognition.start();
        } catch (e) { }
        recognitionRef.current = recognition;
    };

    const handleQuizChoice = async (choice: LetterInfo) => {
        if (quizFeedback || !quizTarget) return;

        setLastSelectedChar(choice.char);

        if (choice.char === quizTarget.char) {
            setQuizFeedback('correct');
            confetti({
                particleCount: 150, spread: 70, origin: { y: 0.6 },
                colors: ['#ff4444', '#ffbb33', '#99cc00', '#33b5e5', '#aa66cc']
            });

            setTimeout(() => {
                const nextQueue = quizQueue.slice(1);
                if (nextQueue.length === 0) {
                    setWinMessage("Yay! You finished all letters!");
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
                setLastSelectedChar(null);
            }, 2000);
        }
    };

    const handleLetterSelect = (letter: LetterInfo) => {
        setState(prev => ({ ...prev, currentLetter: letter }));
        assetService.playLetterSound(letter.char);
    };

    const backToGrid = () => {
        setState(prev => ({ ...prev, currentLetter: null, mode: GameMode.EXPLORE }));
    };

    const setMode = (mode: GameMode) => {
        setState(prev => ({ ...prev, mode, currentLetter: null }));
    };

    const toggleCase = () => {
        setState(prev => ({
            ...prev,
            letterCase: prev.letterCase === LetterCase.UPPER ? LetterCase.LOWER : LetterCase.UPPER
        }));
    };

    return (
        <div className="h-full w-full flex flex-col overflow-hidden relative">
            <button
                onClick={state.mode === GameMode.EXPLORE && !state.currentLetter ? onBack : backToGrid}
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
                        lastSelectedChar={lastSelectedChar}
                        onChoice={handleQuizChoice}
                        onReplayAudio={() => {
                            if (quizTarget) assetService.playLetterSound(quizTarget.char);
                        }}
                        letterCase={state.letterCase}
                        targetType="ALPHABET"
                        totalQuestions={26}
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
                        targetType="ALPHABET"
                        totalQuestions={26}
                    />
                ) : state.currentLetter ? (
                    <LetterDetail
                        currentLetter={state.currentLetter}
                        onBack={backToGrid}
                        onHearSound={handleLetterSelect}
                        letterCase={state.letterCase}
                    />
                ) : (
                    <div className="h-full w-full flex flex-col items-center relative overflow-hidden">
                        <div className="w-full h-full overflow-y-auto scrollbar-hide px-6 py-10 pb-40">
                            <div className="text-center mb-8">
                                <h1 className="text-5xl md:text-6xl font-kids text-orange-500 mb-2 drop-shadow-sm">Alphabet Magic! ✨</h1>
                                <p className="text-xl md:text-2xl text-orange-900/60 font-kids">Let's learn our letters!</p>
                            </div>

                            <div className="w-full max-w-5xl mx-auto">
                                <ExploreGrid onLetterSelect={handleLetterSelect} letterCase={state.letterCase} />
                            </div>
                        </div>

                        {/* Truly Floating Navigation Controls */}
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-10 duration-500 bg-white/40 backdrop-blur-md p-2 rounded-[2.5rem] shadow-2xl border border-white/50">
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

                            <div className="w-[1px] h-8 bg-gray-300 mx-1 hidden md:block" />

                            <button
                                onClick={toggleCase}
                                className="bg-white hover:bg-gray-50 text-orange-500 px-3 py-2 rounded-2xl font-kids shadow-md border-2 border-orange-100 flex flex-col items-center justify-center transition-all active:scale-90"
                            >
                                <span className={`text-[10px] leading-tight font-bold ${state.letterCase === LetterCase.UPPER ? 'text-orange-600' : 'text-gray-400'}`}>ABC</span>
                                <div className="w-6 h-3 bg-gray-200 rounded-full relative my-0.5">
                                    <div className={`absolute top-0.5 w-2 h-2 rounded-full transition-all duration-300 ${state.letterCase === LetterCase.UPPER ? 'left-3.5 bg-orange-500' : 'left-0.5 bg-gray-400'}`} />
                                </div>
                                <span className={`text-[10px] leading-tight font-bold ${state.letterCase === LetterCase.LOWER ? 'text-orange-600' : 'text-gray-400'}`}>abc</span>
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

export default AlphabetPage;
