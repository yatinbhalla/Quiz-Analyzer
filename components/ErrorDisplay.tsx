
import React from 'react';

interface ErrorDisplayProps {
    message: string;
    onClear: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear }) => {
    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-red-900/50 border border-red-500/50 rounded-2xl text-center">
             <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-red-300 mb-2">An Error Occurred</h3>
            <p className="text-red-200 mb-6">{message}</p>
            <button onClick={onClear} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors">
                Try Again
            </button>
        </div>
    );
};
