
import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label, className = "" }) => {
    const percentage = Math.min(Math.max((current / total) * 100, 0), 100);

    return (
        <div className={`w-full flex flex-col items-center gap-2 ${className}`}>
            <div className="w-full max-w-2xl bg-gray-200/50 h-4 rounded-full overflow-hidden backdrop-blur-sm shadow-inner group">
                <div
                    className="h-full transition-all duration-1000 ease-out shadow-lg group-hover:brightness-110"
                    style={{
                        width: `${percentage}%`,
                        background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #8B00FF)',
                        backgroundSize: 'clamp(20rem, 50vw, 42rem) 100%'
                    }}
                />
            </div>
            {label && (
                <p className="text-base text-gray-500 font-kids animate-in fade-in slide-in-from-top-1 duration-500">
                    {label}
                </p>
            )}
        </div>
    );
};

export default ProgressBar;
