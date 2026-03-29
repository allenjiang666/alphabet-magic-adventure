import React, { useState } from 'react';
import { assetService } from '../services/assets';

interface LotteryWheelProps {
    colors: string[];
    onSpinComplete: (result: number) => void;
    disabled?: boolean;
    isGameOver?: boolean;
}

const LotteryWheel: React.FC<LotteryWheelProps> = ({ colors, onSpinComplete, disabled, isGameOver }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);

    const handleSpin = () => {
        if (isSpinning || disabled) return;
        
        setIsSpinning(true);
        assetService.playSimpleSound('spin');
        
        const result = Math.floor(Math.random() * 10) + 1;
        
        const targetAngle = 360 - ((result - 1) * 36);
        const randomJitter = Math.floor(Math.random() * 20) - 10; 
        
        const currentSpins = Math.floor(wheelRotation / 360);
        const newRotation = (currentSpins + 5) * 360 + targetAngle + randomJitter;
        
        setWheelRotation(newRotation);

        setTimeout(() => {
            setIsSpinning(false);
            onSpinComplete(result);
        }, 3000); 
    };

    return (
        <button
            onClick={handleSpin}
            disabled={isSpinning || disabled}
            className={`
                relative w-36 h-36 md:w-56 md:h-56 xl:w-64 xl:h-64 rounded-[50%] border-[4px] md:border-[8px] xl:border-[10px] border-white shadow-2xl flex items-center justify-center transition-all bg-white
                ${isSpinning ? '' : 'hover:scale-105 active:scale-95'}
                ${disabled && !isSpinning && !isGameOver ? 'opacity-80 scale-95' : ''}
                ${isGameOver ? 'opacity-40 grayscale' : ''}
            `}
        >
            {/* The Wheel */}
            <div className="absolute inset-0 rounded-full overflow-hidden mask-circle">
                <div 
                    className="w-full h-full relative transition-transform duration-[3000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                    {Array.from({ length: 10 }).map((_, i) => {
                        const rot = i * 36;
                        const colorClass = colors[i % colors.length];
                        
                        return (
                            <div 
                                key={i} 
                                className={`absolute top-0 left-1/2 w-[34%] h-[50%] origin-bottom flex items-start justify-center pt-1 md:pt-2 border-r border-white/20 ${colorClass}`}
                                style={{ 
                                    transform: `translateX(-50%) rotate(${rot}deg)`, 
                                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)'
                                }}
                            >
                                <span className="font-kids text-white text-lg md:text-3xl xl:text-5xl drop-shadow-sm font-bold z-10">{i + 1}</span>
                            </div>
                        );
                    })}
                    
                    {/* Inner hole */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 xl:w-16 xl:h-16 bg-white rounded-full shadow-inner z-20"></div>
                </div>
            </div>
        
            {/* Pointer */}
            <div className="absolute -top-5 md:-top-7 xl:-top-8 left-1/2 -translate-x-1/2 w-10 md:w-14 xl:w-16 h-10 md:h-14 xl:h-16 text-orange-500 drop-shadow-xl z-50 pointer-events-none">
                <svg fill="currentColor" viewBox="0 0 24 24" className="filter drop-shadow-md">
                    <path stroke="white" strokeWidth="2" strokeLinejoin="round" d="M12 22 L4 6 L20 6 Z" />
                </svg>
            </div>
            
            {/* Inner shadow overlay for depth */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.2)] pointer-events-none z-40 border-2 border-white/20"></div>
        </button>
    );
};

export default LotteryWheel;
