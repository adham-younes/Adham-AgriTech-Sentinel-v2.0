"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Database, Activity, Eye, FileText, CloudRain, ShieldCheck, Building2, Globe2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const ALLOWED_EMAILS = [
    'adhamyounesmohamedahmed@gmail.com',
    'adham@adham-agritech.com',
    'adhamlouxor@gmail.com'
];

export default function GodModePage() {
    const [memories, setMemories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("memory");
    const [isDivineView, setIsDivineView] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        checkUserAccess();
        fetchMemory();
    }, []);

    const checkUserAccess = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            setUserEmail(user.email);
            if (ALLOWED_EMAILS.includes(user.email)) {
                setIsDivineView(true);
            }
        }
    };

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

    // Text Variants based on View Mode
    const texts = {
        title: isDivineView ? "OSIRIS GOD MODE" : "OSIRIS CORE SYSTEM",
        subtitle: isDivineView ? "Protocol PROMETHEUS Active | Sovereign Oversight Interface" : "Advanced System Oversight | Neural Core Interface",
        statusBadge: isDivineView ? "Sovereign Status: ONLINE" : "System Status: ONLINE",
        brainBadge: isDivineView ? "Brain: Gemini 3 Pro (Divine)" : "Model: Gemini 3 Pro (High-Reasoning)",
        tabMemory: isDivineView ? "Mind Observatory" : "Neural Logs",
        tabKnowledge: isDivineView ? "Knowledge Base" : "Data Ingestion",
        tabPilot: isDivineView ? "Pilot Operations" : "Autonomous Operations",
        memoryTitle: isDivineView ? "Recent Thoughts & Memories" : "System Decision Logs",
        memoryDesc: isDivineView ? "Direct feed from BigQuery `osiris_memory` vector store." : "Real-time decision feed from the vector database.",
        ingestTitle: isDivineView ? "Mass Ingestion Protocols" : "Data Pipeline Management",
        ingestDesc: isDivineView ? "Inject massive datasets into the Sovereign Memory." : "Manage data ingestion streams for model training.",
        pilotTitle: isDivineView ? "Pilot Protocol Standby" : "Autonomous Driver Standby",
        welcome: isDivineView ? "Welcome, Eng. Adham Younes Mohamed - System Architect & Creator." : null
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="mb-8 border-b border-white/10 pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            {texts.title}
                        </h1>
                        <p className="text-gray-400 mt-2">{texts.subtitle}</p>
                        {texts.welcome && (
                            <div className="mt-4 flex items-center gap-2 text-amber-400 bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-500/30 w-fit">
                                <ShieldCheck className="h-5 w-5" />
                                <span className="font-semibold">{texts.welcome}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex gap-4">
                            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 px-4 py-1">
                                {texts.statusBadge}
                            </Badge>
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 px-4 py-1">
                                {texts.brainBadge}
                            </Badge>
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1">
                            User: {userEmail || 'Anonymous'}
                        </div>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="memory" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="memory" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        <Brain className="mr-2 h-4 w-4" /> {texts.tabMemory}
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Database className="mr-2 h-4 w-4" /> {texts.tabKnowledge}
                    </TabsTrigger>
                    <TabsTrigger value="corporate" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                        <Building2 className="mr-2 h-4 w-4" /> Corporate
                    </TabsTrigger>
                    <TabsTrigger value="pilot" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Activity className="mr-2 h-4 w-4" /> {texts.tabPilot}
                    </TabsTrigger>
                </TabsList>

                {/* --- MIND OBSERVATORY --- */}
                <TabsContent value="memory" className="space-y-4">
                    <Card className="bg-black/40 border-white/10 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Eye className="text-emerald-400" />
                                {texts.memoryTitle}
                            </CardTitle>
                            <CardDescription>{texts.memoryDesc}</CardDescription>
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
                                {texts.ingestTitle}
                            </CardTitle>
                            <CardDescription>{texts.ingestDesc}</CardDescription>
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

                {/* --- CORPORATE SOVEREIGN --- */}
                <TabsContent value="corporate" className="space-y-4">
                    <Card className="bg-black/40 border-white/10 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl text-amber-400">
                                <Building2 className="text-amber-400" />
                                Corporate Genesis Protocol
                            </CardTitle>
                            <CardDescription>Automated Entity Formation & Financial Sovereignty</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Formation Status */}
                                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                                        <Globe2 className="h-4 w-4 text-emerald-400" /> Entity Status: <span className="text-red-400">UNREGISTERED</span>
                                    </h3>
                                    <ul className="space-y-3 text-sm text-gray-400 mb-6">
                                        <li className="flex justify-between">
                                            <span>Jurisdiction:</span> <span className="text-white">Delaware, USA 🇺🇸</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Entity Type:</span> <span className="text-white">Limited Liability Company (LLC)</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Agent:</span> <span className="text-white">Stripe Atlas</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Est. Cost:</span> <span className="text-white">$500.00</span>
                                        </li>
                                    </ul>
                                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={() => alert("Simulating Stripe Atlas API Call... Email dispatched to adham@adham-agritech.com")}>
                                        Authorize Formation ($500)
                                    </Button>
                                    <p className="text-xs text-gray-600 mt-3 text-center">
                                        *Requires KYC verification via email link.
                                    </p>
                                </div>

                                {/* Financial Treasury */}
                                <div className="p-6 rounded-xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed">
                                    <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-gray-400" /> Treasury (Coming Soon)
                                    </h3>
                                    <div className="h-32 flex items-center justify-center text-gray-600 text-sm">
                                        Waiting for Mercury Bank Account...
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PILOT OPERATIONS --- */}
                <TabsContent value="pilot" className="space-y-4">
                    <div className="p-12 text-center text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">{texts.pilotTitle}</h3>
                        <p>Select a field in the main dashboard to activate {isDivineView ? "Sovereign" : "Autonomous"} Driver Mode.</p>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
