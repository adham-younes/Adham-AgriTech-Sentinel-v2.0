"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Eye, 
  Layers, 
  MapPin, 
  Calendar, 
  Download, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  Grid,
  Satellite,
  Sun,
  Cloud,
  Thermometer,
  Droplets,
  Wind
} from "lucide-react"

interface SatelliteVisualizationProps {
  field: {
    id: string
    name: string
    center: { latitude: number; longitude: number }
    area: number
  }
  satelliteData: {
    ndvi: { value: number; trend: "up" | "down" | "stable"; status: "excellent" | "good" | "moderate" | "poor" }
    chlorophyll: { value: number; status: "high" | "medium" | "low" }
    soilMoisture: { value: number; status: "optimal" | "dry" | "wet" }
    temperature: { value: number; status: "optimal" | "hot" | "cold" }
    weather: { humidity: number; pressure: number; forecast: string }
    imageUrl?: string
    capturedAt: string
  }
  onLayerChange?: (layer: string) => void
}

const ndviColorMap = [
  { range: "0.0-0.2", color: "#8B4513", label: "Bare Soil" },
  { range: "0.2-0.4", color: "#FFFF00", label: "Sparse Vegetation" },
  { range: "0.4-0.6", color: "#90EE90", label: "Moderate Vegetation" },
  { range: "0.6-0.8", color: "#228B22", label: "Healthy Vegetation" },
  { range: "0.8-1.0", color: "#006400", label: "Dense Vegetation" }
]

const satelliteLayers = [
  { id: "ndvi", name: "NDVI", icon: <Eye className="h-4 w-4" />, description: "Vegetation health index" },
  { id: "chlorophyll", name: "Chlorophyll", icon: <Sun className="h-4 w-4" />, description: "Chlorophyll content" },
  { id: "moisture", name: "Soil Moisture", icon: <Droplets className="h-4 w-4" />, description: "Soil water content" },
  { id: "thermal", name: "Thermal", icon: <Thermometer className="h-4 w-4" />, description: "Temperature mapping" },
  { id: "rgb", name: "True Color", icon: <Satellite className="h-4 w-4" />, description: "Natural color view" }
]

export function SatelliteVisualization({ field, satelliteData, onLayerChange }: SatelliteVisualizationProps) {
  const [selectedLayer, setSelectedLayer] = useState("ndvi")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showGrid, setShowGrid] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)

  const currentLayer = satelliteLayers.find(layer => layer.id === selectedLayer) || satelliteLayers[0]

  const getLayerValue = () => {
    switch (selectedLayer) {
      case "ndvi": return satelliteData.ndvi.value
      case "chlorophyll": return satelliteData.chlorophyll.value
      case "moisture": return satelliteData.soilMoisture.value
      case "thermal": return satelliteData.temperature.value
      default: return satelliteData.ndvi.value
    }
  }

  const getLayerStatus = () => {
    switch (selectedLayer) {
      case "ndvi": return satelliteData.ndvi.status
      case "chlorophyll": return satelliteData.chlorophyll.status
      case "moisture": return satelliteData.soilMoisture.status
      case "thermal": return satelliteData.temperature.status
      default: return "good"
    }
  }

  const getLayerColor = (value: number) => {
    if (selectedLayer === "ndvi") {
      if (value < 0.2) return "#8B4513"
      if (value < 0.4) return "#FFFF00"
      if (value < 0.6) return "#90EE90"
      if (value < 0.8) return "#228B22"
      return "#006400"
    }
    
    if (selectedLayer === "chlorophyll") {
      if (value < 0.3) return "#FF6B6B"
      if (value < 0.6) return "#FFD93D"
      return "#6BCF7F"
    }
    
    if (selectedLayer === "moisture") {
      if (value < 30) return "#FF6B6B"
      if (value < 70) return "#4ECDC4"
      return "#45B7D1"
    }
    
    if (selectedLayer === "thermal") {
      if (value > 35) return "#FF6B6B"
      if (value > 25) return "#FFD93D"
      return "#6BCF7F"
    }
    
    return "#228B22"
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5))
  }

  const handleReset = () => {
    setZoomLevel(1)
  }

  const handleDownload = () => {
    // Simulated download functionality
    const link = document.createElement('a')
    link.href = satelliteData.imageUrl || '#'
    link.download = `${field.name}_${selectedLayer}_${new Date().toISOString().split('T')[0]}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Main Visualization Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5" />
              Satellite Visualization
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {currentLayer.name}
              </Badge>
              <Badge variant="secondary">
                {field.area} feddan
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Layer Selection */}
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              {satelliteLayers.map((layer) => (
                <Button
                  key={layer.id}
                  variant={selectedLayer === layer.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedLayer(layer.id)
                    onLayerChange?.(layer.id)
                  }}
                  className="flex items-center gap-2"
                >
                  {layer.icon}
                  {layer.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Map Container */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: "400px" }}>
            {/* Simulated Satellite Image */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${getLayerColor(getLayerValue())}22 0%, ${getLayerColor(getLayerValue())}44 100%)`,
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.3s ease"
              }}
            >
              {/* Field Boundary */}
              <div 
                className="border-2 border-dashed border-gray-600 rounded-lg"
                style={{
                  width: "60%",
                  height: "60%",
                  background: `radial-gradient(circle, ${getLayerColor(getLayerValue())}88 0%, ${getLayerColor(getLayerValue())}44 100%)`
                }}
              >
                {/* Grid overlay */}
                {showGrid && (
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border border-gray-400 opacity-30" />
                    ))}
                  </div>
                )}
                
                {/* Center point */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <MapPin className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Overlay Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="sm" variant="secondary" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={handleReset}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowGrid(!showGrid)}>
                <Grid className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Field Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3">
              <div className="text-sm font-medium">{field.name}</div>
              <div className="text-xs text-gray-600">
                {field.center.latitude.toFixed(4)}°N, {field.center.longitude.toFixed(4)}°E
              </div>
            </div>

            {/* Layer Value Display */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3">
              <div className="text-sm font-medium">{currentLayer.name}</div>
              <div className="text-lg font-bold" style={{ color: getLayerColor(getLayerValue()) }}>
                {getLayerValue().toFixed(3)}
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {getLayerStatus()}
              </Badge>
            </div>
          </div>

          {/* Layer Description */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{currentLayer.name}:</strong> {currentLayer.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Color Legend */}
      {selectedLayer === "ndvi" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              NDVI Color Legend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ndviColorMap.map((item) => (
                <div key={item.range} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-sm text-gray-600">{item.range}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Satellite Data Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Acquisition Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Capture Date</span>
              <span className="font-medium">
                {new Date(satelliteData.capturedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Satellite</span>
              <span className="font-medium">Sentinel-2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resolution</span>
              <span className="font-medium">10m/pixel</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cloud Cover</span>
              <span className="font-medium">5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Weather Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600">Temperature</span>
              </div>
              <span className="font-medium">{satelliteData.temperature.value}°C</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">Humidity</span>
              </div>
              <span className="font-medium">{satelliteData.weather.humidity}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Pressure</span>
              </div>
              <span className="font-medium">{satelliteData.weather.pressure} hPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Forecast</span>
              <span className="font-medium">{satelliteData.weather.forecast}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Layer Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Multi-Layer Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {satelliteLayers.slice(0, 4).map((layer) => (
              <div key={layer.id} className="text-center">
                <div 
                  className="w-full h-20 rounded-lg mb-2 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${getLayerColor(getLayerValue())}44 0%, ${getLayerColor(getLayerValue())}88 100%)`
                  }}
                >
                  {layer.icon}
                </div>
                <div className="text-sm font-medium">{layer.name}</div>
                <div className="text-xs text-gray-600 capitalize">{getLayerStatus()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
