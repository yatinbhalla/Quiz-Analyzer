
import React, { useState } from 'react';
import { AnalysisReport, QuizQuestion, UserAnswer, QuestionType, ScoreBreakdown } from '../types';
import Chatbot from './Chatbot';

interface ReportViewProps {
    report: AnalysisReport;
    questions: QuizQuestion[];
    userAnswers: UserAnswer[];
    onRestart: () => void;
}

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-green-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-red-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ScorePill: React.FC<{ score: number }> = ({ score }) => {
    const color = score >= 70 ? 'bg-green-500/20 text-green-300' : score >= 40 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300';
    return <span className={`px-2 py-1 text-xs font-bold rounded-full ${color}`}>{score}%</span>;
};

const BreakdownCard: React.FC<{ title: string; breakdown: ScoreBreakdown }> = ({ title, breakdown }) => {
    if (breakdown.total === 0) return null;
    return (
        <div className="bg-slate-900/50 p-4 rounded-lg flex justify-between items-center">
            <div>
                <h4 className="font-bold text-slate-300">{title}</h4>
                <p className="text-sm text-slate-400">{breakdown.correct} / {breakdown.total} correct</p>
            </div>
            <ScorePill score={breakdown.score} />
        </div>
    );
};

const ReportView: React.FC<ReportViewProps> = ({ report, questions, userAnswers, onRestart }) => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const scoreColor = report.overallScore >= 70 ? 'text-green-400' : report.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400';

    const renderAnswer = (answer: string[]) => (
        <ul className="list-disc list-inside">
            {answer.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
    );

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 mb-8 text-center">
                <h2 className="text-3xl font-bold text-sky-400 mb-2">Quiz Report</h2>
                <p className="text-slate-400 mb-6">{report.summary}</p>
                <div className="text-6xl font-bold mb-4">
                    <span className={scoreColor}>{report.overallScore}%</span>
                </div>
                <p className="text-slate-300 text-lg">Overall Score</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 mb-8">
                <h3 className="text-xl font-bold text-sky-400 mb-4">Score Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-slate-400 font-semibold mb-2 text-sm">By Question Type</h4>
                        <div className="space-y-2">
                           <BreakdownCard title="Multiple Choice (MCQ)" breakdown={report.scoreBreakdown.mcq} />
                           <BreakdownCard title="Multiple Selection (MSQ)" breakdown={report.scoreBreakdown.msq} />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-slate-400 font-semibold mb-2 text-sm">By Topic</h4>
                        <div className="space-y-2">
                           {report.scoreBreakdown.topics.map((topicItem) => (
                               <BreakdownCard key={topicItem.topicName} title={topicItem.topicName} breakdown={topicItem.breakdown} />
                           ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {report.detailedAnalysis.map((analysis, index) => (
                    <div key={index} className={`bg-slate-800 rounded-2xl shadow-lg border ${analysis.isCorrect ? 'border-green-500/30' : 'border-red-500/30'} overflow-hidden`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <div className="flex-1">
                                    <p className="text-lg font-semibold">{analysis.question}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                         <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${questions[index].type === QuestionType.MSQ ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>{questions[index].type}</span>
                                        <span className="text-xs font-medium bg-slate-600/50 text-slate-300 px-2 py-0.5 rounded-full">{analysis.topic}</span>
                                    </div>
                                </div>
                                {analysis.isCorrect ? (
                                    <span className="flex items-center gap-2 text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full text-sm flex-shrink-0">
                                        <CheckIcon /> Correct
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-full text-sm flex-shrink-0">
                                        <XIcon /> Incorrect
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                                <div className="bg-slate-900/50 p-3 rounded-lg">
                                    <h4 className="font-bold text-slate-400 mb-1">Your Recalled Answer</h4>
                                    {userAnswers[index].recalledAnswer ? (
                                        <p className="text-slate-200 italic">"{userAnswers[index].recalledAnswer}"</p>
                                    ) : (
                                        <p className="text-slate-400 italic">(Skipped)</p>
                                    )}
                                    {analysis.recalledAnswerFeedback && (
                                        <div className="mt-2 pt-2 border-t border-slate-700">
                                            <p className={`${
                                                analysis.isRecalledAnswerCorrect === true
                                                    ? 'text-green-400'
                                                    : analysis.isRecalledAnswerCorrect === false
                                                    ? 'text-red-400'
                                                    : 'text-sky-300'
                                            } text-sm`}>{analysis.recalledAnswerFeedback}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg"><h4 className="font-bold text-slate-400 mb-1">Your Final Selection</h4><div className="text-slate-200">{renderAnswer(userAnswers[index].finalAnswer)}</div></div>
                                <div className="bg-slate-900/50 p-3 rounded-lg"><h4 className="font-bold text-slate-400 mb-1">Correct Answer</h4><div className="text-slate-200 font-medium">{renderAnswer(questions[index].correctAnswer)}</div></div>
                            </div>
                            
                            <div><h4 className="font-bold text-sky-400 mb-2">Gemini's Feedback</h4><p className="text-slate-300 leading-relaxed">{analysis.feedback}</p></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 text-center">
                <button onClick={onRestart} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors duration-300">
                    Analyze Another Quiz
                </button>
            </div>

            <button 
                onClick={() => setIsChatbotOpen(true)}
                className="fixed bottom-6 right-6 bg-sky-600 text-white p-4 rounded-full shadow-lg hover:bg-sky-500 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Open AI Chatbot"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" /></svg>
            </button>
            
            {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} report={report} questions={questions} userAnswers={userAnswers} />}
        </div>
    );
};

export default ReportView;