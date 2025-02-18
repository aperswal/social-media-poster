'use client';

import { useState, useCallback, useEffect } from 'react';
import { ImageFormat, generateMemeBatch, DEFAULT_PROMPTS } from '@/lib/memeGenerator';
import JSZip from 'jszip';

interface LoadingBarProps {
    progress: number;
    total: number;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ progress, total }) => {
    const percentage = Math.min((progress / Math.max(1, total)) * 100, 100);
    
    return (
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
                className="h-full bg-blue-600 transition-all duration-500 ease-out flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${percentage}%` }}
            >
                {progress} / {total}
            </div>
        </div>
    );
};

const EXAMPLE_JSON = `[
    {
        "top": "When the code works",
        "bottom": "But you don't know why"
    },
    {
        "top": "One more coffee",
        "bottom": "What could go wrong?"
    }
]`;

export default function Home() {
    const [format, setFormat] = useState<ImageFormat>('png');
    const [prompts, setPrompts] = useState<string>('');
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [totalMemes, setTotalMemes] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [progressText, setProgressText] = useState<string>('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleGenerate = useCallback(async () => {
        try {
            setGenerating(true);
            setError('');
            setProgress(0);
            setProgressText('Generating memes...');

            let memePrompts;
            try {
                memePrompts = JSON.parse(prompts || JSON.stringify(DEFAULT_PROMPTS));
                setTotalMemes(memePrompts.length);
            } catch (e) {
                throw new Error('Invalid JSON format. Please check your input.');
            }

            // Generate memes
            const memes = await generateMemeBatch(
                memePrompts, 
                format,
                (current) => {
                    setProgress(current);
                    setProgressText(`Generating meme ${current} of ${memePrompts.length}...`);
                }
            );

            if (memes.length === 0) {
                throw new Error('No memes were generated. Please try again.');
            }

            try {
                // Create ZIP file
                setProgressText('Creating ZIP file...');
                const zip = new JSZip();
                const memesFolder = zip.folder('memes');
                
                if (!memesFolder) {
                    throw new Error('Failed to create ZIP folder');
                }

                // Add each meme to the ZIP
                memes.forEach((memeData, index) => {
                    const fileName = `meme-${(index + 1).toString().padStart(3, '0')}.${format}`;
                    memesFolder.file(fileName, new Uint8Array(memeData));
                });

                // Generate ZIP file
                setProgressText('Preparing download...');
                const zipContent = await zip.generateAsync({ 
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 5 }
                });

                // Download ZIP file
                const url = URL.createObjectURL(zipContent);
                const a = document.createElement('a');
                a.href = url;
                a.download = `memes-${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (zipError) {
                console.error('Failed to create ZIP:', zipError);
                throw new Error('Failed to create ZIP file. Trying individual downloads...');
            }

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred while generating memes');
        } finally {
            setGenerating(false);
            setProgress(0);
            setProgressText('');
        }
    }, [format, prompts]);

    const copyExample = useCallback(() => {
        navigator.clipboard.writeText(EXAMPLE_JSON);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    if (!mounted) {
        return null; // Prevent hydration issues
    }

    return (
        <main className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-4xl font-bold mb-2 text-center">Meme Generator</h1>
                <p className="text-gray-300 text-center mb-8">Generate unique memes with just one click!</p>
                
                <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2" htmlFor="format-select">
                            Image Format
                        </label>
                        <select
                            id="format-select"
                            value={format}
                            onChange={(e) => setFormat(e.target.value as ImageFormat)}
                            className="w-full max-w-xs p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white"
                        >
                            <option value="png">PNG</option>
                            <option value="jpg">JPG</option>
                            <option value="gif">GIF (Animated if available)</option>
                            <option value="webp">WebP</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2" htmlFor="prompts-input">
                            Meme Prompts (JSON Array)
                        </label>
                        <div className="text-xs text-gray-400 mb-2">
                            Leave empty to use default examples, or paste JSON from an AI assistant
                        </div>
                        
                        <div className="mb-4 p-4 bg-gray-700 rounded-md border border-gray-600">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Example Format:</span>
                                <button
                                    type="button"
                                    onClick={copyExample}
                                    className="text-sm px-3 py-1 bg-gray-600 border border-gray-500 rounded-md hover:bg-gray-500 transition-colors duration-200"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-800 p-3 rounded-md border border-gray-600 overflow-x-auto">
                                {EXAMPLE_JSON}
                            </pre>
                        </div>

                        <textarea
                            id="prompts-input"
                            value={prompts}
                            onChange={(e) => setPrompts(e.target.value)}
                            placeholder="Paste your JSON here..."
                            className="w-full h-48 p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm font-mono text-sm focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                        />
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-700" role="alert">
                            {error}
                        </div>
                    )}

                    {generating && (
                        <div className="mb-6">
                            <div className="text-sm text-gray-300 mb-2">{progressText}</div>
                            <LoadingBar progress={progress} total={totalMemes} />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md shadow-sm disabled:opacity-50 transition-colors duration-200 font-medium"
                    >
                        {generating ? 'Generating Memes...' : 'Generate Memes'}
                    </button>
                </div>

                <div className="mt-8 text-center text-sm text-gray-400">
                    <p>Powered by memegen.link API • All memes will be downloaded as a ZIP file</p>
                </div>
            </div>
        </main>
    );
}
