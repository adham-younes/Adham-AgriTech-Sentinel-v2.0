"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Bell, 
  BellRing, 
  Clock, 
  MapPin, 
  Droplets, 
  Thermometer, 
  Wind, 
  Shield, 
  Zap, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Settings,
  Eye,
  EyeOff,
  Volume2,
  VolumeX
} from "lucide-react"

interface SmartAlert {
  id: string
  type: "critical" | "warning" | "info" | "success"
  category: "disease" | "irrigation" | "weather" | "growth" | "harvest" | "maintenance"
  title: string
  description: string
  field?: string
  severity: number // 1-10 scale
  urgency: "immediate" | "today" | "this_week" | "monitor"
  confidence: number // 0-100%
  timestamp: string
  acknowledged: boolean
  actions: Array<{
    label: string
    type: "primary" | "secondary"
    action: string
  }>
  metadata?: {
    value?: number
    unit?: string
    threshold?: number
    trend?: "up" | "down" | "stable"
  }
}

interface SmartAlertsSystemProps {
  alerts: SmartAlert[]
  onAlertAction?: (alertId: string, action: string) => void
  onAlertAcknowledge?: (alertId: string) => void
  onSettingsClick?: () => void
}

const alertCategories = [
  { id: "all", name: "All Alerts", icon: <Bell className="h-4 w-4" /> },
  { id: "disease", name: "Disease", icon: <Shield className="h-4 w-4" />, color: "red" },
  { id: "irrigation", name: "Irrigation", icon: <Droplets className="h-4 w-4" />, color: "blue" },
  { id: "weather", name: "Weather", icon: <Wind className="h-4 w-4" />, color: "purple" },
  { id: "growth", name: "Growth", icon: <TrendingUp className="h-4 w-4" />, color: "green" },
  { id: "harvest", name: "Harvest", icon: <Calendar className="h-4 w-4" />, color: "orange" },
  { id: "maintenance", name: "Equipment", icon: <Settings className="h-4 w-4" />, color: "gray" }
]

export function SmartAlertsSystem({ 
  alerts, 
  onAlertAction, 
  onAlertAcknowledge, 
  onSettingsClick 
}: SmartAlertsSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAcknowledged, setShowAcknowledged] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)

  const filteredAlerts = alerts.filter(alert => {
    const categoryMatch = selectedCategory === "all" || alert.category === selectedCategory
    const acknowledgedMatch = showAcknowledged || !alert.acknowledged
    return categoryMatch && acknowledgedMatch
  })

  const criticalAlerts = alerts.filter(alert => alert.type === "critical" && !alert.acknowledged)
  const warningAlerts = alerts.filter(alert => alert.type === "warning" && !alert.acknowledged)
  const unreadCount = alerts.filter(alert => !alert.acknowledged).length

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "info": return <Info className="h-5 w-5 text-blue-600" />
      case "success": return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "immediate": return "destructive"
      case "today": return "default"
      case "this_week": return "secondary"
      case "monitor": return "outline"
      default: return "outline"
    }
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "bg-red-500"
    if (severity >= 6) return "bg-orange-500"
    if (severity >= 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const handleAlertAction = (alertId: string, action: string) => {
    onAlertAction?.(alertId, action)
  }

  const handleAcknowledge = (alertId: string) => {
    onAlertAcknowledge?.(alertId)
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Smart Alerts System
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={onSettingsClick}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{criticalAlerts.length}</div>
              <p className="text-sm text-blue-100">Critical Alerts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{warningAlerts.length}</div>
              <p className="text-sm text-blue-100">Warnings</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-sm text-blue-100">Unread</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-sm text-blue-100">Total Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Immediate attention required:</strong> {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} need your action.
          </AlertDescription>
        </Alert>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-7">
            {alertCategories.map((category) => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                onClick={setSelectedCategory}
                className="flex items-center gap-1"
              >
                {category.icon}
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAcknowledged(!showAcknowledged)}
            >
              {showAcknowledged ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAcknowledged ? "Hide" : "Show"} Acknowledged
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Clock className="h-4 w-4" />
              Auto-refresh: {autoRefresh ? "On" : "Off"}
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Alerts List */}
        <TabsContent value={selectedCategory} className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No alerts in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`transition-all duration-200 ${
                    selectedAlert === alert.id ? 'ring-2 ring-blue-500' : ''
                  } ${alert.acknowledged ? 'opacity-60' : ''}`}
                  onClick={() => setSelectedAlert(alert.id === selectedAlert ? null : alert.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{alert.title}</h4>
                            <Badge variant={getUrgencyColor(alert.urgency)} className="text-xs">
                              {alert.urgency.replace('_', ' ')}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge variant="outline" className="text-xs">
                                Acknowledged
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{alert.description}</p>
                          
                          {alert.field && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                              <MapPin className="h-3 w-3" />
                              {alert.field}
                            </div>
                          )}

                          {/* Metadata */}
                          {alert.metadata && (
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                              {alert.metadata.value !== undefined && (
                                <span>
                                  {alert.metadata.value} {alert.metadata.unit}
                                </span>
                              )}
                              {alert.metadata.threshold && (
                                <span>Threshold: {alert.metadata.threshold}</span>
                              )}
                              {alert.metadata.trend && (
                                <span className="flex items-center gap-1">
                                  {alert.metadata.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                                  {alert.metadata.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                                  {alert.metadata.trend === 'stable' && <span className="w-3 h-3 bg-gray-400 rounded-full" />}
                                  {alert.metadata.trend}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Confidence and Severity */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Confidence:</span>
                              <div className="flex items-center gap-1">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${alert.confidence}%` }}
                                  />
                                </div>
                                <span className="text-xs">{alert.confidence}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Severity:</span>
                              <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                              <span className="text-xs">{alert.severity}/10</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(alert.timestamp)}
                            </div>
                          </div>

                          {/* Actions */}
                          {alert.actions.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {alert.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant={action.type === "primary" ? "default" : "outline"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAlertAction(alert.id, action.action)
                                  }}
                                >
                                  {action.label}
                                </Button>
                              ))}
                              {!alert.acknowledged && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAcknowledge(alert.id)
                                  }}
                                >
                                  Acknowledge
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Alert Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Alert Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">By Type</p>
              <div className="space-y-2">
                {["critical", "warning", "info", "success"].map((type) => {
                  const count = alerts.filter(a => a.type === type).length
                  return (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">By Category</p>
              <div className="space-y-2">
                {alertCategories.slice(1).map((category) => {
                  const count = alerts.filter(a => a.category === category.id).length
                  return (
                    <div key={category.id} className="flex justify-between text-sm">
                      <span>{category.name}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">By Urgency</p>
              <div className="space-y-2">
                {["immediate", "today", "this_week", "monitor"].map((urgency) => {
                  const count = alerts.filter(a => a.urgency === urgency).length
                  return (
                    <div key={urgency} className="flex justify-between text-sm">
                      <span className="capitalize">{urgency.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
