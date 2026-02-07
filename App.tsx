
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
import ReloadPrompt from './components/ReloadPrompt';

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

      // Expanded mapping of letters to common phonetic transcriptions for better accuracy
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

      // Better matching: Check if the whole transcript contains the target word
      // or if any word matches the letter/aliases
      const hasWordMatch = transcript.includes(targetWord);

      const hasCharMatch = words.some(w =>
        w === targetChar ||
        phoneticAliases[targetChar]?.includes(w)
      ) || transcript.includes(`${targetChar} `) || transcript.startsWith(`${targetChar} `) || transcript === targetChar;

      // Snappy matching: either they said the word, or the letter, or the combo
      if (hasWordMatch || hasCharMatch) {
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
    <div className="h-screen w-full bg-[#fdfcf0] flex flex-col overflow-hidden select-none pt-[env(safe-area-inset-top)]">
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

      <ReloadPrompt />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
