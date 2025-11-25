"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

interface AdvancedIndexMapProps {
  index: "ndvi" | "chlorophyll" | "moisture" | "evi" | "nri" | "dswi" | "ndwi"
  value?: number | null
  mapUrl?: string | null
  timestamp?: string | null
  width?: number
  height?: number
  showLegend?: boolean
  showStats?: boolean
  lang?: "ar" | "en"
}

export function AdvancedIndexMap({
  index,
  value,
  mapUrl,
  timestamp,
  width = 400,
  height = 300,
  showLegend = true,
  showStats = true,
  lang = "ar"
}: AdvancedIndexMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const indexConfig = {
    ndvi: {
      name: lang === "ar" ? "مؤشر NDVI" : "NDVI Index",
      unit: "",
      min: -1,
      max: 1,
      colors: ["#8B4513", "#D2691E", "#FFD700", "#9ACD32", "#228B22", "#006400"],
      thresholds: [0.2, 0.4, 0.6, 0.8],
      labels: lang === "ar" ? ["ضعيف جداً", "ضعيف", "متوسط", "جيد", "ممتاز", "ممتاز جداً"] : ["Very Poor", "Poor", "Fair", "Good", "Excellent", "Very Excellent"]
    },
    chlorophyll: {
      name: lang === "ar" ? "الكلوروفيل" : "Chlorophyll",
      unit: "μg/cm²",
      min: 0,
      max: 100,
      colors: ["#FFE4B5", "#FFA500", "#FF8C00", "#FF6347", "#FF4500", "#8B0000"],
      thresholds: [20, 35, 50, 65, 80],
      labels: lang === "ar" ? ["منخفض جداً", "منخفض", "متوسط", "مرتفع", "عالي جداً", "استثنائي"] : ["Very Low", "Low", "Medium", "High", "Very High", "Exceptional"]
    },
    moisture: {
      name: lang === "ar" ? "رطوبة التربة" : "Soil Moisture",
      unit: "%",
      min: 0,
      max: 100,
      colors: ["#8B4513", "#D2691E", "#DEB887", "#87CEEB", "#4682B4", "#191970"],
      thresholds: [15, 30, 45, 60, 75],
      labels: lang === "ar" ? ["جافة جداً", "جافة", "طبيعية", "رطبة", "رطبة جداً", "مشبعة"] : ["Very Dry", "Dry", "Normal", "Moist", "Very Moist", "Saturated"]
    },
    evi: {
      name: lang === "ar" ? "مؤشر EVI" : "EVI Index",
      unit: "",
      min: -1,
      max: 1,
      colors: ["#8B4513", "#CD853F", "#F4A460", "#90EE90", "#32CD32", "#006400"],
      thresholds: [0.1, 0.3, 0.5, 0.7, 0.9],
      labels: lang === "ar" ? ["ضعيف جداً", "ضعيف", "متوسط", "جيد", "ممتاز", "ممتاز جداً"] : ["Very Poor", "Poor", "Fair", "Good", "Excellent", "Very Excellent"]
    },
    nri: {
      name: lang === "ar" ? "مؤشر NRI" : "NRI Index",
      unit: "",
      min: 0,
      max: 1,
      colors: ["#FF6347", "#FFA500", "#FFD700", "#ADFF2F", "#00FF00", "#008000"],
      thresholds: [0.2, 0.4, 0.6, 0.8],
      labels: lang === "ar" ? ["إجهاد شديد", "إجهاد متوسط", "إجهاد خفيف", "طبيعي", "صحي", "مزدهر"] : ["Severe Stress", "Moderate Stress", "Light Stress", "Normal", "Healthy", "Thriving"]
    },
    dswi: {
      name: lang === "ar" ? "مؤشر DSWI" : "DSWI Index",
      unit: "",
      min: 0,
      max: 2,
      colors: ["#8B0000", "#FF0000", "#FF4500", "#FFA500", "#FFD700", "#ADFF2F"],
      thresholds: [0.4, 0.8, 1.2, 1.6],
      labels: lang === "ar" ? ["جافة جداً", "جافة", "طبيعية", "رطبة", "رطبة جداً", "مشبعة"] : ["Very Dry", "Dry", "Normal", "Moist", "Very Moist", "Saturated"]
    },
    ndwi: {
      name: lang === "ar" ? "مؤشر NDWI" : "NDWI Index",
      unit: "",
      min: -1,
      max: 1,
      colors: ["#8B4513", "#D2691E", "#DEB887", "#87CEEB", "#4682B4", "#191970"],
      thresholds: [-0.5, -0.2, 0.1, 0.4, 0.7],
      labels: lang === "ar" ? ["جافة جداً", "جافة", "طبيعية", "رطبة", "رطبة جداً", "مائية"] : ["Very Dry", "Dry", "Normal", "Moist", "Very Moist", "Water"]
    }
  }

  const config = indexConfig[index]

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Fill background with gradient (Dark Theme)
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    config.colors.forEach((color, i) => {
      gradient.addColorStop(i / (config.colors.length - 1), color)
    })
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Add value indicator if value is provided
    if (value !== null && value !== undefined) {
      const normalizedValue = (value - config.min) / (config.max - config.min)
      const indicatorX = normalizedValue * width

      // Draw vertical line for current value
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(indicatorX, 0)
      ctx.lineTo(indicatorX, height)
      ctx.stroke()

      // Draw value text
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 16px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`${value.toFixed(2)}${config.unit}`, indicatorX, height / 2)

      // Draw threshold lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
      ctx.lineWidth = 1
      config.thresholds.forEach(threshold => {
        const x = ((threshold - config.min) / (config.max - config.min)) * width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      })
    }

    // Add grid pattern
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

  }, [index, value, width, height, config])

  const getStatusColor = (val: number | null) => {
    if (val === null) return "text-gray-500"
    const normalized = (val - config.min) / (config.max - config.min)
    if (normalized < 0.2) return "text-red-600"
    if (normalized < 0.4) return "text-orange-600"
    if (normalized < 0.6) return "text-yellow-600"
    if (normalized < 0.8) return "text-green-600"
    return "text-emerald-600"
  }

  const getStatusText = (val: number | null) => {
    if (val === null) return lang === "ar" ? "غير متاح" : "N/A"
    const normalized = (val - config.min) / (config.max - config.min)
    const index = Math.floor(normalized * (config.labels.length - 1))
    return config.labels[Math.max(0, Math.min(index, config.labels.length - 1))]
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-gray-900 to-black border-gray-800">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">{config.name}</h3>
          {timestamp && (
            <span className="text-xs text-gray-500">
              {new Date(timestamp).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
            </span>
          )}
        </div>

        {/* Map Display */}
        <div className="relative rounded-lg overflow-hidden border border-gray-700">
          {mapUrl ? (
            <img
              src={mapUrl}
              alt={`${config.name} Map`}
              className="w-full h-auto"
              style={{ maxWidth: width, maxHeight: height }}
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full h-auto"
            />
          )}
        </div>

        {/* Stats and Legend */}
        {showStats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-500 mb-1">
                {lang === "ar" ? "القيمة الحالية" : "Current Value"}
              </div>
              <div className={`text-xl font-bold ${getStatusColor(value ?? null)}`}>
                {value !== null && value !== undefined ? `${value.toFixed(2)}${config.unit}` : "--"}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {getStatusText(value ?? null)}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-500 mb-1">
                {lang === "ar" ? "الحالة" : "Status"}
              </div>
              <div className={`text-sm font-medium ${getStatusColor(value ?? null)}`}>
                {getStatusText(value ?? null)}
              </div>
            </div>
          </div>
        )}

        {/* Color Legend */}
        {showLegend && (
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-500 mb-2">
              {lang === "ar" ? "مفتاح الألوان" : "Color Legend"}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-4 rounded" style={{
                background: `linear-gradient(to right, ${config.colors.join(", ")})`
              }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-600">{config.min}{config.unit}</span>
              <span className="text-xs text-gray-600">{config.max}{config.unit}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
