"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanEye, Upload, AlertCircle, CheckCircle2, Leaf, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CropDoctorPage() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [diagnosis, setDiagnosis] = useState<any | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target?.result as string);
                setDiagnosis(null); // Reset diagnosis
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = () => {
        if (!selectedImage) return;
        setIsAnalyzing(true);

        // Simulate AI Analysis Delay
        setTimeout(() => {
            setIsAnalyzing(false);
            setDiagnosis({
                disease: "Wheat Leaf Rust (Puccinia triticina)",
                confidence: "98.4%",
                severity: "High",
                recommendation: "Apply Azoxystrobin fungicide immediately. Isolate affected area.",
                status: "CRITICAL"
            });
        }, 2500);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
                    <ScanEye className="text-emerald-500" /> Protocol OCULUS (Plant Doctor)
                </h1>
                <p className="text-gray-400 mt-2">AI-Powered Visual Diagnosis Engine</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Upload Area */}
                <Card className="bg-black/40 border-emerald-500/20 backdrop-blur h-fit">
                    <CardHeader>
                        <CardTitle className="text-emerald-400">Visual Input</CardTitle>
                        <CardDescription>Upload or Capture Leaf Photo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-gray-700 rounded-xl h-64 flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                            {selectedImage ? (
                                <img src={selectedImage} alt="Uploaded" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-6">
                                    <Leaf className="h-12 w-12 text-gray-600 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
                                    <p className="text-gray-500">Tap to Scan</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleImageUpload}
                            />
                        </div>

                        <Button
                            className={`w-full font-bold ${isAnalyzing ? 'bg-emerald-800' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            disabled={!selectedImage || isAnalyzing}
                            onClick={analyzeImage}
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center gap-2">
                                    <ScanEye className="animate-spin h-4 w-4" /> Analyzing Tissue Structure...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <ScanEye className="h-4 w-4" /> Diagnose Infection
                                </span>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Diagnosis Results */}
                <div className="space-y-4">
                    {diagnosis && (
                        <Card className="bg-black/40 border-red-500/30 backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-red-400 flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5" /> Pathogen Detected
                                    </CardTitle>
                                    <Badge variant="destructive" className="animate-pulse">CRITICAL</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-500">Disease Identity</div>
                                    <div className="text-xl font-bold text-white">{diagnosis.disease}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded bg-red-950/30 border border-red-500/10">
                                        <div className="text-xs text-red-300">Confidence</div>
                                        <div className="text-lg font-mono font-bold text-red-500">{diagnosis.confidence}</div>
                                    </div>
                                    <div className="p-3 rounded bg-red-950/30 border border-red-500/10">
                                        <div className="text-xs text-red-300">Severity</div>
                                        <div className="text-lg font-mono font-bold text-red-500">{diagnosis.severity}</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold">
                                        <CheckCircle2 className="h-4 w-4" /> Recommended Treatment
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {diagnosis.recommendation}
                                    </p>
                                </div>

                                <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800 text-gray-300">
                                    Generate Treatment Plan (PDF)
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {!diagnosis && !isAnalyzing && (
                        <div className="flex items-center justify-center h-full text-gray-600 border border-dashed border-gray-800 rounded-xl p-8">
                            <div className="text-center">
                                <ScanEye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Waiting for image input...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
