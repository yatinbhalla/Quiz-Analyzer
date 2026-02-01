
import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const processedHtml = useMemo(() => {
        // Configure marked to handle basic markdown securely
        marked.setOptions({
            gfm: true,
            breaks: true,
            sanitize: true,
        });
        return marked.parse(content);
    }, [content]);

    return (
        <div 
            className="prose prose-sm prose-invert max-w-none 
                       prose-p:my-2 prose-ul:my-2 prose-ol:my-2
                       prose-headings:my-3 prose-headings:text-slate-200
                       prose-strong:text-slate-100
                       prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: processedHtml as string }} 
        />
    );
};

export default MarkdownRenderer;
