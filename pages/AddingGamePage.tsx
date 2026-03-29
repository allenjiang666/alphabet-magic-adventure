import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { assetService } from '../services/assets';
import LotteryWheel from '../components/LotteryWheel';

interface AddingGamePageProps {
    onBack: () => void;
}

const PATH_COLORS = [
    'bg-red-400 hover:bg-red-500',
    'bg-orange-400 hover:bg-orange-500',
    'bg-amber-400 hover:bg-amber-500',
    'bg-green-400 hover:bg-green-500',
    'bg-cyan-400 hover:bg-cyan-500',
    'bg-blue-400 hover:bg-blue-500',
    'bg-violet-400 hover:bg-violet-500',
    'bg-pink-400 hover:bg-pink-500'
];

const AddingGamePage: React.FC<AddingGamePageProps> = ({ onBack }) => {
    const [currentPosition, setCurrentPosition] = useState(0);
    const [spinResult, setSpinResult] = useState<number | null>(null);
    const [shakeBlock, setShakeBlock] = useState<number | null>(null);
    const [showWinVideo, setShowWinVideo] = useState(false);

    const handleBlockClick = (index: number) => {
        if (spinResult === null) return;

        const target = Math.min(100, currentPosition + spinResult);
        
        if (index === target) {
            // Correct move
            setCurrentPosition(target);
            setSpinResult(null);
            assetService.playCommonSound('cheer');
            
            if (target >= 100) {
                setShowWinVideo(true);
                confetti({
                    particleCount: 250, spread: 120, origin: { y: 0.6 },
                    colors: ['#ff4444', '#ffbb33', '#99cc00', '#33b5e5', '#aa66cc']
                });
            } else {
                confetti({
                    particleCount: 80, spread: 60, origin: { y: 0.8 },
                    colors: ['#33b5e5', '#ffbb33', '#ff4444']
                });
            }
        } else {
            // Wrong move
            assetService.playCommonSound('try_again');
            setShakeBlock(index);
            setTimeout(() => setShakeBlock(null), 500);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#fdfcf0] relative overflow-hidden">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-50 bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg hover:bg-white transition-all text-orange-500 font-kids active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>

            <div className="flex-1 flex flex-col items-center justify-start pt-12 md:pt-16 px-4 pb-6 overflow-y-auto overflow-x-hidden h-full">
                
                {/* Main Content Area (Wheel + Path) */}
                <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-center min-h-0 z-0 px-2 lg:px-4 pb-2 gap-6 lg:gap-12">
                    
                    {/* Left Side: Header & Lottery Wheel */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center z-50 order-2 lg:order-1 gap-4 md:gap-8 mt-8 lg:mt-0">
                        {/* Header */}
                        <div className="text-center shrink-0 z-10">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-kids text-green-500 drop-shadow-sm">Number Path</h1>
                            <p className="text-lg md:text-xl text-green-900/60 font-kids mt-1 md:mt-2">Spin the wheel to move your bunny!</p>
                        </div>
                        <LotteryWheel 
                            colors={PATH_COLORS.map(c => c.split(' ')[0])} 
                            onSpinComplete={setSpinResult} 
                            disabled={spinResult !== null || currentPosition >= 100}
                            isGameOver={currentPosition >= 100 && !showWinVideo}
                        />
                    </div>

                    {/* Right Side: The Path Grid */}
                    <div className="w-full flex-1 flex flex-col items-center justify-center max-w-6xl order-1 lg:order-2 h-full pt-16 md:pt-20 lg:pt-16 min-h-0 shrink-0 lg:shrink">
                        <div 
                            className="grid grid-cols-10 grid-rows-[repeat(11,minmax(0,1fr))] w-full mx-auto relative" 
                        style={{ 
                            aspectRatio: '10 / 11',
                            maxHeight: '100%',
                            maxWidth: '100%'
                        }}
                    >
                        {Array.from({ length: 101 }).map((_, i) => {
                            // Calculate snake path numbering naturally
                            const row = Math.floor(i / 10);
                            const val = i === 100 ? 100 : (row % 2 === 1 ? row * 10 + (9 - (i % 10)) : i);
                            const col = i % 10;
                            const colorClass = PATH_COLORS[row % PATH_COLORS.length];
                            
                            return (
                                <div key={val} className="relative w-full h-full flex items-center justify-center">
                                    {/* --- PATH RENDERING (Arrows) --- */}
                                    <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
                                        {/* Right Arrow (Even rows, not last column) */}
                                        {row % 2 === 0 && col < 9 && i < 100 && (
                                            <svg className="absolute right-[-30%] w-[60%] h-[40%] text-orange-300 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6a.996.996 0 10-1.41 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1z" />
                                            </svg>
                                        )}

                                        {/* Left Arrow (Odd rows, not first column) */}
                                        {row % 2 === 1 && col > 0 && i < 100 && (
                                            <svg className="absolute left-[-30%] w-[60%] h-[40%] text-orange-300 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z" />
                                            </svg>
                                        )}

                                        {/* Down Arrow (End of rows) */}
                                        {((row % 2 === 0 && col === 9) || (row % 2 === 1 && col === 0)) && i < 100 && (
                                            <svg className="absolute bottom-[-30%] h-[60%] w-[40%] text-orange-300 drop-shadow-sm z-0" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11 5v11.17l-4.88-4.88c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L13 16.17V5c0-.55-.45-1-1-1s-1 .45-1 1z" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* The Button */}
                                    <button
                                        onClick={() => handleBlockClick(val)}
                                        disabled={spinResult === null && val !== currentPosition}
                                        className={`
                                            relative aspect-square w-[82%] max-h-[90%] flex items-center justify-center rounded-full font-kids text-[10px] sm:text-xs md:text-base lg:text-xl shadow-md transition-all z-10 border-[2px] sm:border-[3px] border-white text-white hover:shadow-lg
                                            ${currentPosition === val ? 'shadow-xl transform scale-[1.3] md:scale-[1.4] z-20 border-white ring-4 ring-white/50 ' + colorClass : colorClass}
                                            ${shakeBlock === val ? 'animate-[shake_0.5s_ease-in-out]' : ''}
                                            ${spinResult !== null ? 'cursor-pointer' : ''}
                                        `}
                                    >
                                        <span className="flex items-center justify-center pointer-events-none drop-shadow-sm mt-[2px] sm:mt-1">
                                            {val === 100 ? <span className="text-xl sm:text-2xl md:text-4xl lg:text-5xl leading-none drop-shadow-md">🏆</span> : val}
                                        </span>
                                        {currentPosition === val && (
                                            <div className="absolute -top-[80%] md:-top-[90%] inset-x-0 flex justify-center pointer-events-none z-30">
                                                <span className="text-xl sm:text-2xl md:text-4xl lg:text-5xl animate-bounce drop-shadow-xl">🐰</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* Victory Video Modal */}
            {showWinVideo && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out]">
                    <div className="w-full max-w-2xl relative flex flex-col items-center">
                        <div className="w-full bg-white p-2 md:p-4 rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.3)] transform transition-transform animate-[bounceIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                            <video 
                                src={assetService.getCommonVideoPath('elsa_congratulation', 'mp4')} 
                                autoPlay 
                                playsInline
                                controls 
                                className="w-full rounded-[1.5rem] bg-black aspect-video object-cover"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setShowWinVideo(false);
                                setCurrentPosition(0);
                            }}
                            className="mt-6 md:mt-8 bg-gradient-to-tr from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 active:scale-95 transition-all text-white font-kids text-2xl md:text-4xl py-3 px-8 md:py-4 md:px-12 rounded-full shadow-[0_10px_0_#c2410c] hover:shadow-[0_6px_0_#c2410c] hover:translate-y-[4px] border-[3px] border-white z-50 animate-[bounce_2s_infinite]"
                        >
                            Play Again!
                        </button>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-5deg); }
                    50% { transform: translateX(5px) rotate(5deg); }
                    75% { transform: translateX(-5px) rotate(-5deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AddingGamePage;
