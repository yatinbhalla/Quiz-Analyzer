
import { GoogleGenAI, Type, Content } from "@google/genai";
import { QuizQuestion, UserAnswer, AnalysisReport, QuestionType, ChatMessage, ValidationSensitivity } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const quizParsingSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            correctAnswer: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'An array containing the correct option string(s).',
            },
            type: {
                type: Type.STRING,
                enum: [QuestionType.MCQ, QuestionType.MSQ],
                description: 'MCQ for single correct answer, MSQ for multiple correct answers.'
            }
        },
        required: ['question', 'options', 'correctAnswer', 'type']
    }
};

export const parseQuizFromText = async (fileContent: string): Promise<QuizQuestion[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Parse the following quiz text and convert it into a JSON object. The text contains questions, multiple-choice/multiple-select options, and answers. The answers might be at the end of the file or next to each question. Determine if each question is an MCQ (single correct answer) or MSQ (multiple correct answers) and set the 'type' field accordingly. The 'correctAnswer' field must always be an array of strings. Here is the quiz content:\n\n${fileContent}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizParsingSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (!Array.isArray(parsedData)) {
            throw new Error("Parsed data is not an array.");
        }

        return parsedData as QuizQuestion[];

    } catch (error) {
        console.error("Error parsing quiz with Gemini:", error);
        throw new Error("Gemini could not parse the provided quiz file. Please check the format and try again.");
    }
};

const scoreBreakdownSchema = {
    type: Type.OBJECT,
    properties: {
        correct: { type: Type.NUMBER },
        total: { type: Type.NUMBER },
        score: { type: Type.NUMBER }
    },
    required: ["correct", "total", "score"]
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.NUMBER, description: "A percentage score from 0 to 100." },
        summary: { type: Type.STRING, description: "A dynamic, insightful summary of performance, referencing specific strengths/weaknesses." },
        detailedAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING, description: "Detailed feedback on the answer. MUST include a thorough explanation of the correct answer's concepts, even if the user was right." },
                    topic: { type: Type.STRING, description: "A concise, one or two-word topic for this question (e.g., 'Algebra', 'World War II')." },
                    recalledAnswerFeedback: { type: Type.STRING, description: "Feedback on the user's recalled answer. Should be an empty string if the user skipped the recall step."},
                    isRecalledAnswerCorrect: { type: Type.BOOLEAN, description: "True if the recalled answer is mostly correct. Omit if skipped." }
                },
                required: ['question', 'isCorrect', 'feedback', 'topic', 'recalledAnswerFeedback']
            }
        },
        scoreBreakdown: {
            type: Type.OBJECT,
            properties: {
                mcq: scoreBreakdownSchema,
                msq: scoreBreakdownSchema,
                topics: {
                    type: Type.ARRAY,
                    description: "An array of objects, each containing a topic name and its corresponding score breakdown.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            topicName: { 
                                type: Type.STRING,
                                description: "The name of the topic."
                            },
                            breakdown: scoreBreakdownSchema
                        },
                        required: ['topicName', 'breakdown']
                    }
                }
            },
            required: ['mcq', 'msq', 'topics']
        }
    },
    required: ['overallScore', 'summary', 'detailedAnalysis', 'scoreBreakdown']
};

export const analyzeQuizAnswers = async (questions: QuizQuestion[], userAnswers: UserAnswer[]): Promise<AnalysisReport> => {
    try {
        const analysisPrompt = `
            Analyze the following quiz results.

            Analysis Rules:
            1.  **detailedAnalysis**:
                a.  'isCorrect': Must be true only if 'finalAnswer' perfectly matches 'correctAnswer'.
                b.  'feedback': MUST provide a detailed explanation of the correct answer's concepts for EVERY question, even if the user was correct.
                c.  'topic': Assign a concise, 1-2 word topic to each question.
                d.  Evaluate the user's 'recalledAnswer'. If the user provided one: determine if it is mostly correct and set 'isRecalledAnswerCorrect' to true/false. Also provide brief, insightful feedback (max 20 words) in 'recalledAnswerFeedback'. Use a balanced sensitivity for evaluation. If the user skipped ('recalledAnswer' is empty), 'recalledAnswerFeedback' must be an empty string and 'isRecalledAnswerCorrect' should not be included.
            2.  **scoreBreakdown**:
                a.  Calculate correct, total, and percentage score for MCQ and MSQ questions separately.
                b.  Group questions by the topics you assigned and calculate the score breakdown for each topic.
            3.  **summary**: Write a dynamic, insightful summary of the user's performance. Instead of a generic message, you MUST identify specific patterns from the detailed analysis. For example, if the user consistently missed questions about a certain topic (e.g., a topic you identified in the 'topic' field), mention it as an area for improvement. If their recalled answers were often correct even when their final answers were not, point that out as a strength in memory recall. The summary must be tailored to the actual results and avoid generic encouragement.

            Quiz Data:
            - Questions: ${JSON.stringify(questions, null, 2)}
            - User's Answers: ${JSON.stringify(userAnswers, null, 2)}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: analysisPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                thinkingConfig: { thinkingBudget: 32768 }
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AnalysisReport;

    } catch (error) {
        console.error("Error analyzing answers with Gemini:", error);
        throw new Error("Gemini could not analyze the quiz results. Please try again.");
    }
};

export async function* streamChatResponse(history: ChatMessage[], systemInstruction: string, useGoogleSearch: boolean) {
    const model = useGoogleSearch ? "gemini-3-flash-preview" : "gemini-3-pro-preview";
    
    const contents: Content[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
            systemInstruction,
            tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
        },
    });

    for await (const chunk of responseStream) {
        yield { 
            text: chunk.text, 
            sources: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web) 
        };
    }
}