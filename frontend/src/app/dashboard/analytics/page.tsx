"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AnalyticsPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <Card className="w-full max-w-2xl glass-card border-emerald-400/20 bg-gray-900/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="flex flex-col items-center space-y-2">
                    <CardTitle className="text-2xl font-bold text-white">
                        Analytics (Coming Soon)
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-300">
                    <p className="mb-4">
                        We are working on advanced analytics features for your farm data.
                    </p>
                    <Link href="/dashboard" passHref>
                        <Button variant="outline" className="mt-2">
                            Back to Dashboard
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
