'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

interface CameraCaptureProps {
    onCapture: (imageData: string) => void;
    isAnalyzing?: boolean;
}

export function CameraCapture({ onCapture, isAnalyzing = false }: CameraCaptureProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirm = () => {
        if (preview) {
            onCapture(preview);
        }
    };

    const clearImage = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full space-y-4">
            {!preview ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Card
                        className="flex flex-col items-center justify-center gap-4 border-dashed p-8 transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold">Upload Photo</h3>
                            <p className="text-sm text-muted-foreground">Select from gallery</p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </Card>

                    <Card
                        className="flex flex-col items-center justify-center gap-4 border-dashed p-8 transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()} // For now, mobile browsers handle camera via file input
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Camera className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold">Take Photo</h3>
                            <p className="text-sm text-muted-foreground">Use camera</p>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-lg border bg-background">
                    <div className="relative aspect-video w-full sm:aspect-[4/3]">
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearImage}
                            disabled={isAnalyzing}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Retake
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isAnalyzing}
                            className="min-w-[120px]"
                        >
                            {isAnalyzing ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze Plant'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
