
export enum AppState {
    UPLOAD = 'UPLOAD',
    PARSING = 'PARSING',
    QUIZ = 'QUIZ',
    ANALYZING = 'ANALYZING',
    REPORT = 'REPORT',
}

export enum QuestionType {
    MCQ = 'MCQ', // Multiple Choice Question (single answer)
    MSQ = 'MSQ', // Multiple Selection Question (multiple answers)
}

export type ValidationSensitivity = 'Lenient' | 'Balanced' | 'Strict';

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string[]; // Always an array, even for MCQ
    type: QuestionType;
}

export interface UserAnswer {
    recalledAnswer: string;
    finalAnswer: string[]; // Array of selected options
}

export interface QuestionAnalysis {
    question: string;
    isCorrect: boolean;
    feedback: string;
    topic: string;
    recalledAnswerFeedback: string;
    isRecalledAnswerCorrect?: boolean;
}

export interface ScoreBreakdown {
    correct: number;
    total: number;
    score: number;
}

export interface TopicScoreBreakdown {
    topicName: string;
    breakdown: ScoreBreakdown;
}

export interface AnalysisReport {
    overallScore: number; // Percentage
    summary: string;
    detailedAnalysis: QuestionAnalysis[];
    scoreBreakdown: {
        mcq: ScoreBreakdown;
        msq: ScoreBreakdown;
        topics: TopicScoreBreakdown[];
    };
}

// Types for Chatbot
export interface GroundingSource {
    uri: string;
    title: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    sources?: GroundingSource[];
}