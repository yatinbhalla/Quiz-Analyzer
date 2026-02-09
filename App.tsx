
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, QuizQuestion, UserAnswer, AnalysisReport, ValidationSensitivity } from './types';
import FileUpload from './components/FileUpload';
import QuizView from './components/QuizView';
import ReportView from './components/ReportView';
import Loader from './components/Loader';
import { parseQuizFromText, analyzeQuizAnswers } from './services/geminiService';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';

const SAVED_STATE_KEY = 'geminiQuizAnalyzerState';
const SAVED_INDEX_KEY = 'geminiQuizCurrentIndex';
const SAVED_SENSITIVITY_KEY = 'geminiQuizValidationSensitivity';


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
    const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [validationSensitivity, setValidationSensitivity] = useState<ValidationSensitivity>('Balanced');
    const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const savedStateJSON = localStorage.getItem(SAVED_STATE_KEY);
            const savedIndexJSON = localStorage.getItem(SAVED_INDEX_KEY);
            const savedSensitivity = localStorage.getItem(SAVED_SENSITIVITY_KEY) as ValidationSensitivity;

            if (savedSensitivity) {
                setValidationSensitivity(savedSensitivity);
            }

            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                if (savedState.appState === AppState.QUIZ && Array.isArray(savedState.quizData) && Array.isArray(savedState.userAnswers)) {
                    setQuizData(savedState.quizData);
                    setUserAnswers(savedState.userAnswers);
                    setAppState(savedState.appState);
                    if (savedIndexJSON) {
                        const savedIndex = parseInt(savedIndexJSON, 10);
                        if (savedIndex < savedState.quizData.length) {
                             setCurrentIndex(savedIndex);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Could not load saved state", e);
            localStorage.removeItem(SAVED_STATE_KEY);
            localStorage.removeItem(SAVED_INDEX_KEY);
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        localStorage.setItem(SAVED_SENSITIVITY_KEY, validationSensitivity);

        if (appState === AppState.QUIZ && quizData.length > 0) {
            const stateToSave = { appState, quizData, userAnswers };
            localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(stateToSave));
            localStorage.setItem(SAVED_INDEX_KEY, currentIndex.toString());
        } else {
            localStorage.removeItem(SAVED_STATE_KEY);
            localStorage.removeItem(SAVED_INDEX_KEY);
        }
    }, [appState, quizData, userAnswers, currentIndex, validationSensitivity, isInitialized]);

    const handleFileUpload = useCallback(async (fileContent: string) => {
        setAppState(AppState.PARSING);
        setError(null);
        try {
            const parsedQuiz = await parseQuizFromText(fileContent);
            if (parsedQuiz && parsedQuiz.length > 0) {
                setQuizData(parsedQuiz);
                setUserAnswers(new Array(parsedQuiz.length).fill({ recalledAnswer: '', finalAnswer: [] }));
                setCurrentIndex(0);
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

    const handleAnswerUpdate = useCallback((index: number, updatedAnswer: Partial<UserAnswer>) => {
        setUserAnswers(prevAnswers => {
            const newAnswers = [...prevAnswers];
            newAnswers[index] = { ...newAnswers[index], ...updatedAnswer };
            return newAnswers;
        });
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
            setAppState(AppState.QUIZ);
        }
    }, [quizData]);

    const handleRestart = () => {
        setAppState(AppState.UPLOAD);
        setQuizData([]);
        setUserAnswers([]);
        setAnalysisReport(null);
        setCurrentIndex(0);
        setError(null);
    };

    const renderContent = () => {
        if (!isInitialized) {
            return <Loader text="Loading session..." />;
        }
        if (error) {
            return <ErrorDisplay message={error} onClear={handleRestart} />;
        }

        switch (appState) {
            case AppState.UPLOAD:
                return (
                    <FileUpload 
                        onFileUpload={handleFileUpload} 
                        sensitivity={validationSensitivity}
                        onSensitivityChange={setValidationSensitivity}
                    />
                );
            case AppState.PARSING:
                return <Loader text="Parsing your quiz with Gemini..." />;
            case AppState.QUIZ:
                return <QuizView 
                            questions={quizData} 
                            userAnswers={userAnswers}
                            currentIndex={currentIndex}
                            onNavigate={setCurrentIndex}
                            onAnswerUpdate={handleAnswerUpdate}
                            onComplete={handleQuizComplete} 
                            validationSensitivity={validationSensitivity}
                       />;
            case AppState.ANALYZING:
                return <Loader text="Analyzing your answers with Gemini..." />;
            case AppState.REPORT:
                return analysisReport && <ReportView report={analysisReport} questions={quizData} userAnswers={userAnswers} onRestart={handleRestart} />;
            default:
                return <FileUpload onFileUpload={handleFileUpload} sensitivity={validationSensitivity} onSensitivityChange={setValidationSensitivity} />;
        }
    };

    const quizProgress = appState === AppState.QUIZ && quizData.length > 0 
        ? ((currentIndex + 1) / quizData.length) * 100 
        : 0;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-4xl mx-auto">
                <Header 
                    onRestart={handleRestart} 
                    showRestart={appState !== AppState.UPLOAD}
                    showProgress={appState === AppState.QUIZ}
                    progress={quizProgress}
                    currentQuestion={currentIndex + 1}
                    totalQuestions={quizData.length}
                />
                <main className="mt-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default App;
