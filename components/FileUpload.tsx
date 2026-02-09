
import React, { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { ValidationSensitivity } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

interface FileUploadProps {
    onFileUpload: (content: string) => void;
    sensitivity: ValidationSensitivity;
    onSensitivityChange: (sensitivity: ValidationSensitivity) => void;
}

const SensitivityOption: React.FC<{
    value: ValidationSensitivity;
    current: ValidationSensitivity;
    onChange: (value: ValidationSensitivity) => void;
    children: React.ReactNode;
}> = ({ value, current, onChange, children }) => (
    <button
        onClick={() => onChange(value)}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
            current === value
                ? 'bg-sky-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
    >
        {children}
    </button>
);


const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, sensitivity, onSensitivityChange }) => {
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const extractTextFromFile = async (file: File): Promise<string> => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (file.type.startsWith('text/') || ['txt', 'md'].includes(fileExtension || '')) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = (e) => reject(new Error(`Failed to read text file: ${file.name}`));
                reader.readAsText(file);
            });
        }

        const readAsArrayBuffer = (fileToRead: File) => new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
            reader.onerror = (e) => reject(new Error(`Failed to read file: ${fileToRead.name}`));
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

        throw new Error(`Unsupported file type: ${file.name}`);
    };

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        const count = files.length;
        const label = count === 1 ? files[0].name : `${count} files`;
        setFileName(label);

        try {
            const fileArray = Array.from(files);
            const extractionPromises = fileArray.map(file => extractTextFromFile(file).catch(err => {
                console.error(err);
                alert(err.message);
                return '';
            }));

            const contents = await Promise.all(extractionPromises);
            const validContents = contents.filter(c => c.trim().length > 0);

            if (validContents.length > 0) {
                onFileUpload(validContents.join('\n\n--- NEXT FILE ---\n\n'));
            } else {
                 throw new Error("Could not extract text from any of the selected files.");
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "An unknown error occurred.");
            setFileName('');
            setIsProcessing(false);
        }
    }, [onFileUpload]);

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); if (!isProcessing) setDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        if (!isProcessing && e.dataTransfer.files?.length) {
            handleFiles(e.dataTransfer.files);
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) handleFiles(e.target.files);
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-3xl font-bold text-sky-400 mb-2">Upload Your Quiz</h2>
            <p className="text-slate-400 mb-6 text-center">Drag & drop text, Word (.docx), or PDF files.</p>
            <label
                htmlFor="file-upload"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${isProcessing ? 'cursor-wait' : 'cursor-pointer'} ${dragging ? 'border-sky-500 bg-slate-700/50' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-700/30'}`}
            >
                <input id="file-upload" type="file" className="hidden" multiple accept=".txt,.md,.text,.docx,.pdf" onChange={handleFileChange} disabled={isProcessing} />
                {isProcessing ? (
                     <>
                        <svg className="animate-spin h-16 w-16 text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-slate-400">Processing files...</p>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-500 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 17.25z" /></svg>
                        <p className="text-slate-400">{fileName || 'Drag and drop files here'}</p>
                        <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                    </>
                )}
            </label>
            <div className="mt-6 w-full text-center">
                 <label className="text-slate-400 mb-3 block font-medium">Recall Validation Sensitivity</label>
                 <div className="inline-flex bg-slate-900/50 p-1 rounded-lg space-x-1">
                     <SensitivityOption value="Lenient" current={sensitivity} onChange={onSensitivityChange}>Lenient</SensitivityOption>
                     <SensitivityOption value="Balanced" current={sensitivity} onChange={onSensitivityChange}>Balanced</SensitivityOption>
                     <SensitivityOption value="Strict" current={sensitivity} onChange={onSensitivityChange}>Strict</SensitivityOption>
                 </div>
            </div>
        </div>
    );
};

export default FileUpload;
