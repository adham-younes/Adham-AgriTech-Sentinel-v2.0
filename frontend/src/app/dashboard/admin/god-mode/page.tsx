"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Database, Activity, Eye, FileText, CloudRain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';

export default function GodModePage() {
    const [memories, setMemories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("memory");

    useEffect(() => {
        fetchMemory();
    }, []);

    const fetchMemory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/osiris-memory');
            const data = await res.json();
            if (data.memories) {
                setMemories(data.memories);
            }
        } catch (error) {
            console.error("Failed to fetch divine memory", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="mb-8 flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        OSIRIS GOD MODE
                    </h1>
                    <p className="text-gray-400 mt-2">Protocol PROMETHEUS Active | Sovereign Oversight Interface</p>
                </div>
                <div className="flex gap-4">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 px-4 py-1">
                        Sovereign Status: ONLINE
                    </Badge>
                    <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 px-4 py-1">
                        Brain: Gemini 3 Pro
                    </Badge>
                </div>
            </header>

            <Tabs defaultValue="memory" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="memory" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        <Brain className="mr-2 h-4 w-4" /> Mind Observatory
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Database className="mr-2 h-4 w-4" /> Knowledge Base
                    </TabsTrigger>
                    <TabsTrigger value="pilot" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                        <Activity className="mr-2 h-4 w-4" /> Pilot Operations
                    </TabsTrigger>
                </TabsList>

                {/* --- MIND OBSERVATORY --- */}
                <TabsContent value="memory" className="space-y-4">
                    <Card className="bg-black/40 border-white/10 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Eye className="text-emerald-400" />
                                Recent Thoughts & Memories
                            </CardTitle>
                            <CardDescription>Direct feed from BigQuery `osiris_memory` vector store.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {memories.map((mem, idx) => (
                                        <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between mb-2">
                                                <Badge className="bg-blue-900/50 text-blue-300 hover:bg-blue-900/70">{mem.doc_type}</Badge>
                                                <span className="text-xs text-gray-500 font-mono">
                                                    {new Date(mem.created_at.value).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 font-mono text-sm leading-relaxed">
                                                {mem.full_content}
                                            </p>
                                            <div className="mt-2 text-xs text-gray-600">ID: {mem.id}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- KNOWLEDGE BASE --- */}
                <TabsContent value="knowledge" className="space-y-4">
                    <Card className="bg-black/40 border-white/10 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl text-blue-400">
                                <CloudRain className="text-blue-400" />
                                Mass Ingestion Protocols
                            </CardTitle>
                            <CardDescription>Inject massive datasets into the Sovereign Memory.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-xl border border-dashed border-white/20 hover:border-blue-400/50 transition-colors flex flex-col items-center justify-center text-center group cursor-pointer">
                                    <CloudRain className="h-10 w-10 text-gray-500 group-hover:text-blue-400 mb-4 transition-colors" />
                                    <h3 className="text-lg font-bold text-gray-300 group-hover:text-white">Weather Archive Ingestion</h3>
                                    <p className="text-sm text-gray-500 mt-2">Fetch 10-year history for all registered fields via OpenMeteo API.</p>
                                    <Button variant="secondary" className="mt-4" disabled>Coming Soon (Automated via Script)</Button>
                                </div>
                                <div className="p-6 rounded-xl border border-dashed border-white/20 hover:border-amber-400/50 transition-colors flex flex-col items-center justify-center text-center group cursor-pointer">
                                    <FileText className="h-10 w-10 text-gray-500 group-hover:text-amber-400 mb-4 transition-colors" />
                                    <h3 className="text-lg font-bold text-gray-300 group-hover:text-white">Research Paper Upload</h3>
                                    <p className="text-sm text-gray-500 mt-2">Drag & Drop PDFs to generate embeddings and inject into Vector Store.</p>
                                    <Button variant="secondary" className="mt-4" disabled>Coming Soon</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PILOT OPERATIONS --- */}
                <TabsContent value="pilot" className="space-y-4">
                    <div className="p-12 text-center text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">Pilot Protocol Standby</h3>
                        <p>Select a field in the main dashboard to activate Sovereign Driver Mode.</p>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
