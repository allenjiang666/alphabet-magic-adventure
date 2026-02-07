
import React, { useState, useCallback, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ALPHABET } from './constants';
import { LetterInfo, GameMode, GameState, LetterCase } from './types';
import { assetService } from './services/assets';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import QuizGame from './components/QuizGame';
import SpeechChallenge from './components/SpeechChallenge';
import ExploreGrid from './components/ExploreGrid';
import LetterDetail from './components/LetterDetail';
import WinModal from './components/WinModal';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    currentLetter: null,
    mode: GameMode.EXPLORE,
    letterCase: LetterCase.UPPER,
  });

  const [score, setScore] = useState(0);

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

  useEffect(() => { quizTargetRef.current = quizTarget; }, [quizTarget]);
  useEffect(() => { quizQueueRef.current = quizQueue; }, [quizQueue]);

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

  // No auto-start effect anymore, handled by button events.
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

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
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

      const transcript = finalTranscript || interimTranscript;
      if (transcript) {
        setSpeechTranscript(transcript);
      }

      if (!finalTranscript) return; // Only process matching logic for final results

      const target = quizTargetRef.current;
      const currentQueue = quizQueueRef.current;
      if (!target) return;

      const targetChar = target.char.toLowerCase();
      const targetWord = target.word.toLowerCase();

      // Expanded mapping of letters to common phonetic transcriptions for better accuracy
      const phoneticAliases: Record<string, string[]> = {
        'a': ['hey', 'ay', 'a', 'eh', 'aa', 'hey'],
        'b': ['be', 'bee', 'beee', 'bee-bee'],
        'c': ['see', 'sea', 'si', 'cee', 'seee'],
        'd': ['dee', 'deee', 'di'],
        'e': ['ee', 'eee', 'e'],
        'f': ['ef', 'eff', 'efff'],
        'g': ['gee', 'geee', 'ji'],
        'h': ['aitch', 'edge', 'ech', 'aych'],
        'i': ['eye', 'i', 'ai'],
        'j': ['jay', 'jei'],
        'k': ['kay', 'kei', 'que', 'kayy'],
        'l': ['el', 'ell', 'el-el'],
        'm': ['em', 'emm'],
        'n': ['en', 'enn'],
        'o': ['oh', 'o', 'owe', 'ooo'],
        'p': ['pee', 'peee', 'pi'],
        'q': ['cue', 'queue', 'kyu'],
        'r': ['are', 'our', 'or', 'ar'],
        's': ['es', 'ess', 'is', 'yes', 'si', 'esss'],
        't': ['tee', 'tea', 'ti', 'teee'],
        'u': ['you', 'u', 'yu'],
        'v': ['vee', 'veee', 'vi'],
        'w': ['double u', 'w', 'dubya'],
        'x': ['ex', 'eks'],
        'y': ['why', 'y', 'wai'],
        'z': ['zee', 'zed', 'zi', 'zeee']
      };

      const isFullPhrase = transcript.includes(`${targetChar} for ${targetWord}`) ||
        transcript.includes(`${targetChar} for`) ||
        (transcript.includes(`for ${targetWord}`) && transcript.includes(targetChar));

      const isCharMatch = transcript === targetChar || (phoneticAliases[targetChar]?.includes(transcript));
      const isWordMatch = transcript === targetWord || transcript.includes(targetWord);

      if (isFullPhrase || isCharMatch || isWordMatch) {
        setQuizFeedback('correct');
        setScore(s => s + 1);
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
      setScore(s => s + 1);
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
    setState(prev => ({ ...prev, currentLetter: null }));
  };

  const setMode = (mode: GameMode) => {
    setState(prev => ({ ...prev, mode, currentLetter: null }));
  };

  return (
    <div className="h-screen w-full bg-[#fdfcf0] flex flex-col overflow-hidden select-none">
      <Header
        currentMode={state.mode}
        letterCase={state.letterCase}
        onExplore={() => setMode(GameMode.EXPLORE)}
        onQuiz={startQuiz}
        onSpeech={startSpeechChallenge}
        onToggleCase={() => setState(prev => ({
          ...prev,
          letterCase: prev.letterCase === LetterCase.UPPER ? LetterCase.LOWER : LetterCase.UPPER
        }))}
      />

      <main className="flex-grow flex flex-col items-center justify-center p-4 overflow-hidden">
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
          />
        ) : state.currentLetter ? (
          <LetterDetail
            currentLetter={state.currentLetter}
            onBack={backToGrid}
            onHearSound={handleLetterSelect}
            letterCase={state.letterCase}
          />
        ) : (
          <ExploreGrid onLetterSelect={handleLetterSelect} letterCase={state.letterCase} />
        )}
      </main>

      <WinModal
        show={showWinModal}
        onClose={() => setShowWinModal(false)}
        message={winMessage}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
