
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
}

export interface AnalysisReport {
    overallScore: number; // Percentage
    summary: string;
    detailedAnalysis: QuestionAnalysis[];
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
