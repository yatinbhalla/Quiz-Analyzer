
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
            contents: `Parse the following quiz text and convert it into a JSON object. The text contains questions, multiple-choice/multiple-select options, and answers. The answers might be at the end of the file or next to each question. Determine if each question is an MCQ (single correct answer) or MSQ (multiple correct answers) and set the 'type' a field accordingly. The 'correctAnswer' field must always be an array of strings. Here is the quiz content:\n\n${fileContent}`,
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

export const generateQuiz = async (topic: string, difficulty: string, questionType: string, category: string, count: number): Promise<QuizQuestion[]> => {
    try {
        const prompt = `Generate exactly ${count} quiz questions about '${topic}'.
The difficulty level should be '${difficulty}'.
The question type style should be '${questionType}' (e.g. MCQ, MSQ, or Mix).
The category of questions should be '${category}' (e.g. conceptual, scenario-based, case studies, or mix).

Ensure the output is a valid JSON array matching the provided schema. The 'correctAnswer' field MUST be an array of strings matching the exact text of the correct option(s).`;

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizParsingSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (!Array.isArray(parsedData)) {
            throw new Error("Generated data is not an array.");
        }

        return parsedData as QuizQuestion[];
    } catch (error) {
        console.error("Error generating quiz with Gemini:", error);
        throw new Error("Gemini could not generate the quiz. Please try again.");
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
        recallPerformance: {
            type: Type.OBJECT,
            properties: {
                recallScore: { type: Type.NUMBER, description: "Percentage of correct recalled answers out of those attempted." },
                summary: { type: Type.STRING, description: "A detailed summary breaking down recall performance, using markdown headings." },
                improvementTips: { type: Type.STRING, description: "A detailed list of actionable steps to improve memory recall, formatted as a markdown list with bolded titles." }
            },
            required: ['recallScore', 'summary', 'improvementTips']
        },
        detailedAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING, description: "Detailed feedback on the answer. MUST include a thorough explanation of the correct answer's concepts, even if the user was right." },
                    topic: { type: Type.STRING, description: "A broad topic for this question (e.g., 'History', 'Science')." },
                    subTopic: { type: Type.STRING, description: "A very granular sub-topic logically nested under the topic (e.g., 'Ancient Rome', 'Genetics'). Can be omitted if too generic." },
                    recalledAnswerFeedback: { type: Type.STRING, description: "Feedback on the user's recalled answer. Should be an empty string if the user skipped the recall step."},
                    isRecalledAnswerCorrect: { type: Type.BOOLEAN, description: "True if the recalled answer is mostly correct. Omit if skipped." },
                    recalledAnswerComparison: { type: Type.STRING, description: "An HTML string comparing the recalled answer to the correct one, with correct parts in green and incorrect in red." },
                    timeFeedback: { type: Type.STRING, description: "Feedback on the time taken to answer the question, if timeSpentSeconds was provided." }
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
                                description: "The name of the broad topic."
                            },
                            breakdown: scoreBreakdownSchema,
                            subTopics: {
                                type: Type.ARRAY,
                                description: "Breakdown of scores by sub-topics within this main topic. This allows for granular insights into a topic.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        subTopicName: { type: Type.STRING },
                                        breakdown: scoreBreakdownSchema
                                    },
                                    required: ['subTopicName', 'breakdown']
                                }
                            }
                        },
                        required: ['topicName', 'breakdown']
                    }
                }
            },
            required: ['mcq', 'msq', 'topics']
        },
        studyPlan: {
             type: Type.OBJECT,
             properties: {
                 focusAreas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific areas/topics to focus on." },
                 recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Types of practice questions and methods." },
                 concepts: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.OBJECT,
                         properties: {
                             name: { type: Type.STRING },
                             resourceContext: { type: Type.STRING, description: "Link to relevant concepts discussed in feedback." },
                             importanceReason: { type: Type.STRING, description: "Brief description of why this concept is important based on the user's performance in the quiz." }
                         },
                         required: ['name', 'resourceContext', 'importanceReason']
                     }
                 }
             },
             required: ['focusAreas', 'recommendations', 'concepts']
        }
    },
    required: ['overallScore', 'summary', 'detailedAnalysis', 'scoreBreakdown', 'recallPerformance', 'studyPlan']
};

export const analyzeQuizAnswers = async (questions: QuizQuestion[], userAnswers: UserAnswer[]): Promise<AnalysisReport> => {
    try {
        const analysisPrompt = `
            Analyze the following quiz results.

            Analysis Rules:
            1.  **detailedAnalysis**:
                a.  'isCorrect': Must be true only if 'finalAnswer' perfectly matches 'correctAnswer'.
                b.  'feedback': MUST provide a detailed explanation of the correct answer's concepts for EVERY question, even if the user was correct.
                c.  'topic' and 'subTopic': Assign a broad topic and a granular sub-topic for each question to identify precise areas of strength or weakness.
                d.  Evaluate the user's 'recalledAnswer'. If provided: determine if it's mostly correct and set 'isRecalledAnswerCorrect' to true/false, then provide brief feedback in 'recalledAnswerFeedback'. If skipped, 'recalledAnswerFeedback' must be an empty string and 'isRecalledAnswerCorrect' omitted.
                e.  'recalledAnswerComparison': If a recalled answer was provided, compare it to the correct answer. Generate an HTML string of the user's recalled answer. Wrap text that aligns with the correct answer in \`<span class='text-green-400 font-semibold'>\` and text that is incorrect or missing key info in \`<span class='text-red-400 font-semibold'>\`. Omit this field if the user skipped recall.
                f.  'timeFeedback': If 'timeSpentSeconds' is provided, provide brief feedback on their speed. Over 60 seconds on a simple question might suggest uncertainty; fast but incorrect might suggest guessing. Provide an empty string if not applicable.
            2.  **recallPerformance**:
                a.  'recallScore': Calculate the percentage of correct recalled answers out of those attempted. If none attempted, score is 0.
                b.  'summary': Write a detailed summary breaking down their recall performance. Use markdown headings (e.g., \`#### Strengths\`) to structure the analysis.
                c.  'improvementTips': Provide a detailed list of 2-3 actionable improvement strategies. Each tip MUST have a bolded title (e.g., \`**1. The Feynman Technique**\`) followed by a paragraph explaining how to apply it. Use markdown.
            3.  **scoreBreakdown**:
                a.  Calculate correct, total, and percentage score for MCQ and MSQ questions separately.
                b.  Group questions by the broad topics you assigned. For each topic, group its questions by subTopic to provide a granular score breakdown.
            4.  **summary**: Write a dynamic, insightful summary of the user's overall performance, identifying specific patterns from the detailed analysis (e.g., topic weaknesses, recall vs. final answer discrepancies).
            5.  **studyPlan**: Base this on 'recallPerformance' and 'scoreBreakdown'. Suggest specific focus areas, recommend types of practice questions, and link to relevant concepts discussed in the feedback.

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
        const report = JSON.parse(jsonText) as AnalysisReport;

        let obtainedMarks = 0;
        let totalMarks = questions.length * 4;
        
        report.detailedAnalysis.forEach((analysis, index) => {
            const answer = userAnswers[index];
            // Treat as attempted if they selected at least one option
            const isAttempted = answer && answer.finalAnswer && answer.finalAnswer.length > 0;
            if (isAttempted) {
                if (analysis.isCorrect) {
                    obtainedMarks += 4;
                } else {
                    obtainedMarks -= 1;
                }
            }
        });
        
        report.obtainedMarks = obtainedMarks;
        report.totalMarks = totalMarks;
        let percentage = obtainedMarks / totalMarks;
        if (percentage < 0) percentage = 0;
        report.cgpa = parseFloat((percentage * 10).toFixed(2));

        return report;

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