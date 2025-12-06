"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tractor, AlertTriangle, CheckCircle, Activity, Wind, Droplets } from 'lucide-react';

export function PilotOperationsWidget() {
    const [status, setStatus] = useState<'standby' | 'active'>('standby');
    const [tasks, setTasks] = useState([
        { id: 1, type: 'irrigation', title: 'Pivot A Irrigation', detail: 'Apply 15mm water', status: 'pending', priority: 'high' },
        { id: 2, type: 'scouting', title: 'Scout Sector 3', detail: 'Check for rust', status: 'pending', priority: 'medium' },
        { id: 3, type: 'fertigation', title: 'Nitrogen Boost', detail: 'Sector 1 & 2', status: 'completed', priority: 'high' }
    ]);

    const activatePilot = () => {
        setStatus('active');
        // In a real scenario, this would trigger an OSIRIS "Decide" loop for the field
    };

    return (
        <Card className="glass-card border-amber-500/20 shadow-2xl backdrop-blur-xl bg-black/60">
            <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-amber-400">
                            <Tractor className="h-6 w-6" />
                            Pilot Operations Protocol
                        </CardTitle>
                        <CardDescription>Autonomous Field Management System</CardDescription>
                    </div>
                    <Badge variant={status === 'active' ? 'default' : 'outline'} className={status === 'active' ? "bg-emerald-500 text-black" : "text-gray-400 border-gray-600"}>
                        {status === 'active' ? 'PILOT: ACTIVE' : 'PILOT: STANDBY'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {status === 'standby' ? (
                    <div className="text-center py-8">
                        <Activity className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-300">Manual Oversight Mode</h3>
                        <p className="text-sm text-gray-500 mb-6">OSIRIS is monitoring but not executing actions.</p>
                        <Button
                            onClick={activatePilot}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                        >
                            ENGAGE AUTOPILOT
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Live Telemetry Simulation */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center">
                                <Wind className="h-4 w-4 mx-auto text-cyan-400 mb-1" />
                                <div className="text-xs text-gray-400">Wind</div>
                                <div className="font-mono text-white">12 km/h</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center">
                                <Droplets className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                                <div className="text-xs text-gray-400">Moisture</div>
                                <div className="font-mono text-white">42%</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center">
                                <Activity className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
                                <div className="text-xs text-gray-400">Health</div>
                                <div className="font-mono text-white">98%</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Mission Queue</h4>
                            {tasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3">
                                        {task.status === 'completed' ? (
                                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <div className="h-5 w-5 rounded-full border-2 border-amber-500/50 animate-pulse" />
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-200">{task.title}</div>
                                            <div className="text-xs text-gray-500">{task.detail}</div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {task.priority.toUpperCase()}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
