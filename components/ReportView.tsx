
import React, { useState } from 'react';
import { AnalysisReport, QuizQuestion, UserAnswer, QuestionType, ScoreBreakdown, RecallPerformance, StudyPlan } from '../types';
import Chatbot from './Chatbot';
import MarkdownRenderer from './MarkdownRenderer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportViewProps {
    title: string;
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

const RecallPerformanceCard: React.FC<{ performance: RecallPerformance }> = ({ performance }) => {
    const scoreColor = performance.recallScore >= 70 ? 'text-green-400' : performance.recallScore >= 40 ? 'text-yellow-400' : 'text-red-400';
    
    // Mock data for peer comparison. Real implementation would fetch this from Firebase aggregations.
    const chartData = [
        {
            name: 'Recall Accuracy',
            You: performance.recallScore,
            Peers: 65, // Typical average recall across users
        }
    ];

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 mb-8">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-sky-400">Recall Performance</h3>
                <div className="text-right">
                    <p className={`text-3xl font-bold ${scoreColor}`}>{performance.recallScore}%</p>
                    <p className="text-sm text-slate-400">Current Score</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-1">Summary</h4>
                        <div className="text-slate-400 text-sm leading-relaxed">
                            <MarkdownRenderer content={performance.summary} />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-2">How to Improve</h4>
                        <div className="text-slate-400 text-sm">
                            <MarkdownRenderer content={performance.improvementTips} />
                        </div>
                    </div>
                </div>
                <div>
                     <h4 className="font-semibold text-slate-300 mb-2">Peer Comparison</h4>
                     <p className="text-xs text-slate-500 mb-4">* The 'Peers' metric currently shows a simulated average value. Collecting aggregate topic-level recall data from all users to build a true global baseline feature is recommended.</p>
                     <div className="w-full">
                        <ResponsiveContainer width="100%" height={192}>
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Bar dataKey="You" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Peers" fill="#64748b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>
        </div>
    );
};

const StudyPlanCard: React.FC<{ plan?: StudyPlan }> = ({ plan }) => {
    if (!plan) return null;
    return (
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800 p-6 rounded-2xl shadow-lg border border-indigo-500/30 mb-8 border-l-4 border-l-indigo-500">
            <h3 className="text-2xl font-bold flex items-center gap-3 text-indigo-400 mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                 </svg>
                Personalized Study Plan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-red-400"></span> 
                       Priority Focus Areas
                   </h4>
                   <ul className="space-y-2 mb-6">
                       {plan.focusAreas.map((area, i) => (
                           <li key={i} className="bg-slate-900/60 px-4 py-2 rounded-lg text-slate-300 border border-slate-700/50 text-sm">
                               {area}
                           </li>
                       ))}
                   </ul>

                   <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 
                       Recommended Practice
                   </h4>
                   <ul className="space-y-2">
                       {plan.recommendations.map((rec, i) => (
                           <li key={i} className="flex gap-3 text-slate-300 text-sm items-start">
                               <span className="text-emerald-500 mt-0.5">✓</span>
                               <span>{rec}</span>
                           </li>
                       ))}
                   </ul>
                </div>
                
                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700">
                    <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-sky-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                       Concepts to Review
                    </h4>
                    <div className="space-y-4">
                        {plan.concepts.map((concept, i) => (
                            <div key={i} className="border-l-2 border-indigo-500/50 pl-3">
                                <p className="font-medium text-slate-200 mb-1">{concept.name}</p>
                                <p className="text-xs text-slate-400 leading-relaxed mb-1">{concept.importanceReason}</p>
                                <p className="text-xs text-indigo-300 leading-relaxed italic">{concept.resourceContext}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportView: React.FC<ReportViewProps> = ({ title, report, questions, userAnswers, onRestart }) => {
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
                <h2 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-2">Quiz Report</h2>
                <h1 className="text-3xl font-bold text-sky-400 mb-2">{title}</h1>
                <p className="text-slate-400 mb-6">{report.summary}</p>
                <div className="flex flex-wrap justify-center items-center gap-8 mb-4">
                    <div>
                        <div className="text-5xl font-bold">
                            <span className={scoreColor}>{report.overallScore}%</span>
                        </div>
                        <p className="text-slate-300 text-lg mt-2">Overall Score</p>
                    </div>
                    {report.cgpa !== undefined && (
                        <div className="border-slate-700 pl-0 md:pl-8 md:border-l">
                            <div className="text-5xl font-bold text-indigo-400">
                                {report.cgpa} <span className="text-3xl text-slate-500">/ 10</span>
                            </div>
                            <p className="text-slate-300 text-lg mt-2">CGPA</p>
                        </div>
                    )}
                </div>
                {report.obtainedMarks !== undefined && report.totalMarks !== undefined && (
                    <p className="text-slate-400 mt-4 bg-slate-900/50 inline-block px-4 py-2 rounded-lg">
                        Scored <strong className="text-white">{report.obtainedMarks}</strong> out of <strong className="text-white">{report.totalMarks}</strong> marks 
                        <span className="text-xs ml-2 text-slate-500 block sm:inline mt-1 sm:mt-0">(+4 correct, -1 incorrect)</span>
                    </p>
                )}
            </div>

            <RecallPerformanceCard performance={report.recallPerformance} />
            <StudyPlanCard plan={report.studyPlan} />

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
                                <div key={topicItem.topicName} className="space-y-1">
                                    <BreakdownCard title={topicItem.topicName} breakdown={topicItem.breakdown} />
                                    {topicItem.subTopics && topicItem.subTopics.length > 0 && (
                                        <div className="pl-4 space-y-1 border-l-2 border-slate-700 ml-2">
                                            {topicItem.subTopics.map(sub => (
                                                <div key={sub.subTopicName} className="bg-slate-900/30 p-2 rounded-lg flex justify-between items-center text-sm">
                                                    <div>
                                                        <span className="font-semibold text-slate-400">{sub.subTopicName}</span>
                                                        <span className="text-xs text-slate-500 ml-2">{sub.breakdown.correct} / {sub.breakdown.total} correct</span>
                                                    </div>
                                                    <ScorePill score={sub.breakdown.score} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>            <div className="space-y-6">
                {report.detailedAnalysis.map((analysis, index) => {
                    const question = questions?.[index];
                    const answer = userAnswers?.[index];
                    
                    return (
                    <div key={index} className={`bg-slate-800 rounded-2xl shadow-lg border ${analysis.isCorrect ? 'border-green-500/30' : 'border-red-500/30'} overflow-hidden`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <div className="flex-1">
                                    <p className="text-lg font-semibold">{analysis.question}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                         {question?.type && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${question.type === QuestionType.MSQ ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>{question.type}</span>}
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
                                    {answer?.recalledAnswer ? (
                                        <p className="text-slate-200 italic">"{answer.recalledAnswer}"</p>
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
                                     {analysis.recalledAnswerComparison && (
                                        <div className="mt-2 pt-2 border-t border-slate-700">
                                            <h5 className="font-bold text-slate-400 mb-1 text-xs">Recall Analysis:</h5>
                                            <div className="text-slate-200 italic" dangerouslySetInnerHTML={{ __html: `"${analysis.recalledAnswerComparison}"` }} />
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg"><h4 className="font-bold text-slate-400 mb-1">Your Final Selection</h4><div className="text-slate-200">{renderAnswer(answer?.finalAnswer || [])}</div></div>
                                <div className="bg-slate-900/50 p-3 rounded-lg"><h4 className="font-bold text-slate-400 mb-1">Correct Answer</h4><div className="text-slate-200 font-medium">{renderAnswer(question?.correctAnswer || [])}</div></div>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-sky-400 mb-2">Gemini's Feedback</h4>
                                <p className="text-slate-300 leading-relaxed">{analysis.feedback}</p>
                                
                                {analysis.timeFeedback && answer?.timeSpentSeconds !== undefined && (
                                    <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                                        <h5 className="font-bold text-slate-300 mb-2 text-sm flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-sky-400">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                            Timing Analysis ({Math.floor((answer.timeSpentSeconds || 0) / 60)}:{((answer.timeSpentSeconds || 0) % 60).toString().padStart(2, '0')})
                                        </h5>
                                        <p className="text-slate-400 text-sm leading-relaxed">{analysis.timeFeedback}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )})}
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