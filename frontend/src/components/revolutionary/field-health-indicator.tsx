"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Droplets, 
  Leaf, 
  Thermometer, 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface FieldHealthIndicatorProps {
  field: {
    name: string
    cropType: string
    area: number
    healthScore: number
    satelliteData: {
      ndvi: { value: number; trend: "up" | "down" | "stable"; status: "excellent" | "good" | "moderate" | "poor" }
      chlorophyll: { value: number; status: "high" | "medium" | "low" }
      soilMoisture: { value: number; status: "optimal" | "dry" | "wet" }
      temperature: { value: number; status: "optimal" | "hot" | "cold" }
    }
    alerts: Array<{
      type: "critical" | "warning" | "info"
      title: string
      count: number
    }>
  }
  compact?: boolean
}

const colorSchemes = {
  health: {
    excellent: "bg-gradient-to-r from-green-500 to-emerald-500",
    good: "bg-gradient-to-r from-green-400 to-green-500",
    moderate: "bg-gradient-to-r from-yellow-400 to-orange-400",
    poor: "bg-gradient-to-r from-red-400 to-red-500"
  },
  ndvi: {
    excellent: "bg-green-500",
    good: "bg-green-400",
    moderate: "bg-yellow-400",
    poor: "bg-red-400"
  },
  moisture: {
    optimal: "bg-blue-500",
    dry: "bg-orange-500",
    wet: "bg-purple-500"
  },
  chlorophyll: {
    high: "bg-green-600",
    medium: "bg-yellow-500",
    low: "bg-orange-500"
  }
}

export function FieldHealthIndicator({ field, compact = false }: FieldHealthIndicatorProps) {
  const healthStatus = field.healthScore > 80 ? "excellent" : 
                       field.healthScore > 60 ? "good" : 
                       field.healthScore > 40 ? "moderate" : "poor"

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up": return <TrendingUp className="h-3 w-3 text-green-600" />
      case "down": return <TrendingDown className="h-3 w-3 text-red-600" />
      case "stable": return <Minus className="h-3 w-3 text-gray-600" />
    }
  }

  const getStatusColor = (status: string, type: "health" | "ndvi" | "moisture" | "chlorophyll") => {
    return colorSchemes[type][status as keyof typeof colorSchemes[typeof type]] || "bg-gray-500"
  }

  if (compact) {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{field.name}</h3>
              <p className="text-sm text-gray-600">{field.cropType} • {field.area} feddan</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold text-white px-3 py-1 rounded-lg ${getStatusColor(healthStatus, "health")}`}>
                {field.healthScore.toFixed(0)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Health Score</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">NDVI</span>
                  {getTrendIcon(field.satelliteData.ndvi.trend)}
                </div>
                <div className="text-xs text-gray-600">{field.satelliteData.ndvi.value.toFixed(3)}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(field.satelliteData.ndvi.status, "ndvi")}`} />
            </div>

            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">Moisture</div>
                <div className="text-xs text-gray-600">{field.satelliteData.soilMoisture.value.toFixed(1)}%</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(field.satelliteData.soilMoisture.status, "moisture")}`} />
            </div>
          </div>

          {field.alerts.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {field.alerts.slice(0, 2).map((alert, index) => (
                <Badge 
                  key={index}
                  variant={alert.type === "critical" ? "destructive" : "default"}
                  className="text-xs"
                >
                  {alert.title}
                </Badge>
              ))}
              {field.alerts.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{field.alerts.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-xl">{field.name}</h3>
            <p className="text-gray-600">{field.cropType} • {field.area} feddan</p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold text-white px-4 py-2 rounded-lg ${getStatusColor(healthStatus, "health")}`}>
              {field.healthScore.toFixed(0)}%
            </div>
            <p className="text-sm text-gray-500 mt-1">Overall Health</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* NDVI Indicator */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                <span className="font-medium">NDVI</span>
              </div>
              {getTrendIcon(field.satelliteData.ndvi.trend)}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">{field.satelliteData.ndvi.value.toFixed(3)}</span>
              <Badge variant="outline" className="capitalize">
                {field.satelliteData.ndvi.status}
              </Badge>
            </div>
          </div>

          {/* Chlorophyll Indicator */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <span className="font-medium">Chlorophyll</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">{field.satelliteData.chlorophyll.value.toFixed(3)}</span>
              <Badge variant="outline" className="capitalize">
                {field.satelliteData.chlorophyll.status}
              </Badge>
            </div>
          </div>

          {/* Soil Moisture Indicator */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Soil Moisture</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">{field.satelliteData.soilMoisture.value.toFixed(1)}%</span>
              <Badge variant="outline" className="capitalize">
                {field.satelliteData.soilMoisture.status}
              </Badge>
            </div>
          </div>

          {/* Temperature Indicator */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Temperature</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">{field.satelliteData.temperature.value}°C</span>
              <Badge variant="outline" className="capitalize">
                {field.satelliteData.temperature.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {field.alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </h4>
            <div className="space-y-2">
              {field.alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {alert.type === "critical" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {alert.type === "info" && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    <span className="text-sm font-medium">{alert.title}</span>
                  </div>
                  <Badge variant={alert.type === "critical" ? "destructive" : "default"}>
                    {alert.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bars */}
        <div className="mt-4 space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Vegetation Health</span>
              <span>{(field.satelliteData.ndvi.value * 100).toFixed(0)}%</span>
            </div>
            <Progress value={field.satelliteData.ndvi.value * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Moisture Level</span>
              <span>{field.satelliteData.soilMoisture.value.toFixed(0)}%</span>
            </div>
            <Progress value={field.satelliteData.soilMoisture.value} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Chlorophyll Content</span>
              <span>{(field.satelliteData.chlorophyll.value * 100).toFixed(0)}%</span>
            </div>
            <Progress value={field.satelliteData.chlorophyll.value * 100} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
