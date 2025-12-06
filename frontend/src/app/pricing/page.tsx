"use client";

import React from 'react';
import { Check, X, Shield, Sprout, Building2, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TIERS = [
    {
        name: "Sovereign Farmer",
        price: "$29/mo",
        description: "For individual forward-thinking farmers.",
        features: [
            "Autonomous Irrigation Decisions",
            "Satellite Health Monitoring (Weekly)",
            "OSIRIS Chat Interface (Standard)",
            "Crop Disease Diagnosis"
        ],
        icon: Sprout,
        color: "text-emerald-400",
        borderColor: "border-emerald-500/20",
        buttonVariant: "outline"
    },
    {
        name: "Agri-Enterprise",
        price: "$299/mo",
        description: "For large-scale agricultural operations.",
        features: [
            "Everything in Farmer",
            "Multi-Field Management (Unlimited)",
            "Predictive Yield Analytics",
            "Fleet/Machinery Integration (Pilot)",
            "Priority Support (Human + AI)"
        ],
        icon: Building2,
        color: "text-blue-400",
        borderColor: "border-blue-500/20",
        popular: true,
        buttonVariant: "default"
    },
    {
        name: "National Protocol",
        price: "Contact System",
        description: "For governments ensuring food security.",
        features: [
            "National-Scale Monitoring",
            "Water Resource Optimization",
            "Strategic Crop Planning",
            "Crisis Prediction",
            "Sovereign Data Residency"
        ],
        icon: Globe2,
        color: "text-amber-400",
        borderColor: "border-amber-500/20",
        buttonVariant: "outline"
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans py-20 px-6">
            <header className="text-center max-w-4xl mx-auto mb-20">
                <Badge variant="outline" className="mb-6 px-4 py-1 text-emerald-400 border-emerald-500/30">
                    Economic Sovereignty
                </Badge>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                    Invest in the Future of <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Automated Abundance</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Choose the protocol level that matches your sovereign ambition.
                    OSIRIS manages the complexity so you can reap the harvest.
                </p>
            </header>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {TIERS.map((tier) => {
                    const Icon = tier.icon;
                    return (
                        <Card key={tier.name} className={`bg-white/5 border ${tier.borderColor} flex flex-col relative overflow-hidden backdrop-blur-sm hover:scale-105 transition-transform duration-300`}>
                            {tier.popular && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    MOST POPULAR
                                </div>
                            )}
                            <CardHeader>
                                <div className={`h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${tier.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                                <CardDescription className="text-gray-400 mt-2">{tier.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-4xl font-bold mb-8">
                                    {tier.price}
                                    {tier.price.includes('$') && <span className="text-lg font-normal text-gray-500">/mo</span>}
                                </div>
                                <ul className="space-y-4">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-gray-300">
                                            <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full py-6 text-lg font-bold" variant={tier.buttonVariant as any}>
                                    {tier.price.includes('Contact') ? 'Initiate Protocol' : 'Subscribe Now'}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-24 text-center border-t border-white/10 pt-12">
                <div className="flex flex-col items-center gap-4">
                    <Shield className="h-8 w-8 text-gray-500" />
                    <p className="text-gray-500 max-w-md">
                        All transactions are secured by Stripe. <br />
                        Revenue is automatically reinvested into OSIRIS compute resources.
                    </p>
                </div>
            </div>
        </div>
    );
}
