"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Sun, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Leaf,
  MapPin,
  Calendar,
  TrendingUp
} from "lucide-react"

interface SoilHealthMatrixProps {
  fieldId?: string
  fieldName?: string
  lang?: "ar" | "en"
  data?: {
    nitrogen: number
    phosphorus: number
    potassium: number
    ph: number
    moisture: number
    organicMatter: number
    temperature: number
    conductivity: number
  }
  lastUpdated?: string
}

interface MetricCardProps {
  title: { ar: string; en: string }
  value: number
  unit: string
  optimal: { min: number; max: number }
  icon: React.ElementType
  color: string
  lang: "ar" | "en"
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, optimal, icon: Icon, color, lang }) => {
  const getStatus = (val: number) => {
    if (val >= optimal.min && val <= optimal.max) {
      return { 
        status: lang === "ar" ? "مثالي" : "Optimal", 
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        progress: 100
      }
    } else if (val < optimal.min * 0.7 || val > optimal.max * 1.3) {
      return { 
        status: lang === "ar" ? "حرج" : "Critical", 
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        progress: 25
      }
    } else {
      return { 
        status: lang === "ar" ? "تحت المعدل" : "Suboptimal", 
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        progress: 60
      }
    }
  }

  const status = getStatus(value)
  const progressColor = status.progress === 100 ? "bg-emerald-500" : status.progress === 25 ? "bg-red-500" : "bg-yellow-500"

  return (
    <div className={`relative bg-black/40 border rounded-lg p-4 ${status.color} backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{title[lang]}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {status.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold">{value}</span>
          <span className="text-xs text-white/70">{unit}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/70">
            <span>{lang === "ar" ? "مثالي:" : "Optimal:"}</span>
            <span>{optimal.min}-{optimal.max}</span>
          </div>
          <Progress value={status.progress} className="h-1" />
        </div>
      </div>
    </div>
  )
}

const RadarChart: React.FC<{ data: Record<string, number>; color: string }> = ({ data, color }) => {
  const metrics = Object.keys(data)
  const values = Object.values(data)
  
  // Calculate SVG points for radar chart
  const angleStep = (2 * Math.PI) / metrics.length
  const radius = 40
  const centerX = 50
  const centerY = 50
  
  const points = values.map((value, index) => {
    const angle = index * angleStep - Math.PI / 2
    const normalizedValue = value / 100 // Normalize to 0-1
    const x = centerX + radius * normalizedValue * Math.cos(angle)
    const y = centerY + radius * normalizedValue * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius * scale}
            fill="none"
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Grid lines */}
        {metrics.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2
          const x = centerX + radius * Math.cos(angle)
          const y = centerY + radius * Math.sin(angle)
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="rgba(16, 185, 129, 0.2)"
              strokeWidth="0.5"
            />
          )
        })}
        
        {/* Data polygon */}
        <polygon
          points={points}
          fill={color}
          fillOpacity="0.3"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}

export function SoilHealthMatrix({ 
  fieldId, 
  fieldName, 
  lang = "ar", 
  data,
  lastUpdated 
}: SoilHealthMatrixProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [soilData, setSoilData] = useState(data || {
    nitrogen: 45,
    phosphorus: 32,
    potassium: 78,
    ph: 6.8,
    moisture: 65,
    organicMatter: 3.2,
    temperature: 22,
    conductivity: 1.2
  })

  // Simulate real-time data updates
  useEffect(() => {
    if (!data) {
      const interval = setInterval(() => {
        setSoilData(prev => ({
          nitrogen: Math.max(0, Math.min(100, prev.nitrogen + (Math.random() - 0.5) * 5)),
          phosphorus: Math.max(0, Math.min(100, prev.phosphorus + (Math.random() - 0.5) * 3)),
          potassium: Math.max(0, Math.min(100, prev.potassium + (Math.random() - 0.5) * 4)),
          ph: Math.max(0, Math.min(14, prev.ph + (Math.random() - 0.5) * 0.2)),
          moisture: Math.max(0, Math.min(100, prev.moisture + (Math.random() - 0.5) * 8)),
          organicMatter: Math.max(0, Math.min(10, prev.organicMatter + (Math.random() - 0.5) * 0.5)),
          temperature: Math.max(0, Math.min(50, prev.temperature + (Math.random() - 0.5) * 2)),
          conductivity: Math.max(0, Math.min(5, prev.conductivity + (Math.random() - 0.5) * 0.3))
        }))
        setIsLoading(false)
      }, 5000)

      return () => clearInterval(interval)
    } else {
      setSoilData(data)
      setIsLoading(false)
    }
  }, [data])

  const metrics = useMemo(() => [
    {
      key: "nitrogen",
      title: { ar: "النيتروجين", en: "Nitrogen" },
      value: soilData.nitrogen,
      unit: "mg/kg",
      optimal: { min: 40, max: 80 },
      icon: Leaf,
      color: "#10b981"
    },
    {
      key: "phosphorus",
      title: { ar: "الفوسفور", en: "Phosphorus" },
      value: soilData.phosphorus,
      unit: "mg/kg",
      optimal: { min: 20, max: 60 },
      icon: Activity,
      color: "#10b981"
    },
    {
      key: "potassium",
      title: { ar: "البوتاسيوم", en: "Potassium" },
      value: soilData.potassium,
      unit: "mg/kg",
      optimal: { min: 60, max: 120 },
      icon: TrendingUp,
      color: "#10b981"
    },
    {
      key: "ph",
      title: { ar: "درجة الحموضة", en: "pH Level" },
      value: soilData.ph,
      unit: "pH",
      optimal: { min: 6.0, max: 7.5 },
      icon: Activity,
      color: "#10b981"
    },
    {
      key: "moisture",
      title: { ar: "الرطوبة", en: "Moisture" },
      value: soilData.moisture,
      unit: "%",
      optimal: { min: 50, max: 80 },
      icon: Droplets,
      color: "#10b981"
    },
    {
      key: "organicMatter",
      title: { ar: "المادة العضوية", en: "Organic Matter" },
      value: soilData.organicMatter,
      unit: "%",
      optimal: { min: 2.5, max: 5.0 },
      icon: Leaf,
      color: "#10b981"
    },
    {
      key: "temperature",
      title: { ar: "درجة الحرارة", en: "Temperature" },
      value: soilData.temperature,
      unit: "°C",
      optimal: { min: 18, max: 28 },
      icon: Thermometer,
      color: "#10b981"
    },
    {
      key: "conductivity",
      title: { ar: "التوصيل الكهربائي", en: "Conductivity" },
      value: soilData.conductivity,
      unit: "dS/m",
      optimal: { min: 0.5, max: 2.0 },
      icon: Activity,
      color: "#10b981"
    }
  ], [soilData])

  const radarData = useMemo(() => ({
    nitrogen: (soilData.nitrogen / 100) * 100,
    phosphorus: (soilData.phosphorus / 100) * 100,
    potassium: (soilData.potassium / 120) * 100,
    ph: ((soilData.ph - 4) / 10) * 100,
    moisture: soilData.moisture,
    organicMatter: (soilData.organicMatter / 5) * 100,
    temperature: ((soilData.temperature - 10) / 40) * 100,
    conductivity: (soilData.conductivity / 2) * 100
  }), [soilData])

  const overallHealth = useMemo(() => {
    const scores = metrics.map(metric => {
      const { min, max } = metric.optimal
      const value = metric.value
      if (value >= min && value <= max) return 100
      if (value < min * 0.7 || value > max * 1.3) return 25
      return 60
    })
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [metrics])

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { 
      status: lang === "ar" ? "ممتاز" : "Excellent", 
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      icon: CheckCircle
    }
    if (score >= 60) return { 
      status: lang === "ar" ? "جيد" : "Good", 
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: Activity
    }
    return { 
      status: lang === "ar" ? "يحتاج عناية" : "Needs Attention", 
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: AlertTriangle
    }
  }

  const healthStatus = getHealthStatus(overallHealth)
  const HealthIcon = healthStatus.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-emerald-400">
              {lang === "ar" ? "مصفوفة صحة التربة" : "Soil Health Matrix"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-white/70" />
              <span className="text-sm text-white/70">{fieldName || (lang === "ar" ? "الحقل المحدد" : "Selected Field")}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <HealthIcon className="w-4 h-4" />
                <span className={`text-sm font-medium px-2 py-1 rounded-full border ${healthStatus.color}`}>
                  {healthStatus.status}
                </span>
              </div>
              <div className="text-xs text-white/70 mt-1">
                {overallHealth}% {lang === "ar" ? "صحة" : "health"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-6 backdrop-blur-sm">
        <h4 className="text-sm font-medium text-emerald-400 mb-4">
          {lang === "ar" ? "نظرة شاملة" : "Overall Overview"}
        </h4>
        <div className="flex items-center justify-center">
          <RadarChart data={radarData} color="#10b981" />
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
          {Object.entries(radarData).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mx-auto mb-1" />
              <div className="text-white/70">
                {key === 'nitrogen' && (lang === "ar" ? "N" : "N")}
                {key === 'phosphorus' && (lang === "ar" ? "P" : "P")}
                {key === 'potassium' && (lang === "ar" ? "K" : "K")}
                {key === 'ph' && "pH"}
                {key === 'moisture' && (lang === "ar" ? "رطوبة" : "Moist")}
                {key === 'organicMatter' && (lang === "ar" ? "عضوي" : "Organic")}
                {key === 'temperature' && (lang === "ar" ? "حرارة" : "Temp")}
                {key === 'conductivity' && (lang === "ar" ? "توصيل" : "Cond")}
              </div>
              <div className="text-emerald-400 font-medium">
                {Math.round(value)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            title={metric.title}
            value={metric.value}
            unit={metric.unit}
            optimal={metric.optimal}
            icon={metric.icon}
            color={metric.color}
            lang={lang}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-white/70" />
            <span className="text-xs text-white/70">
              {lang === "ar" ? "آخر تحديث:" : "Last updated:"}
            </span>
            <span className="text-xs text-emerald-400">
              {lastUpdated || new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
            </span>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            {lang === "ar" ? "تحليل متقدم" : "Advanced Analysis"}
          </Button>
        </div>
      </div>
    </div>
  )
}
