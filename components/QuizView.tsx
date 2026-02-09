
import React, { useState, useEffect } from 'react';
import { QuizQuestion, UserAnswer, QuestionType, ValidationSensitivity } from '../types';

interface QuizViewProps {
    questions: QuizQuestion[];
    userAnswers: UserAnswer[];
    currentIndex: number;
    validationSensitivity: ValidationSensitivity;
    onNavigate: (index: number) => void;
    onAnswerUpdate: (index: number, updatedAnswer: Partial<UserAnswer>) => void;
    onComplete: (answers: UserAnswer[]) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, userAnswers, currentIndex, validationSensitivity, onNavigate, onAnswerUpdate, onComplete }) => {
    const [recalledAnswer, setRecalledAnswer] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    
    const currentQuestion = questions[currentIndex];

    useEffect(() => {
        const currentAnswer = userAnswers[currentIndex];
        if (currentAnswer) {
            setRecalledAnswer(currentAnswer.recalledAnswer || '');
            setSelectedOptions(currentAnswer.finalAnswer || []);
            // Show options immediately if the user has already provided a recalled answer or has selected a final answer
            setShowOptions(!!currentAnswer.recalledAnswer || (currentAnswer.finalAnswer && currentAnswer.finalAnswer.length > 0));
        } else {
             // Reset for new questions
            setRecalledAnswer('');
            setSelectedOptions([]);
            setShowOptions(false);
        }
    }, [currentIndex, userAnswers]);

    const handleRecalledSubmit = () => {
        if (recalledAnswer.trim() === '') return;
        onAnswerUpdate(currentIndex, { recalledAnswer });
        setShowOptions(true);
    };

    const handleOptionToggle = (option: string) => {
        if (currentQuestion.type === QuestionType.MCQ) {
            setSelectedOptions([option]);
        } else {
            setSelectedOptions(prev => 
                prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
            );
        }
    };
    
    const handleNavigation = (nextIndex: number) => {
         // Save current state before navigating
        onAnswerUpdate(currentIndex, { recalledAnswer, finalAnswer: selectedOptions });
        onNavigate(nextIndex);
    }

    const completeQuiz = () => {
        const finalAnswers = [...userAnswers];
        finalAnswers[currentIndex] = { ...finalAnswers[currentIndex], recalledAnswer, finalAnswer: selectedOptions };
        onComplete(finalAnswers);
    }

    if (!currentQuestion) {
        return <div className="text-center p-8">Loading question...</div>;
    }

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700">
                <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8">{currentQuestion.question}</p>
                
                {!showOptions ? (
                    <div className="flex flex-col animate-fade-in">
                        <label htmlFor="recalled-answer" className="text-slate-400 mb-2 font-medium">Optional: Type your answer before seeing the options</label>
                        <textarea
                            id="recalled-answer"
                            rows={4}
                            value={recalledAnswer}
                            onChange={(e) => setRecalledAnswer(e.target.value)}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                            placeholder="Recall the answer..."
                        />
                        <div className="mt-4 flex justify-end items-center gap-4">
                            <button onClick={() => setShowOptions(true)} className="px-6 py-3 bg-slate-600/50 text-slate-300 font-bold rounded-lg hover:bg-slate-600 transition-colors duration-300">
                                Skip
                            </button>
                            <button onClick={handleRecalledSubmit} disabled={!recalledAnswer.trim()} className="px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors duration-300">
                                Continue to Options
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {recalledAnswer && (
                            <div className="mb-6 p-4 border-l-4 border-slate-600 bg-slate-900/50 rounded-r-lg">
                                <p className="text-slate-400 text-sm font-medium mb-1">Your Recalled Answer:</p>
                                <p className="text-slate-200 italic">{recalledAnswer}</p>
                            </div>
                        )}
                        <h4 className="font-semibold text-slate-300 mb-4">
                            Choose the correct option(s):
                            {currentQuestion.type === QuestionType.MSQ && <span className="text-slate-400 font-normal ml-2">(Select all that apply)</span>}
                        </h4>
                        <div className="space-y-3">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleOptionToggle(option)}
                                    className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center ${selectedOptions.includes(option) ? 'bg-sky-500/20 border-sky-500 ring-2 ring-sky-500' : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'}`}
                                >
                                    <div className={`w-5 h-5 mr-4 flex-shrink-0 border-2 flex items-center justify-center ${selectedOptions.includes(option) ? 'border-sky-400 bg-sky-500' : 'border-slate-500'} ${currentQuestion.type === QuestionType.MSQ ? 'rounded-md' : 'rounded-full'}`}>
                                       {selectedOptions.includes(option) && currentQuestion.type === QuestionType.MSQ && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-white"><path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" /></svg>}
                                    </div>
                                    <span>{option}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-between items-center">
                            <button onClick={() => handleNavigation(currentIndex - 1)} disabled={currentIndex === 0} className="px-6 py-3 bg-slate-600/50 text-slate-300 font-bold rounded-lg hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors duration-300">
                                Previous
                            </button>
                            {currentIndex < questions.length - 1 ? (
                                <button onClick={() => handleNavigation(currentIndex + 1)} disabled={selectedOptions.length === 0} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300">
                                    Next Question
                                </button>
                            ) : (
                                <button onClick={completeQuiz} disabled={selectedOptions.length === 0} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300">
                                    Finish & See Report
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizView;