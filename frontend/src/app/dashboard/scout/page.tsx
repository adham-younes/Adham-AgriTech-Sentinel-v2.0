'use client';

import React, { useState } from 'react';
import { CameraCapture } from '@/components/scout/camera-capture';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sprout, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-language';

interface AnalysisResult {
    diagnosis: string;
    confidence: string;
    symptoms: string[];
    cause: string;
    treatment: string[];
    prevention: string[];
}

export default function ScoutPage() {
    const { t } = useTranslation();
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCapture = async (imageData: string) => {
        setAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/ai/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze image');
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl space-y-8 p-4 md:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">AI Virtual Scout 📸</h1>
                <p className="text-muted-foreground">
                    Take a photo of your crop to instantly identify pests, diseases, or nutrient deficiencies.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Scan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CameraCapture onCapture={handleCapture} isAnalyzing={analyzing} />
                        </CardContent>
                    </Card>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="space-y-6">
                    {analyzing && (
                        <Card className="flex h-[300px] flex-col items-center justify-center space-y-4 border-dashed">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="text-center">
                                <h3 className="font-semibold">Analyzing Image...</h3>
                                <p className="text-sm text-muted-foreground">Identifying potential issues</p>
                            </div>
                        </Card>
                    )}

                    {!analyzing && !result && !error && (
                        <Card className="flex h-[300px] flex-col items-center justify-center space-y-4 border-dashed bg-muted/50">
                            <Sprout className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-center text-muted-foreground">
                                <h3 className="font-semibold">No Scan Results</h3>
                                <p className="text-sm">Upload or take a photo to see analysis here</p>
                            </div>
                        </Card>
                    )}

                    {result && (
                        <Card className="overflow-hidden border-primary/20 shadow-lg">
                            <CardHeader className="bg-primary/5 pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl text-primary">{result.diagnosis}</CardTitle>
                                        <div className="mt-2 flex gap-2">
                                            <Badge variant={result.confidence === 'High' ? 'default' : 'secondary'}>
                                                {result.confidence} Confidence
                                            </Badge>
                                        </div>
                                    </div>
                                    {result.diagnosis === 'Healthy' ? (
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Tabs defaultValue="treatment" className="w-full">
                                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                                        <TabsTrigger
                                            value="treatment"
                                            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            Treatment
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="symptoms"
                                            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            Symptoms & Cause
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="prevention"
                                            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            Prevention
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="p-6">
                                        <TabsContent value="treatment" className="mt-0 space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold flex items-center gap-2">
                                                    <Sprout className="h-4 w-4" /> Recommended Actions
                                                </h4>
                                                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                                    {result.treatment.map((step, i) => (
                                                        <li key={i}>{step}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="symptoms" className="mt-0 space-y-6">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Observed Symptoms</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.symptoms.map((symptom, i) => (
                                                        <Badge key={i} variant="outline" className="bg-background">
                                                            {symptom}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold flex items-center gap-2">
                                                    <Info className="h-4 w-4" /> Root Cause
                                                </h4>
                                                <p className="text-sm text-muted-foreground">{result.cause}</p>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="prevention" className="mt-0 space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Future Prevention</h4>
                                                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                                    {result.prevention.map((step, i) => (
                                                        <li key={i}>{step}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
