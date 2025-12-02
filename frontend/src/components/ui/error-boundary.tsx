'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
    children?: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
                    <Card className="w-full max-w-md border-destructive/20 bg-destructive/5 p-8 shadow-lg backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-destructive">
                                    Something went wrong
                                    <span className="block text-lg font-medium opacity-80 mt-1">حدث خطأ غير متوقع</span>
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {this.state.error?.message || 'An unexpected error occurred while loading this section.'}
                                </p>
                            </div>

                            <div className="flex w-full gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => this.setState({ hasError: false, error: null })}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Try Again / إعادة المحاولة
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="gap-2"
                                    asChild
                                >
                                    <Link href="/dashboard">
                                        <Home className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}
