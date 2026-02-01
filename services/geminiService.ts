
import { GoogleGenAI, Type, Content } from "@google/genai";
import { QuizQuestion, UserAnswer, AnalysisReport, QuestionType, ChatMessage } from '../types';

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


const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.NUMBER, description: "A percentage score from 0 to 100." },
        summary: { type: Type.STRING, description: "A brief, encouraging summary of the user's performance." },
        detailedAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING, description: "Detailed feedback on the user's answer, comparing their recalled answer, final answer, and the correct answer. Explain why their answer was right or wrong and explain the correct answer." }
                },
                required: ['question', 'isCorrect', 'feedback']
            }
        }
    },
    required: ['overallScore', 'summary', 'detailedAnalysis']
};


export const analyzeQuizAnswers = async (questions: QuizQuestion[], userAnswers: UserAnswer[]): Promise<AnalysisReport> => {
    try {
        const analysisPrompt = `
            Analyze the following quiz results. For each question, provide a detailed analysis.

            Rules for your analysis:
            1.  **isCorrect**: This field MUST be true if and only if the user's 'finalAnswer' perfectly matches the 'correctAnswer'. An incorrect 'recalledAnswer' does not make the question wrong if the 'finalAnswer' is correct.
            2.  **feedback**: This is the most important part. Your feedback MUST:
                a. Start by stating if the final answer was correct or incorrect.
                b. Analyze the user's 'recalledAnswer'. Compare it to the correct answer and explain if it was on the right track, partially correct, or completely wrong.
                c. Analyze the user's 'finalAnswer'.
                d. Provide a detailed explanation of the correct answer and the underlying concepts, regardless of whether the user was correct or not. This helps them learn.
            3.  **overallScore**: Calculate the percentage of questions where 'isCorrect' is true.
            4.  **summary**: Write a brief, encouraging summary of the user's performance, perhaps highlighting strengths or areas for improvement based on the analysis.

            Quiz Questions and Correct Answers:
            ${JSON.stringify(questions, null, 2)}
            
            User's Answers:
            ${JSON.stringify(userAnswers, null, 2)}
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
