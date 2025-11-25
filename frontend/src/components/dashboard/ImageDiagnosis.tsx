'use client';

import { useState } from 'react';
import { Upload, X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ImageDiagnosis() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setSelectedImage(e.target?.result as string);
            reader.readAsDataURL(file);
            setResult(null);
        }
    };

    const analyzeImage = async () => {
        setIsAnalyzing(true);
        // Mock analysis for now - in production this would call the Python service
        setTimeout(() => {
            setIsAnalyzing(false);
            setResult({
                disease: 'Powdery Mildew',
                confidence: 0.94,
                severity: 'Moderate',
                treatment: 'Apply sulfur-based fungicides and improve air circulation.'
            });
        }, 2000);
    };

    return (
        <div className="flex flex-col h-full p-4 gap-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">AI Crop Diagnosis</h2>
                <p className="text-muted-foreground text-sm">
                    Upload a photo of your crop to identify diseases and get treatment recommendations.
                </p>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <div className={cn(
                    "border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-300 relative overflow-hidden group",
                    selectedImage ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {selectedImage ? (
                        <div className="relative w-full h-64 rounded-lg overflow-hidden">
                            <img src={selectedImage} alt="Uploaded crop" className="w-full h-full object-cover" />
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2 z-20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(null);
                                    setResult(null);
                                }}
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload size={32} className="text-muted-foreground group-hover:text-primary" />
                            </div>
                            <p className="font-medium">Click or drag image here</p>
                            <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG</p>
                        </>
                    )}
                </div>

                {selectedImage && !result && (
                    <Button
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="w-full bg-primary text-black hover:bg-primary/90 font-bold h-12 text-lg shadow-[0_0_20px_-5px_rgba(0,255,157,0.5)]"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Analyzing Neural Patterns...
                            </>
                        ) : (
                            'Diagnose Infection'
                        )}
                    </Button>
                )}

                {result && (
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="text-yellow-500" />
                                <span className="font-bold text-lg">{result.disease}</span>
                            </div>
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-mono">
                                {(result.confidence * 100).toFixed(0)}% Match
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className="text-muted-foreground text-sm">Severity</span>
                                <div className="w-full bg-muted rounded-full h-2 mt-1">
                                    <div
                                        className="bg-yellow-500 h-2 rounded-full"
                                        style={{ width: '60%' }}
                                    />
                                </div>
                                <span className="text-xs text-yellow-500 font-medium mt-1 block">{result.severity}</span>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-primary" />
                                    Recommended Treatment
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {result.treatment}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
