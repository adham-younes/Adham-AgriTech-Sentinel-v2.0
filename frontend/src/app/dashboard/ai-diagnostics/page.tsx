"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileImage, AlertTriangle, CheckCircle, Activity, Sprout } from "lucide-react"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/use-language"

// Strict Color Palette Constants
const COLOR_THEME_DARK = "#1a1a1a" // Matte Black
const COLOR_THEME_PRIMARY = "#10b981" // Vivid Green
const COLOR_SEVERITY_HIGH = "#ef4444" // Red
const COLOR_SEVERITY_MEDIUM = "#f59e0b" // Orange
const COLOR_SEVERITY_LOW = "#10b981" // Green

interface DiagnosisResult {
    disease_name: string
    confidence_score: number
    severity: "High" | "Medium" | "Low"
    recommendation_id: string
}

export default function AIDiagnosticsPage() {
    const { t, language } = useTranslation()
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [result, setResult] = useState<DiagnosisResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const imageUrl = URL.createObjectURL(file)
            setSelectedImage(imageUrl)
            setResult(null)
            setError(null)
            setIsAnalyzing(true)

            const formData = new FormData()
            formData.append("file", file)

            try {
                // Call the Python Microservice
                const response = await fetch("http://localhost:8000/api/v1/diagnose_image", {
                    method: "POST",
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error("Failed to analyze image")
                }

                const data: DiagnosisResult = await response.json()
                setResult(data)
            } catch (err) {
                console.error("Diagnosis error:", err)
                setError("Failed to analyze image. Please ensure the diagnosis service is running.")
            } finally {
                setIsAnalyzing(false)
            }
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "High": return COLOR_SEVERITY_HIGH
            case "Medium": return COLOR_SEVERITY_MEDIUM
            case "Low": return COLOR_SEVERITY_LOW
            default: return COLOR_THEME_PRIMARY
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-8 min-h-screen" style={{ backgroundColor: COLOR_THEME_DARK, color: '#e5e7eb' }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {language === 'ar' ? 'المركز الذكي للتشخيص' : 'AI Diagnostics Hub'}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {language === 'ar' ? 'كشف متقدم عن أمراض المحاصيل وتحليل التربة' : 'Advanced crop disease detection and soil analysis'}
                    </p>
                </div>
                <Badge variant="outline" className="px-4 py-2 border-emerald-500 text-emerald-400 bg-emerald-950/30">
                    <Activity className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'النظام يعمل' : 'System Operational'}
                </Badge>
            </div>

            <Tabs defaultValue="disease" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-gray-800">
                    <TabsTrigger value="disease" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        {language === 'ar' ? 'كشف الأمراض' : 'Disease Detection'}
                    </TabsTrigger>
                    <TabsTrigger value="soil" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        {language === 'ar' ? 'تحليل التربة' : 'Soil Analysis'}
                    </TabsTrigger>
                    <TabsTrigger value="registry" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        {language === 'ar' ? 'سجل النماذج' : 'Model Registry'}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="disease" className="mt-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Upload Section */}
                        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-emerald-400 flex items-center gap-2">
                                    <FileImage className="w-5 h-5" />
                                    {language === 'ar' ? 'تحليل الصورة' : 'Image Analysis'}
                                </CardTitle>
                                <CardDescription className="text-gray-400">
                                    {language === 'ar' ? 'قم برفع صورة واضحة للورقة أو الساق المصابة' : 'Upload a clear image of the affected crop leaf or stem'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div
                                    className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer bg-gray-950/50"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    {selectedImage ? (
                                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                            <Image
                                                src={selectedImage}
                                                alt="Selected crop"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 py-8">
                                            <div className="p-4 rounded-full bg-gray-800 text-emerald-500">
                                                <Upload className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-gray-300">
                                                    {language === 'ar' ? 'اضغط للرفع أو اسحب وأفلت' : 'Click to upload or drag and drop'}
                                                </p>
                                                <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 10MB)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isAnalyzing && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>{language === 'ar' ? 'جاري تحليل الصورة...' : 'Analyzing image...'}</span>
                                            <span>Processing</span>
                                        </div>
                                        <Progress value={45} className="h-2 bg-gray-800" indicatorClassName="bg-emerald-500" />
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Results Section */}
                        <Card className="bg-gray-900 border-gray-800 h-full">
                            <CardHeader>
                                <CardTitle className="text-emerald-400 flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    {language === 'ar' ? 'نتائج التشخيص' : 'Diagnosis Results'}
                                </CardTitle>
                                <CardDescription className="text-gray-400">
                                    {language === 'ar' ? 'تحليل مدعوم بالذكاء الاصطناعي وتوصيات العلاج' : 'AI-powered analysis and treatment recommendations'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {result ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="p-4 rounded-lg bg-gray-950 border border-gray-800 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">{result.disease_name}</h3>
                                                    <p className="text-sm text-gray-400 mt-1">Detected with high confidence</p>
                                                </div>
                                                <Badge
                                                    className="text-white border-0"
                                                    style={{ backgroundColor: getSeverityColor(result.severity) }}
                                                >
                                                    {result.severity} Severity
                                                </Badge>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Confidence Score</span>
                                                    <span className="text-emerald-400 font-mono">{(result.confidence_score * 100).toFixed(1)}%</span>
                                                </div>
                                                <Progress
                                                    value={result.confidence_score * 100}
                                                    className="h-2 bg-gray-800"
                                                    indicatorClassName="bg-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Recommended Actions</h4>
                                            <div className="grid gap-3">
                                                <div className="p-3 rounded-md bg-gray-800/50 border-l-2 border-emerald-500 flex gap-3">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                                    <p className="text-sm text-gray-300">Apply copper-based fungicide immediately to prevent spread.</p>
                                                </div>
                                                <div className="p-3 rounded-md bg-gray-800/50 border-l-2 border-emerald-500 flex gap-3">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                                    <p className="text-sm text-gray-300">Reduce irrigation frequency to lower humidity levels.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-4 min-h-[300px]">
                                        <Sprout className="w-16 h-16 opacity-20" />
                                        <p>{language === 'ar' ? 'ارفع صورة لرؤية التشخيص التفصيلي وخطة العلاج' : 'Upload an image to see detailed diagnosis and treatment plan'}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="soil">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-emerald-400">{language === 'ar' ? 'تحليل التربة' : 'Soil Analysis'}</CardTitle>
                            <CardDescription className="text-gray-400">Comprehensive soil health monitoring</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                Soil analysis module coming soon
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="registry">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-emerald-400">{language === 'ar' ? 'سجل النماذج' : 'Model Registry'}</CardTitle>
                            <CardDescription className="text-gray-400">Manage and version control AI models</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                Model registry module coming soon
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
