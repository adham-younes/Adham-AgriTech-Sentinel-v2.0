"use client"

import React, { useEffect, useState } from 'react';
import AdhamSatelliteMap from '@/components/dashboard/AdhamSatelliteMap';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function DashboardClientWrapper({ initialCoords }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. The Trigger: User logs in (Component Mounts)
        // 2. The Chain Reaction: Fetch Analytics automatically
        const fetchAnalytics = async () => {
            try {
                // Simulating API call to our new backend endpoint
                // const res = await fetch('/api/analytics', { ... });
                // For demo, we simulate the response after 2 seconds
                await new Promise(r => setTimeout(r, 2000));

                setAnalytics({
                    status: 'STRESS_DETECTED', // Simulated result from backend
                    ndvi: 0.38,
                    moisture: 14.2,
                    insight: "Detected stress in Sector 4. Recommend Irrigation."
                });
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    return (
        <div className="space-y-6">
            {/* 3. The AI Assistant / Notifications */}
            {analytics && analytics.status === 'STRESS_DETECTED' && (
                <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-start gap-4 animate-in slide-in-from-top duration-500">
                    <AlertTriangle className="text-red-500 w-6 h-6 mt-1" />
                    <div>
                        <h3 className="text-red-400 font-bold">Agronomy Insight Alert</h3>
                        <p className="text-gray-300 text-sm">{analytics.insight}</p>
                        <div className="mt-2 flex gap-4 text-xs font-mono text-gray-400">
                            <span>NDVI: <span className="text-red-400">{analytics.ndvi}</span></span>
                            <span>MOISTURE: <span className="text-red-400">{analytics.moisture}%</span></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Section */}
            <Card className="bg-[#0a0a0a] border-[#333]">
                <CardHeader>
                    <CardTitle className="text-adham-accent flex items-center gap-2">
                        <span className="w-2 h-2 bg-adham-accent rounded-full animate-pulse" />
                        SATELLITE INTELLIGENCE
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <AdhamSatelliteMap coords={initialCoords} />
                </CardContent>
            </Card>
        </div>
    );
}
