
import React from 'react';

interface HeaderProps {
    onRestart: () => void;
    showRestart: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRestart, showRestart }) => {
    return (
        <header className="flex justify-between items-center pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-sky-400">
                    <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-6.75a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
                </svg>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-200 tracking-tight">
                    Gemini Quiz Analyzer
                </h1>
            </div>
            {showRestart && (
                <button 
                    onClick={onRestart} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l3.181 3.183M3.553 12.004a8.25 8.25 0 0111.664 0l3.181 3.183m0 0l-3.181-3.183m0 0l3.181 3.183" />
                    </svg>
                    Start Over
                </button>
            )}
        </header>
    );
};
