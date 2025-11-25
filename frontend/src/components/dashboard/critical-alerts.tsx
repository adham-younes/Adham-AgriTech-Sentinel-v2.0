"use client"

import { AlertTriangle, AlertCircle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Alert {
    id: string
    type: "low_moisture" | "high_temp" | "low_ndvi" | "nutrient_deficiency"
    severity: "warning" | "critical"
    message: string
    fieldName?: string
    value?: number
}

interface CriticalAlertsProps {
    alerts: Alert[]
    onViewDetails?: (alertId: string) => void
}

const alertConfig = {
    low_moisture: {
        icon: AlertTriangle,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20"
    },
    high_temp: {
        icon: AlertCircle,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20"
    },
    low_ndvi: {
        icon: AlertTriangle,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20"
    },
    nutrient_deficiency: {
        icon: AlertCircle,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20"
    }
}

export function CriticalAlerts({ alerts, onViewDetails }: CriticalAlertsProps) {
    if (alerts.length === 0) {
        return null
    }

    return (
        <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Critical Alerts
            </h3>
            <div className="space-y-2">
                {alerts.map((alert) => {
                    const config = alertConfig[alert.type]
                    const Icon = config.icon

                    return (
                        <div
                            key={alert.id}
                            className={cn(
                                "flex items-center justify-between gap-3 rounded-lg border p-3 transition-all hover:scale-[1.02]",
                                config.bgColor,
                                config.borderColor
                            )}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <Icon className={cn("h-4 w-4 flex-shrink-0", config.color)} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                                    {alert.fieldName && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Field: {alert.fieldName}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-primary/20 hover:bg-primary/10 flex-shrink-0"
                                onClick={() => onViewDetails?.(alert.id)}
                            >
                                <Eye className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">View Details</span>
                            </Button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
