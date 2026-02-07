
import React from 'react';

interface FooterProps {
    score: number;
}

const Footer: React.FC<FooterProps> = ({ score }) => {
    return (
        <footer className="w-full bg-white/80 backdrop-blur-md py-2 px-6 flex justify-around border-t border-gray-200">
            <div className="text-sm md:text-lg font-kids text-gray-700">
                🌟 Score: <span className="text-orange-500">{score}</span>
            </div>
        </footer>
    );
};

export default Footer;
