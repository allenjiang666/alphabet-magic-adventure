
import React from 'react';

interface HomePageProps {
    onSelectAlphabet: () => void;
    onSelectMath: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectAlphabet, onSelectMath }) => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-[#fdfcf0]">
            <div className="text-center mb-16 animate-in fade-in zoom-in duration-700">
                <h1 className="text-7xl md:text-8xl font-kids text-orange-500 mb-4 drop-shadow-md">
                    Magic Lab ✨
                </h1>
                <p className="text-2xl text-orange-900/60 font-kids">
                    Choose your learning adventure!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
                {/* Alphabet Card */}
                <button
                    onClick={onSelectAlphabet}
                    className="group relative bg-white rounded-[3rem] p-10 shadow-xl border-8 border-orange-200 hover:border-orange-400 transition-all transform hover:-translate-y-4 active:scale-95 text-left overflow-hidden"
                >
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-inner">
                            🔤
                        </div>
                        <h2 className="text-4xl font-kids text-orange-600 mb-3">Alphabet Adventure</h2>
                        <p className="text-lg text-orange-900/50 font-kids leading-relaxed">
                            Explore letters, play games, and learn to speak with our magical animals!
                        </p>
                    </div>
                    {/* Decorative floating letters */}
                    <span className="absolute -bottom-10 -right-4 text-9xl font-kids text-orange-50 opacity-10 group-hover:opacity-20 transition-opacity">A</span>
                </button>

                {/* Math Card */}
                <button
                    onClick={onSelectMath}
                    className="group relative bg-white rounded-[3rem] p-10 shadow-xl border-8 border-blue-200 hover:border-blue-400 transition-all transform hover:-translate-y-4 active:scale-95 text-left overflow-hidden"
                >
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-inner">
                            🔢
                        </div>
                        <h2 className="text-4xl font-kids text-blue-600 mb-3">Math Magic</h2>
                        <p className="text-lg text-blue-900/50 font-kids leading-relaxed">
                            Master numbers and solve fun puzzles to become a math wizard!
                        </p>
                    </div>
                    <span className="absolute -bottom-10 -right-4 text-9xl font-kids text-blue-50 opacity-10 group-hover:opacity-20 transition-opacity">123</span>
                </button>
            </div>

            <div className="mt-20 text-center text-orange-900/30 font-kids animate-bounce-slow">
                Tap a world to start! 🚀
            </div>
        </div>
    );
};

export default HomePage;
