'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
                <div className="flex items-center justify-center min-h-[400px] w-full p-6">
                    <Card className="max-w-md w-full p-6 bg-destructive/5 border-destructive/20">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-destructive">
                                    حدث خطأ غير متوقع
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {this.state.error?.message || 'نعتذر، حدث خطأ أثناء تحميل هذا القسم.'}
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw className="h-4 w-4" />
                                إعادة تحميل الصفحة
                            </Button>
                        </div>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}
