
import React, { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for pdf.js. This is crucial for performance.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;


interface FileUploadProps {
    onFileUpload: (content: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const extractTextFromFile = async (file: File): Promise<string> => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (file.type.startsWith('text/') || ['txt', 'md'].includes(fileExtension || '')) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = (e) => reject(new Error("Failed to read the text file."));
                reader.readAsText(file);
            });
        }

        const readAsArrayBuffer = (fileToRead: File) => new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
            reader.onerror = (e) => reject(new Error("Failed to read file into memory."));
            reader.readAsArrayBuffer(fileToRead);
        });

        if (fileExtension === 'docx') {
            const arrayBuffer = await readAsArrayBuffer(file);
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        }

        if (fileExtension === 'pdf') {
            const arrayBuffer = await readAsArrayBuffer(file);
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                fullText += pageText + '\n\n';
            }
            return fullText;
        }

        if (fileExtension === 'doc') {
            throw new Error(".doc files are not supported. Please convert to .docx, .pdf, or a text file.");
        }
        
        throw new Error("Unsupported file type. Please use .txt, .md, .docx, or .pdf.");
    };

    const handleFile = useCallback(async (file: File | null) => {
        if (!file) return;

        setIsProcessing(true);
        setFileName(file.name);
        try {
            const content = await extractTextFromFile(file);
            if (content.trim()) {
                onFileUpload(content);
            } else {
                throw new Error("Could not extract any text from the file. It might be empty or an image-only document.");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during file processing.";
            alert(errorMessage);
            setFileName('');
            setIsProcessing(false);
        }
    }, [onFileUpload]);


    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        if (isProcessing) return;
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        if (isProcessing) return;
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-3xl font-bold text-sky-400 mb-2">Upload Your Quiz</h2>
            <p className="text-slate-400 mb-6 text-center">Drag & drop a text, Word (.docx), or PDF file.</p>
            <label
                htmlFor="file-upload"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${isProcessing ? 'cursor-wait' : 'cursor-pointer'} ${dragging ? 'border-sky-500 bg-slate-700/50' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-700/30'}`}
            >
                <input id="file-upload" type="file" className="hidden" accept=".txt,.md,.text,.docx,.pdf" onChange={handleFileChange} disabled={isProcessing} />
                
                {isProcessing ? (
                     <>
                        <svg className="animate-spin h-16 w-16 text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-slate-400">Processing {fileName}...</p>
                        <p className="text-slate-500 text-sm mt-1">This may take a moment for large files.</p>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-500 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 17.25z" />
                        </svg>
                        <p className="text-slate-400">{fileName ? `Selected: ${fileName}` : 'Drag and drop file here'}</p>
                        <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                    </>
                )}
            </label>
        </div>
    );
};

export default FileUpload;