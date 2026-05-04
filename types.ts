
export enum AppState {
    UPLOAD = 'UPLOAD',
    CREATE = 'CREATE',
    DASHBOARD = 'DASHBOARD',
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
    topic?: string;
    subTopic?: string;
}

export interface QuizResponse {
    title: string;
    questions: QuizQuestion[];
}

export interface UserAnswer {
    recalledAnswer: string;
    finalAnswer: string[]; // Array of selected options
    timeSpentSeconds?: number;
}

export interface QuestionAnalysis {
    question: string;
    isCorrect: boolean;
    feedback: string;
    topic: string;
    subTopic?: string;
    recalledAnswerFeedback: string;
    isRecalledAnswerCorrect?: boolean;
    recalledAnswerComparison?: string;
    timeFeedback?: string;
}

export interface ScoreBreakdown {
    correct: number;
    total: number;
    score: number;
}

export interface SubTopicScoreBreakdown {
    subTopicName: string;
    breakdown: ScoreBreakdown;
}

export interface TopicScoreBreakdown {
    topicName: string;
    breakdown: ScoreBreakdown;
    subTopics?: SubTopicScoreBreakdown[];
}

export interface RecallPerformance {
    recallScore: number; // Percentage
    summary: string;
    improvementTips: string;
}

export interface StudyPlan {
    focusAreas: string[];
    recommendations: string[];
    concepts: { name: string; resourceContext: string; importanceReason: string }[];
}

export interface AnalysisReport {
    overallScore: number; // Percentage
    obtainedMarks?: number;
    totalMarks?: number;
    cgpa?: number;
    summary: string;
    recallPerformance: RecallPerformance;
    detailedAnalysis: QuestionAnalysis[];
    scoreBreakdown: {
        mcq: ScoreBreakdown;
        msq: ScoreBreakdown;
        topics: TopicScoreBreakdown[];
    };
    studyPlan?: StudyPlan;
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