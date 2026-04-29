import React, { useEffect, useState } from 'react';
import { QuizSessionData, getUserSessions, loginWithGoogle, logout, auth } from '../services/firebaseService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { onAuthStateChanged } from 'firebase/auth';

interface DashboardProps {
    onStartUpload: () => void;
    onStartCreate: () => void;
    onViewReport: (session: QuizSessionData) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl" role="tooltip">
                <p className="text-slate-200 font-bold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                        {entry.name}: {entry.value}%
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ onStartUpload, onStartCreate, onViewReport }) => {
    const [user, setUser] = useState(auth.currentUser);
    const [sessions, setSessions] = useState<QuizSessionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) {
                fetchSessions();
            } else {
                setSessions([]);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        const data = await getUserSessions();
        setSessions(data);
        setLoading(false);
    };

    if (!user) {
        return (
            <div className="w-full max-w-md mx-auto text-center space-y-6 animate-fade-in mt-20">
                 <h2 className="text-3xl font-bold text-white">Welcome to Gemini Quiz Analyzer</h2>
                 <p className="text-slate-400">Sign in to save your progress, track your recall performance over time, and create custom quizzes.</p>
                 <button onClick={loginWithGoogle} className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                     </svg>
                     Sign in with Google
                 </button>
            </div>
        );
    }

    const chartData = sessions.slice().reverse().map((s, i) => ({
        name: `Session ${i + 1}`,
        recall: s.analysisReport.recallPerformance.recallScore,
        score: s.analysisReport.overallScore,
    }));

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-xl font-bold">
                         {user.displayName?.[0] || user.email?.[0] || 'U'}
                     </div>
                     <div>
                         <h2 className="text-xl font-bold">{user.displayName || 'User'}</h2>
                         <p className="text-slate-400 text-sm">{user.email}</p>
                     </div>
                </div>
                <button onClick={logout} className="text-slate-400 hover:text-white px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700">Sign Out</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={onStartUpload} aria-label="Start Upload" className="bg-sky-900/40 border border-sky-700/50 hover:bg-sky-800/50 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-sky-400 group-hover:scale-110 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-xl font-bold text-sky-100">Upload Quiz File</span>
                </button>

                <button onClick={onStartCreate} aria-label="Create Custom Quiz" className="bg-indigo-900/40 border border-indigo-700/50 hover:bg-indigo-800/50 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-400 group-hover:scale-110 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-xl font-bold text-indigo-100">Create Custom Quiz</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Loading history...</div>
            ) : sessions.length > 0 ? (
                <div className="space-y-6">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <h3 className="text-lg font-bold mb-6">Performance Trends</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="recall" name="Recall Score" stroke="#f59e0b" strokeWidth={3} />
                                    <Line type="monotone" dataKey="score" name="Final Score" stroke="#0ea5e9" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-4">Past Sessions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {sessions.map(s => (
                                <div key={s.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer" onClick={() => onViewReport(s)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm text-slate-400">
                                            {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : 'Recent'}
                                        </span>
                                        <span className="px-2 py-1 bg-slate-900 rounded text-xs font-mono">{s.quizData.length} Qs</span>
                                    </div>
                                    <div className="flex gap-4 mt-4">
                                        <div>
                                            <div className="text-2xl font-bold text-sky-400">{Math.round(s.analysisReport.overallScore)}%</div>
                                            <div className="text-xs text-slate-400 uppercase tracking-wider">Score</div>
                                        </div>
                                        {s.analysisReport.cgpa !== undefined && (
                                            <div>
                                                <div className="text-2xl font-bold text-indigo-400">{s.analysisReport.cgpa.toFixed(2)}</div>
                                                <div className="text-xs text-slate-400 uppercase tracking-wider">CGPA</div>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-2xl font-bold text-amber-400">{Math.round(s.analysisReport.recallPerformance.recallScore)}%</div>
                                            <div className="text-xs text-slate-400 uppercase tracking-wider">Recall</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <p className="text-slate-400 mb-4">No quiz sessions yet.</p>
                    <p className="text-sm text-slate-500">Upload a file or create a quiz to get started.</p>
                </div>
            )}
        </div>
    );
};
