
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { assetService } from '../services/assets';

interface WinModalProps {
    show: boolean;
    onClose: () => void;
    message: string;
}

const WinModal: React.FC<WinModalProps> = ({ show, onClose, message }) => {
    useEffect(() => {
        if (show) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            // Play a short celebration sound using Web Audio API
            const playWinSound = () => {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (ctx.state === 'suspended') ctx.resume();

                const playNote = (freq: number, start: number, duration: number) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, start);
                    gain.gain.setValueAtTime(0.1, start);
                    gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(start);
                    osc.stop(start + duration);
                };

                const now = ctx.currentTime;
                playNote(523.25, now, 0.1); // C5
                playNote(659.25, now + 0.1, 0.1); // E5
                playNote(783.99, now + 0.2, 0.1); // G5
                playNote(1046.50, now + 0.3, 0.4); // C6
            };

            playWinSound();

            return () => clearInterval(interval);
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-8 border-orange-400 max-w-sm w-full text-center transform animate-in zoom-in duration-300">
                <div className="relative mb-6">
                    <img
                        src={assetService.getCommonImagePath('trophy')}
                        alt="Trophy"
                        className="w-48 h-48 mx-auto animate-bounce-slow"
                    />
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                        <span className="text-6xl animate-ping opacity-50">✨</span>
                    </div>
                </div>

                <h2 className="text-4xl font-kids text-orange-500 mb-4 drop-shadow-sm">
                    You Won!
                </h2>
                <p className="text-2xl font-kids text-gray-700 mb-8 leading-tight">
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-kids text-2xl py-4 rounded-2xl shadow-xl transform transition-all active:scale-95 hover:scale-105"
                >
                    Keep Playing! 🎈
                </button>
            </div>
        </div>
    );
};

export default WinModal;
