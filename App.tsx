
import React, { useState, useCallback } from 'react';
import { AppState, QuizQuestion, UserAnswer, AnalysisReport } from './types';
import FileUpload from './components/FileUpload';
import QuizView from './components/QuizView';
import ReportView from './components/ReportView';
import Loader from './components/Loader';
import { parseQuizFromText, analyzeQuizAnswers } from './services/geminiService';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
    const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = useCallback(async (fileContent: string) => {
        setAppState(AppState.PARSING);
        setError(null);
        try {
            const parsedQuiz = await parseQuizFromText(fileContent);
            if (parsedQuiz && parsedQuiz.length > 0) {
                setQuizData(parsedQuiz);
                setUserAnswers(new Array(parsedQuiz.length).fill({ recalledAnswer: '', finalAnswer: [] }));
                setAppState(AppState.QUIZ);
            } else {
                throw new Error("Failed to parse quiz. The file might be empty or in an unsupported format.");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during parsing.");
            setAppState(AppState.UPLOAD);
        }
    }, []);

    const handleQuizComplete = useCallback(async (finalAnswers: UserAnswer[]) => {
        setUserAnswers(finalAnswers);
        setAppState(AppState.ANALYZING);
        setError(null);
        try {
            const report = await analyzeQuizAnswers(quizData, finalAnswers);
            setAnalysisReport(report);
            setAppState(AppState.REPORT);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
            setAppState(AppState.QUIZ); // Go back to quiz to allow retry
        }
    }, [quizData]);

    const handleRestart = () => {
        setAppState(AppState.UPLOAD);
        setQuizData([]);
        setUserAnswers([]);
        setAnalysisReport(null);
        setError(null);
    };

    const renderContent = () => {
        if (error) {
            return <ErrorDisplay message={error} onClear={() => setError(null)} />;
        }

        switch (appState) {
            case AppState.UPLOAD:
                return <FileUpload onFileUpload={handleFileUpload} />;
            case AppState.PARSING:
                return <Loader text="Parsing your quiz with Gemini..." />;
            case AppState.QUIZ:
                return <QuizView questions={quizData} onComplete={handleQuizComplete} />;
            case AppState.ANALYZING:
                return <Loader text="Analyzing your answers with Gemini..." />;
            case AppState.REPORT:
                return analysisReport && <ReportView report={analysisReport} questions={quizData} userAnswers={userAnswers} onRestart={handleRestart} />;
            default:
                return <FileUpload onFileUpload={handleFileUpload} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-4xl mx-auto">
                <Header onRestart={handleRestart} showRestart={appState !== AppState.UPLOAD} />
                <main className="mt-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default App;
