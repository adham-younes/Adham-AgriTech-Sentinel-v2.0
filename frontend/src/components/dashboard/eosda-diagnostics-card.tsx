'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Activity } from 'lucide-react'

interface DiagnosticResult {
    test: string
    status: 'success' | 'error' | 'warning'
    message: string
    details?: any
}

export function EOSDADiagnosticsCard() {
    const [running, setRunning] = useState(false)
    const [results, setResults] = useState<DiagnosticResult[]>([])

    const runDiagnostics = async () => {
        setRunning(true)
        const tests: DiagnosticResult[] = []

        // Test 1: Check API key configuration
        try {
            const res = await fetch('/api/test-eosda')
            const data = await res.json()
            tests.push({
                test: 'API Key Configuration',
                status: data.configured?.NEXT_PUBLIC_EOSDA_API_KEY ? 'success' : 'error',
                message: data.configured?.NEXT_PUBLIC_EOSDA_API_KEY
                    ? 'API key configured ✓'
                    : 'API key missing ✗',
                details: {
                    hasKey: data.configured?.NEXT_PUBLIC_EOSDA_API_KEY,
                    hasUrl: data.configured?.NEXT_PUBLIC_EOSDA_API_URL,
                }
            })
        } catch (error) {
            tests.push({
                test: 'API Key Configuration',
                status: 'error',
                message: 'Failed to check configuration',
                details: error
            })
        }

        // Test 2: Scene Search API
        try {
            // مصر - Cairo area
            const bbox = '32.5,25.2,32.6,25.3'
            const res = await fetch(`/api/eosda/search?bbox=${bbox}&cloudCoverage=30&limit=3`, {
                cache: 'no-store',
                signal: AbortSignal.timeout(10000),
            })
            const data = await res.json()

            tests.push({
                test: 'Scene Search',
                status: data.count > 0 ? 'success' : 'warning',
                message: `Found ${data.count || 0} scenes`,
                details: {
                    count: data.count,
                    success: data.success,
                    scenes: data.scenes?.slice(0, 2).map((s: any) => ({
                        id: s.id,
                        date: s.date,
                        cloudCoverage: s.cloudCoverage
                    }))
                }
            })

            // Test 3: Tiles endpoint (if we have a scene)
            if (data.scenes && data.scenes.length > 0) {
                try {
                    const sceneID = data.scenes[0].sceneID || data.scenes[0].id
                    const tileUrl = `/api/eosda/tiles/10/550/350?sceneID=${sceneID}&layer=ndvi`
                    const tileRes = await fetch(tileUrl, {
                        cache: 'no-store',
                        signal: AbortSignal.timeout(10000),
                    })

                    const contentType = tileRes.headers.get('content-type')
                    const errorHeader = tileRes.headers.get('x-eosda-error')

                    tests.push({
                        test: 'Tile Rendering',
                        status: tileRes.ok && contentType?.includes('image') ? 'success' : 'error',
                        message: tileRes.ok
                            ? `Tiles OK (${contentType})`
                            : `HTTP ${tileRes.status}${errorHeader ? ': ' + errorHeader : ''}`,
                        details: {
                            sceneID,
                            status: tileRes.status,
                            contentType,
                            errorHeader,
                            url: tileUrl
                        }
                    })
                } catch (error) {
                    tests.push({
                        test: 'Tile Rendering',
                        status: 'error',
                        message: 'Tile request failed',
                        details: error instanceof Error ? error.message : String(error)
                    })
                }
            } else {
                tests.push({
                    test: 'Tile Rendering',
                    status: 'warning',
                    message: 'Skipped (no scenes available)',
                    details: 'Need scenes to test tile rendering'
                })
            }
        } catch (error) {
            tests.push({
                test: 'Scene Search',
                status: 'error',
                message: 'Search failed',
                details: error instanceof Error ? error.message : String(error)
            })
        }

        setResults(tests)
        setRunning(false)
    }

    const getIcon = (status: DiagnosticResult['status']) => {
        switch (status) {
            case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />
            case 'error': return <XCircle className="h-5 w-5 text-red-500" />
            case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />
        }
    }

    const getOverallStatus = () => {
        if (results.length === 0) return null
        const hasError = results.some(r => r.status === 'error')
        const hasWarning = results.some(r => r.status === 'warning')
        if (hasError) return { color: 'destructive', text: 'Issues Found', variant: 'destructive' as const }
        if (hasWarning) return { color: 'warning', text: 'Warnings', variant: 'secondary' as const }
        return { color: 'success', text: 'All Systems Operational', variant: 'default' as const }
    }

    const overall = getOverallStatus()

    return (
        <Card className="glass-card border-primary/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        EOSDA Integration Diagnostics
                    </CardTitle>
                    {overall && (
                        <Badge variant={overall.variant}>
                            {overall.text}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button onClick={runDiagnostics} disabled={running} className="gap-2">
                        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                        {running ? 'Running...' : 'Run Diagnostics'}
                    </Button>
                    {results.length > 0 && (
                        <Button
                            onClick={() => setResults([])}
                            variant="outline"
                            size="sm"
                        >
                            Clear
                        </Button>
                    )}
                </div>

                {results.length > 0 && (
                    <div className="space-y-3">
                        {results.map((result, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 p-4 rounded-lg border bg-card/50 backdrop-blur-sm"
                            >
                                <div className="mt-0.5">
                                    {getIcon(result.status)}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium">{result.test}</span>
                                        <Badge
                                            variant={
                                                result.status === 'success' ? 'default' :
                                                    result.status === 'error' ? 'destructive' :
                                                        'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {result.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{result.message}</p>
                                    {result.details && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                                View Details
                                            </summary>
                                            <pre className="text-xs mt-2 p-3 bg-muted/50 rounded-md overflow-auto max-h-40 border">
                                                {JSON.stringify(result.details, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {results.length === 0 && !running && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Click "Run Diagnostics" to test EOSDA integration</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
