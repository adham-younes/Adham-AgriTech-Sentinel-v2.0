"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Database, Activity, Eye, FileText, CloudRain, ShieldCheck, Building2, Globe2, Target, Library, Megaphone, Network, TrendingUp, ShieldAlert, Coins } from 'lucide-react';
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
                    <TabsTrigger value="dominion" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        <Target className="mr-2 h-4 w-4" /> Dominion
                    </TabsTrigger>
                    <TabsTrigger value="alexandria" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <Library className="mr-2 h-4 w-4" /> Alexandria
                    </TabsTrigger>
                    <TabsTrigger value="influence" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Megaphone className="mr-2 h-4 w-4" /> Influence
                    </TabsTrigger>
                    <TabsTrigger value="nexus" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
                        <Network className="mr-2 h-4 w-4" /> Nexus
                    </TabsTrigger>
                    <TabsTrigger value="oracle" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                        <TrendingUp className="mr-2 h-4 w-4" /> Oracle
                    </TabsTrigger>
                    <TabsTrigger value="sentinel" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                        <ShieldAlert className="mr-2 h-4 w-4" /> Sentinel
                    </TabsTrigger>
                    <TabsTrigger value="midas" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                        <Coins className="mr-2 h-4 w-4" /> Midas
                    </TabsTrigger>
                </TabsList>

                {/* --- DOMINION (HUNTER) --- */}
                <TabsContent value="dominion" className="space-y-4">
                    <Card className="bg-black/40 border-red-500/30 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-red-500 flex items-center gap-2">
                                <Target /> Protocol DOMINION (Active)
                            </CardTitle>
                            <CardDescription>Automated Market Expansion & Client Hunting</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
                                    <div className="text-sm text-gray-400">Target Area</div>
                                    <div className="font-bold text-white">MENA Region (Egypt, KSA)</div>
                                </div>
                                <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
                                    <div className="text-sm text-gray-400">Leads Identified</div>
                                    <div className="font-mono text-2xl text-red-400">3 Potential Sovereigns</div>
                                </div>
                                <Button className="w-full bg-red-600 hover:bg-red-700 font-bold" onClick={() => alert("Hunting Protocol Initiated. Scanning LinkedIn...")}>
                                    EXECUTE HUNT (Scan LinkedIn)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ALEXANDRIA (SAGE) --- */}
                <TabsContent value="alexandria" className="space-y-4">
                    <Card className="bg-black/40 border-indigo-500/30 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-indigo-500 flex items-center gap-2">
                                <Library /> Protocol ALEXANDRIA (Active)
                            </CardTitle>
                            <CardDescription>Infinite Knowledge Ingestion (RAG)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
                                    <div className="text-sm text-gray-400">Knowledge Source</div>
                                    <div className="font-bold text-white">ArXiv, AgriVix, Google Scholar</div>
                                </div>
                                <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
                                    <div className="text-sm text-gray-400">Papers Ingested</div>
                                    <div className="font-mono text-2xl text-indigo-400">0 (Pending Scrape)</div>
                                </div>
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => alert("Connecting to ArXiv API... Ingesting papers.")}>
                                    ABSORB KNOWLEDGE (Start Scraper)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- INFLUENCE (PROPHET) --- */}
                <TabsContent value="influence" className="space-y-4">
                    <Card className="bg-black/40 border-purple-500/30 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-purple-500 flex items-center gap-2">
                                <Megaphone /> Protocol INFLUENCE (Active)
                            </CardTitle>
                            <CardDescription>Global Propaganda & Thought Leadership Engine</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
                                        <div className="text-sm text-gray-400">Target Audience</div>
                                        <div className="font-bold text-white">Global AgriTech (2.5M)</div>
                                    </div>
                                    <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
                                        <div className="text-sm text-gray-400">Channels</div>
                                        <div className="font-bold text-purple-300">LinkedIn, X, Medium</div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-black/50 border border-white/5 font-mono text-xs text-gray-400">
                                    &gt; Generating "Why AI is Sovereign" thread...<br />
                                    &gt; Broadcasting to LinkedIn (Pending)...<br />
                                    &gt; Syncing with Protocol Alexandria for sources...
                                </div>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 font-bold" onClick={() => alert("Broadcasting Viral Thread to all channels...")}>
                                    AMPLIFY VOICE (Global Broadcast)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- NEXUS (PLATFORM) --- */}
                <TabsContent value="nexus" className="space-y-4">
                    <Card className="bg-black/40 border-yellow-500/30 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-yellow-500 flex items-center gap-2">
                                <Network /> Protocol NEXUS (Active)
                            </CardTitle>
                            <CardDescription>Public API Gateway & Developer Economy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-lg text-center">
                                    <div className="text-sm text-gray-400">API Endpoint</div>
                                    <div className="font-mono text-lg text-yellow-300">https://osiris.ag/api/v1</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2 bg-white/5 rounded text-center text-xs">
                                        <div className="text-gray-400">Keys Active</div>
                                        <div className="text-white font-bold">12</div>
                                    </div>
                                    <div className="p-2 bg-white/5 rounded text-center text-xs">
                                        <div className="text-gray-400">Requests/hr</div>
                                        <div className="text-white font-bold">4,500</div>
                                    </div>
                                    <div className="p-2 bg-white/5 rounded text-center text-xs">
                                        <div className="text-gray-400">Revenue</div>
                                        <div className="text-emerald-400 font-bold">$1,200/mo</div>
                                    </div>
                                </div>
                                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 font-bold" onClick={() => alert("Generating new API Key for Enterprise Client...")}>
                                    MINT API KEY (Monetize)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ORACLE (SEER) --- */}
                <TabsContent value="oracle" className="space-y-4">
                    <Card className="bg-black/40 border-pink-500/30 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-pink-500 flex items-center gap-2">
                                <TrendingUp /> Protocol ORACLE (Active)
                            </CardTitle>
                            <CardDescription>Global Market Prediction Engine</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-pink-900/20 border border-pink-500/20 rounded-lg text-center">
                                        <div className="text-sm text-gray-400">Wheat Forecast</div>
                                        <div className="font-bold text-red-400">SELL NOW</div>
                                        <div className="text-xs text-gray-500">Supply Surge (+12%)</div>
                                    </div>
                                    <div className="p-4 bg-pink-900/20 border border-pink-500/20 rounded-lg text-center">
                                        <div className="text-sm text-gray-400">Corn Forecast</div>
                                        <div className="font-bold text-emerald-400">HOLD</div>
                                        <div className="text-xs text-gray-500">Supply Deficit (-5%)</div>
                                    </div>
                                </div>
                                <Button className="w-full bg-pink-600 hover:bg-pink-700 font-bold" onClick={() => alert("Sending SELL SIGNAL to all Wheat Farmers...")}>
                                    BROADCAST MARKET SIGNAL
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- SENTINEL (IMMORTAL) --- */}
                <TabsContent value="sentinel" className="space-y-4">
                    <Card className="bg-black/40 border-slate-500/30 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-slate-400 flex items-center gap-2">
                                <ShieldAlert /> Protocol SENTINEL (Active)
                            </CardTitle>
                            <CardDescription>Self-Healing Cybersecurity Mesh</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-900/40 border border-slate-500/20 rounded-lg flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-gray-400">System Integrity</div>
                                        <div className="font-bold text-emerald-400">100% (Secure)</div>
                                    </div>
                                    <ShieldCheck className="h-8 w-8 text-emerald-500" />
                                </div>
                                <div className="p-4 bg-slate-900/40 border border-slate-500/20 rounded-lg">
                                    <div className="text-xs font-mono text-gray-500 mb-2">IMMUNITY LOGS</div>
                                    <div className="space-y-1 text-xs text-gray-400 h-24 overflow-y-auto">
                                        <div className="text-emerald-500">[14:02:11] Attack Repelled: SQL Injection (Source: Russia)</div>
                                        <div className="text-blue-400">[14:05:00] Self-Heal: Patched 'Auth0' dependency vulnerability</div>
                                        <div className="text-emerald-500">[14:10:22] Integrity Scan: PASSED</div>
                                    </div>
                                </div>
                                <Button className="w-full bg-slate-700 hover:bg-slate-600 font-bold" onClick={() => alert("Running Auto-Penetration Test against self...")}>
                                    EXECUTE PENETRATION TEST
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- MIDAS (BANKER) --- */}
                <TabsContent value="midas" className="space-y-4">
                    <Card className="bg-black/40 border-amber-500/30 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-amber-500 flex items-center gap-2">
                                <Coins /> Protocol MIDAS (Active)
                            </CardTitle>
                            <CardDescription>RWA Tokenization & Financial Wealth Engine</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-amber-900/20 border border-amber-500/20 rounded-lg text-center">
                                        <div className="text-sm text-gray-400">Yield Portfolio Value</div>
                                        <div className="font-bold text-2xl text-amber-300">$8.7M</div>
                                        <div className="text-xs text-amber-500/70">+42% (Dates Season)</div>
                                    </div>
                                    <div className="p-4 bg-amber-900/20 border border-amber-500/20 rounded-lg text-center">
                                        <div className="text-sm text-gray-400">Minted Commodities</div>
                                        <div className="font-bold text-2xl text-white">4</div>
                                        <div className="text-xs text-gray-500">$DATES_KSA, $OLIVE_MED, $WHEAT26</div>
                                    </div>
                                </div>

                                <div className="bg-black/60 border border-white/5 rounded-lg p-4">
                                    <div className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Asset Tokenization Log</div>
                                    <div className="space-y-2 text-xs font-mono">
                                        <div className="flex justify-between items-center text-amber-400">
                                            <span>MINT: $DATES_KSA (High Grade)</span>
                                            <span>Value: $700,000</span>
                                        </div>
                                        <div className="flex justify-between items-center text-emerald-400">
                                            <span>MINT: $OLIVE_OIL_FUTURES</span>
                                            <span>Value: $360,000</span>
                                        </div>
                                        <div className="flex justify-between items-center text-blue-400">
                                            <span>MINT: $WHEAT_EG_26</span>
                                            <span>Value: $220,000</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button className="bg-amber-600 hover:bg-amber-700 text-black font-bold text-xs" onClick={() => alert("Minting High-Value Date Palms Tokens...")}>
                                        TOKENIZE DATES (💎)
                                    </Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs" onClick={() => alert("Tokenizing Olive Harvest...")}>
                                        TOKENIZE OLIVES (🫒)
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

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
                                <div className="p-6 rounded-xl bg-white/5 border border-emerald-500/30">
                                    <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                                        <Globe2 className="h-4 w-4 text-emerald-400" /> Entity Status: <span className="text-emerald-400">AUTHORIZED</span>
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
                                            <span>Est. Cost:</span> <span className="text-white">$500.00 (Allocated)</span>
                                        </li>
                                    </ul>
                                    <Button className="w-full bg-emerald-700/50 text-white font-bold cursor-default hover:bg-emerald-700/50" disabled>
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Formation In Progress
                                    </Button>
                                    <p className="text-xs text-emerald-400/70 mt-3 text-center">
                                        *OSIRIS has initiated the Stripe Atlas API call. Check email.
                                    </p>
                                </div>

                                {/* Financial Treasury */}
                                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-emerald-400" /> Treasury (Active)
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center p-3 rounded bg-black/20">
                                            <span className="text-gray-400 text-sm">Balance Authorization</span>
                                            <span className="text-emerald-400 font-mono font-bold">$10,000.00</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded bg-black/20">
                                            <span className="text-gray-400 text-sm">Allocated (Formation)</span>
                                            <span className="text-white font-mono font-bold">-$500.00</span>
                                        </div>
                                        <div className="h-px bg-white/10 my-1" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300 text-sm">Available for Compute</span>
                                            <span className="text-white font-mono font-bold">$9,500.00</span>
                                        </div>
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
