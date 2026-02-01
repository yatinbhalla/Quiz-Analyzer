
import React, { useState, useEffect, useRef } from 'react';
import { streamChatResponse } from '../services/geminiService';
import { ChatMessage, AnalysisReport, QuizQuestion, UserAnswer, GroundingSource } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatbotProps {
    onClose: () => void;
    report: AnalysisReport;
    questions: QuizQuestion[];
    userAnswers: UserAnswer[];
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose, report, questions, userAnswers }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useGoogleSearch, setUseGoogleSearch] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    const systemInstruction = `You are a helpful AI tutor. The user has just completed a quiz. Their report, the quiz questions, and their answers are provided below. Your role is to answer their questions about the quiz, explain concepts in more detail, or discuss related topics. Be encouraging and clear.

    Quiz Report:
    ${JSON.stringify(report)}

    Questions and Answers:
    ${JSON.stringify(questions.map((q, i) => ({...q, userAnswer: userAnswers[i]})))}
    `;

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);
        
        const currentHistory = [...messages, newUserMessage].map(m => ({role: m.role, text: m.text} as ChatMessage));
        
        let fullResponse = '';
        let finalSources: GroundingSource[] | undefined = [];
        
        setMessages(prev => [...prev, { role: 'model', text: '...' }]);

        try {
            for await (const chunk of streamChatResponse(currentHistory, systemInstruction, useGoogleSearch)) {
                fullResponse += chunk.text;
                if (chunk.sources && chunk.sources.length > 0) {
                     finalSources = chunk.sources.filter(s => s.uri && s.title) as GroundingSource[];
                }
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: fullResponse, sources: finalSources };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => {
                 const newMessages = [...prev];
                 newMessages[newMessages.length - 1] = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
                 return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" /></svg>
                        Ask Gemini
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-sky-500 flex-shrink-0"></div>}
                            <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <MarkdownRenderer content={msg.text} />
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-600">
                                        <h4 className="text-xs font-bold text-slate-400 mb-1">Sources:</h4>
                                        <div className="space-y-1">
                                            {msg.sources.map((source, i) => (
                                                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline block truncate">
                                                   {i+1}. {source.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                     <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-700">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                            placeholder="Ask a follow-up question..."
                            disabled={isLoading}
                            rows={1}
                            className="w-full bg-slate-700 p-3 pr-20 rounded-lg resize-none border border-slate-600 focus:ring-2 focus:ring-sky-500 transition"
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-sky-600 rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5"><path d="M2.87 2.298a.75.75 0 0 0-.812 1.021L3.39 6.624a1 1 0 0 0 .928.626H8.5a.75.75 0 0 1 0 1.5H4.318a1 1 0 0 0-.927.626l-1.333 3.305a.75.75 0 0 0 .812 1.022L13.5 8 2.87 2.298Z" /></svg>}
                        </button>
                    </div>
                    <label className="flex items-center gap-2 mt-2 text-sm text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={useGoogleSearch} onChange={(e) => setUseGoogleSearch(e.target.checked)} className="rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500" />
                        Include Google Search results
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
