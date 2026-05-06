import React, { useState } from 'react';
import { QuizQuestion, QuestionType } from '../types';
import { generateQuiz } from '../services/geminiService';
import Loader from './Loader';

interface QuizCreatorProps {
    onQuizCreated: (title: string, quiz: QuizQuestion[]) => void;
    onCancel: () => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ onQuizCreated, onCancel }) => {
    const [mode, setMode] = useState<'manual' | 'ai'>('ai');
    
    // AI Form State
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [qType, setQType] = useState('MCQ');
    const [category, setCategory] = useState('Conceptual');
    const [count, setCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);

    // Manual Form State
    const [quizTitle, setQuizTitle] = useState('Custom Assessment');
    const [questions, setQuestions] = useState<QuizQuestion[]>([
        { question: '', options: ['', ''], correctAnswer: [], type: QuestionType.MCQ }
    ]);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError("Please enter a topic.");
            return;
        }
        setError(null);
        setIsGenerating(true);
        try {
            const generated = await generateQuiz(topic, difficulty, qType, category, count);
            setQuizTitle(generated.title || `${topic} Quiz`);
            setQuestions(generated.questions);
            setMode('manual');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate quiz.");
        } finally {
            setIsGenerating(false);
        }
    };

    const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex].options = newOptions;
        
        // Remove from correct answers if it was selected and its value changed (mostly handled by index mapping in UI though, but if we store strings directly we might need to sync. Or we can just let it be and validate at submit).
        setQuestions(newQuestions);
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.push('');
        setQuestions(newQuestions);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.splice(oIndex, 1);
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { question: '', options: ['', ''], correctAnswer: [], type: QuestionType.MCQ }]);
    };

    const removeQuestion = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(qIndex, 1);
        setQuestions(newQuestions);
    };

    const toggleCorrectAnswer = (qIndex: number, optionValue: string) => {
        const newQuestions = [...questions];
        const q = newQuestions[qIndex];
        
        if (q.type === QuestionType.MCQ) {
            // For MCQ, replace array with a single item
            q.correctAnswer = [optionValue];
        } else {
            // For MSQ, toggle presence
            if (q.correctAnswer.includes(optionValue)) {
                q.correctAnswer = q.correctAnswer.filter(val => val !== optionValue);
            } else {
                q.correctAnswer.push(optionValue);
            }
        }
        setQuestions(newQuestions);
    };

    const handleSubmit = () => {
        // Validation
        setError(null);
        let isValid = true;
        let errorMessage = '';

        questions.forEach((q, i) => {
            if (!q.question.trim()) {
                isValid = false;
                errorMessage = `Question ${i + 1} cannot be empty.`;
            }
            if (q.options.some(o => !o.trim())) {
                isValid = false;
                errorMessage = `Options for Question ${i + 1} cannot be empty.`;
            }
            if (new Set(q.options).size !== q.options.length) {
                isValid = false;
                errorMessage = `Options for Question ${i + 1} must be unique.`;
            }
            if (q.correctAnswer.length === 0) {
                isValid = false;
                errorMessage = `Question ${i + 1} must have at least one correct answer.`;
            }
        });

        if (!isValid) {
            setError(errorMessage);
            return;
        }

        onQuizCreated(quizTitle, questions);
    };

    if (isGenerating) {
        return <Loader text="Generating custom quiz with Gemini..." />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">Create Custom Quiz</h2>
                 <button onClick={onCancel} className="text-slate-400 hover:text-white">Cancel</button>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-lg w-fit border border-slate-700">
                <button 
                    onClick={() => setMode('ai')} 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'ai' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Generate with AI
                </button>
                <button 
                    onClick={() => setMode('manual')} 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Write Manually
                </button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg" role="alert">{error}</div>}

            {mode === 'ai' && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">What topic do you want to learn?</label>
                        <input 
                            type="text" 
                            value={topic} 
                            onChange={e => setTopic(e.target.value)} 
                            placeholder="e.g. Neuroscience, Python Generators, French Revolution"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Difficulty</label>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500">
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                                <option>Expert</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Question Style</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500">
                                <option>Conceptual</option>
                                <option>Scenario-based</option>
                                <option>Case Studies</option>
                                <option>Mix</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Format</label>
                            <select value={qType} onChange={e => setQType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500">
                                <option value="MCQ">Single Choice (MCQ)</option>
                                <option value="MSQ">Multiple Choice (MSQ)</option>
                                <option value="Mix">Mix of both</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Number of Questions ({count})</label>
                            <input 
                                type="range" 
                                min="3" max="15" 
                                value={count} 
                                onChange={e => setCount(parseInt(e.target.value))}
                                className="w-full accent-sky-500"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        ✨ Generate Quiz
                    </button>
                </div>
            )}

            {mode === 'manual' && (
                <>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Assessment Title</label>
                            <input 
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 font-semibold"
                                placeholder="e.g. History 101 Midterm"
                            />
                        </div>
                    </div>

                    {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 relative">
                    {questions.length > 1 && (
                        <button 
                            onClick={() => removeQuestion(qIndex)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Question {qIndex + 1}</label>
                        <textarea 
                            value={q.question} 
                            onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500"
                            rows={2}
                            placeholder="Enter your question..."
                        />
                    </div>

                    <div className="flex gap-4 items-center">
                         <label className="text-sm font-medium text-slate-400">Type:</label>
                         <select 
                            value={q.type}
                            onChange={(e) => {
                                updateQuestion(qIndex, { type: e.target.value as QuestionType, correctAnswer: [] })
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
                         >
                            <option value={QuestionType.MCQ}>Single Choice (MCQ)</option>
                            <option value={QuestionType.MSQ}>Multiple Choice (MSQ)</option>
                         </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Options & Correct Answers</label>
                        <div className="space-y-2">
                            {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        onClick={() => toggleCorrectAnswer(qIndex, opt)}
                                        disabled={!opt.trim()}
                                        className={`w-6 h-6 shrink-0 rounded flex items-center justify-center border ${q.correctAnswer.includes(opt) && opt.trim() ? 'bg-sky-500 border-sky-500' : 'border-slate-600 hover:border-sky-400'} ${!opt.trim() && 'opacity-50 cursor-not-allowed'}`}
                                    >
                                        {q.correctAnswer.includes(opt) && opt.trim() && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                    <input 
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500 text-sm"
                                        placeholder={`Option ${oIndex + 1}`}
                                    />
                                    {q.options.length > 2 && (
                                        <button onClick={() => removeOption(qIndex, oIndex)} className="text-slate-500 hover:text-red-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => addOption(qIndex)} className="mt-3 text-sky-400 text-sm hover:text-sky-300 font-medium">+ Add Option</button>
                    </div>
                </div>
            ))}

            <div className="flex gap-4">
                <button 
                    onClick={addQuestion}
                    className="flex-1 py-3 px-4 border border-dashed border-slate-600 rounded-xl text-slate-300 hover:text-white hover:border-slate-400 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                    + Add New Question
                </button>
                <button 
                    onClick={handleSubmit}
                    className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    Save & Start Quiz
                </button>
            </div>
            </>
            )}
        </div>
    );
};
