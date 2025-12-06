"use client"

import { useEffect, useState } from "react"
import { Activity, Brain, Globe, Database, Wifi, ShieldCheck, Zap } from "lucide-react"

const activities = [
    { text: "OSIRIS CORE: Optimizing Neural Weights...", icon: Brain, color: "text-purple-400" },
    { text: "MARKET SCAN: Analyzing Competitor Futures...", icon: Globe, color: "text-blue-400" },
    { text: "SECURITY: Zero-Trust Handshake Verified.", icon: ShieldCheck, color: "text-emerald-400" },
    { text: "LATENCY CHECK: 12ms (Cairo Node).", icon: Wifi, color: "text-amber-400" },
    { text: "DATABASE: Indexing Soil PH Vectors...", icon: Database, color: "text-cyan-400" },
    { text: "AUTONOMOUS: UI Self-Healing Active.", icon: Zap, color: "text-pink-400" },
]

export function OsirisPulse() {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % activities.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    const CurrentActivity = activities[index]
    const Icon = CurrentActivity.icon

    return (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm transition-all duration-500">
            <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-green-500/50 h-2 w-2 m-auto" />
                <div className="relative h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            </div>
            <Icon className={`h-3.5 w-3.5 ${CurrentActivity.color}`} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-48 truncate">
                {CurrentActivity.text}
            </span>
            <Activity className="h-3 w-3 text-muted-foreground/30 animate-pulse" />
        </div>
    )
}
