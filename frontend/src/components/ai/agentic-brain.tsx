"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Droplets,
  Thermometer,
  Leaf,
  Calendar,
  MapPin,
  Activity,
  Database,
  Zap
} from "lucide-react"

interface AIInsight {
  id: string
  type: "recommendation" | "alert" | "prediction" | "analysis"
  title: { ar: string; en: string }
  description: { ar: string; en: string }
  confidence: number
  priority: "low" | "medium" | "high"
  timestamp: string
  fieldId?: string
  fieldName?: string
  data?: Record<string, any>
  actionable: boolean
}

interface AgenticBrainProps {
  fieldId?: string
  fieldName?: string
  lang?: "ar" | "en"
  onDataUpdate?: (insights: AIInsight[]) => void
}

const generateInsights = (fieldId?: string, fieldName?: string, lang = "ar"): AIInsight[] => {
  const insights: AIInsight[] = []
  const now = new Date()

  // NDVI-based insights
  insights.push({
    id: `ndvi-${Date.now()}`,
    type: "analysis",
    title: {
      ar: "تحليل صحة المحصول",
      en: "Crop Health Analysis"
    },
    description: {
      ar: "بناءً على بيانات NDVI الحالية، تظهر مناطق الحقل صحة متوسطة مع بعض البقع التي تحتاج إلى اهتمام. يُنصح بإجراء فحص ميداني للمناطق ذات النمو المنخفض.",
      en: "Based on current NDVI data, the field shows moderate health with some areas needing attention. Field inspection recommended for low-growth zones."
    },
    confidence: 0.87,
    priority: "medium",
    timestamp: now.toISOString(),
    fieldId,
    fieldName,
    data: { ndvi: 0.45, trend: "stable" },
    actionable: true
  })

  // Soil moisture insight
  insights.push({
    id: `moisture-${Date.now()}`,
    type: "recommendation",
    title: {
      ar: "توصيات الري",
      en: "Irrigation Recommendations"
    },
    description: {
      ar: "رطوبة التربة الحالية عند 65%، مما يعتبر مثلياً للمحصول الحالي. يُنصح بالحفاظ على جدول الري الحالي مع مراقبة الطقس للأسبوع القادم.",
      en: "Current soil moisture at 65% is optimal for the current crop. Maintain current irrigation schedule while monitoring next week's weather."
    },
    confidence: 0.92,
    priority: "low",
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    fieldId,
    fieldName,
    data: { moisture: 65, optimal_range: [60, 80] },
    actionable: true
  })

  // Temperature alert
  insights.push({
    id: `temp-${Date.now()}`,
    type: "alert",
    title: {
      ar: "تنبيه حراري",
      en: "Temperature Alert"
    },
    description: {
      ar: "متوقع ارتفاع درجات الحرارة فوق 35°C خلال الأيام الثلاثة القادمة. يُنصح بزيادة الري بنسبة 20% وتوفير ظل إضافي للمحاصيل الحساسة.",
      en: "Temperatures expected to exceed 35°C in the next 3 days. Increase irrigation by 20% and provide additional shade for sensitive crops."
    },
    confidence: 0.78,
    priority: "high",
    timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    fieldId,
    fieldName,
    data: { forecast_max: 37, days: 3 },
    actionable: true
  })

  // Nutrient analysis
  insights.push({
    id: `nutrients-${Date.now()}`,
    type: "analysis",
    title: {
      ar: "تحليل العناصر الغذائية",
      en: "Nutrient Analysis"
    },
    description: {
      ar: "تحليل التربة يظهر نقصاً طفيفاً في النيتروجين (45 mg/kg) مع مستويات كافية من الفوسفور والبوتاسيوم. يُنصح بإضافة سماد نيتروجيني خلال الأسبوعين القادمين.",
      en: "Soil analysis shows slight nitrogen deficiency (45 mg/kg) with adequate phosphorus and potassium levels. Apply nitrogen fertilizer within the next 2 weeks."
    },
    confidence: 0.83,
    priority: "medium",
    timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    fieldId,
    fieldName,
    data: { nitrogen: 45, phosphorus: 68, potassium: 75 },
    actionable: true
  })

  // Yield prediction
  insights.push({
    id: `yield-${Date.now()}`,
    type: "prediction",
    title: {
      ar: "توقعات المحصول",
      en: "Yield Prediction"
    },
    description: {
      ar: "بناءً على البيانات الحالية والظروف الجوية، يُتوقع محصول يتراوح بين 4.2-4.8 طن/هكتار، وهو أعلى بـ 12% من متوسط الموسم الماضي.",
      en: "Based on current data and weather conditions, projected yield is 4.2-4.8 tons/hectare, 12% higher than last season's average."
    },
    confidence: 0.74,
    priority: "low",
    timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    fieldId,
    fieldName,
    data: { yield_min: 4.2, yield_max: 4.8, improvement: 12 },
    actionable: false
  })

  return insights.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const InsightCard: React.FC<{ insight: AIInsight; lang: "ar" | "en" }> = ({ insight, lang }) => {
  const getTypeIcon = () => {
    switch (insight.type) {
      case "recommendation":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "prediction":
        return <TrendingUp className="w-4 h-4 text-blue-400" />
      case "analysis":
        return <Brain className="w-4 h-4 text-purple-400" />
    }
  }

  const getPriorityColor = () => {
    switch (insight.priority) {
      case "high":
        return "border-red-400/30 bg-red-500/10"
      case "medium":
        return "border-yellow-400/30 bg-yellow-500/10"
      case "low":
        return "border-emerald-400/30 bg-emerald-500/10"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-emerald-400"
    if (confidence >= 0.6) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className={`bg-black/40 border rounded-lg p-4 backdrop-blur-sm ${getPriorityColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="text-sm font-medium text-emerald-400">
            {insight.title[lang]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {insight.type}
          </Badge>
          <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
            {Math.round(insight.confidence * 100)}%
          </span>
        </div>
      </div>

      <p className="text-sm text-white/80 mb-3 leading-relaxed">
        {insight.description[lang]}
      </p>

      {insight.data && (
        <div className="bg-black/60 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(insight.data).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-white/70 capitalize">{key}:</span>
                <span className="text-emerald-400 font-medium">
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Calendar className="w-3 h-3" />
          <span>{new Date(insight.timestamp).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</span>
        </div>
        
        {insight.actionable && (
          <Button size="sm" variant="outline" className="text-xs h-7">
            {lang === "ar" ? "اتخذ إجراء" : "Take Action"}
          </Button>
        )}
      </div>
    </div>
  )
}

export function AgenticBrain({ fieldId, fieldName, lang = "ar", onDataUpdate }: AgenticBrainProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [contextData, setContextData] = useState<Record<string, any>>({})
  const intervalRef = useRef<NodeJS.Timeout>()

  // Initialize insights
  useEffect(() => {
    const initialInsights = generateInsights(fieldId, fieldName, lang)
    setInsights(initialInsights)
    onDataUpdate?.(initialInsights)
  }, [fieldId, fieldName, lang])

  // Simulate real-time insight generation
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const newInsight = generateInsights(fieldId, fieldName, lang)[0]
      setInsights(prev => {
        const updated = [newInsight, ...prev.slice(0, 9)] // Keep max 10 insights
        onDataUpdate?.(updated)
        return updated
      })
    }, 30000) // Generate new insight every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fieldId, fieldName, lang, onDataUpdate])

  // Simulate context data updates
  useEffect(() => {
    const updateContextData = () => {
      setContextData({
        ndvi: 0.45 + Math.random() * 0.1,
        moisture: 65 + Math.random() * 10,
        temperature: 22 + Math.random() * 8,
        soil_ph: 6.8 + Math.random() * 0.4,
        nitrogen: 45 + Math.random() * 10,
        phosphorus: 68 + Math.random() * 8,
        potassium: 75 + Math.random() * 12,
        lastUpdate: new Date().toISOString()
      })
    }

    updateContextData()
    const contextInterval = setInterval(updateContextData, 10000)

    return () => clearInterval(contextInterval)
  }, [])

  const generateNewInsight = async () => {
    setIsGenerating(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newInsight = generateInsights(fieldId, fieldName, lang)[0]
    setInsights(prev => {
      const updated = [newInsight, ...prev]
      onDataUpdate?.(updated)
      return updated
    })
    
    setIsGenerating(false)
  }

  const stats = useMemo(() => {
    const total = insights.length
    const byType = insights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const byPriority = insights.reduce((acc, insight) => {
      acc[insight.priority] = (acc[insight.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const avgConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / total

    return { total, byType, byPriority, avgConfidence }
  }, [insights])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              {lang === "ar" ? "العقل الذكي الزراعي" : "Agentic Brain"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-white/70" />
              <span className="text-sm text-white/70">{fieldName || (lang === "ar" ? "تحليل شامل" : "Comprehensive Analysis")}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-emerald-400">
                {Math.round(stats.avgConfidence * 100)}% {lang === "ar" ? "ثقة" : "confidence"}
              </div>
              <div className="text-xs text-white/70">
                {stats.total} {lang === "ar" "insights"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Data */}
      <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
        <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          {lang === "ar" ? "بيانات السياق المباشرة" : "Live Context Data"}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-black/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-white/70">NDVI</span>
            </div>
            <div className="text-lg font-bold text-emerald-400">
              {contextData.ndvi?.toFixed(3) || "0.000"}
            </div>
          </div>
          <div className="bg-black/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-white/70">{lang === "ar" ? "رطوبة" : "Moisture"}</span>
            </div>
            <div className="text-lg font-bold text-blue-400">
              {contextData.moisture?.toFixed(1) || "0"}%
            </div>
          </div>
          <div className="bg-black/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-white/70">{lang === "ar" ? "حرارة" : "Temp"}</span>
            </div>
            <div className="text-lg font-bold text-orange-400">
              {contextData.temperature?.toFixed(1) || "0"}°C
            </div>
          </div>
          <div className="bg-black/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-white/70">pH</span>
            </div>
            <div className="text-lg font-bold text-purple-400">
              {contextData.soil_ph?.toFixed(1) || "0.0"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-emerald-400/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              {lang === "ar" ? "إجمالي التحليلات" : "Total Insights"}
            </span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-black/40 border border-red-400/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {lang === "ar" ? "تنبيهات عاجلة" : "Urgent Alerts"}
            </span>
          </div>
          <div className="text-2xl font-bold">{stats.byPriority.high || 0}</div>
        </div>

        <div className="bg-black/40 border border-blue-400/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              {lang === "ar" ? "توقعات" : "Predictions"}
            </span>
          </div>
          <div className="text-2xl font-bold">{stats.byType.prediction || 0}</div>
        </div>

        <div className="bg-black/40 border border-purple-400/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">
              {lang === "ar" ? "نشاط الذكاء" : "AI Activity"}
            </span>
          </div>
          <div className="text-2xl font-bold">
            {isGenerating ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "جاهز" : "Ready")}
          </div>
        </div>
      </div>

      {/* Generate New Insight */}
      <div className="flex justify-center">
        <Button 
          onClick={generateNewInsight}
          disabled={isGenerating}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
        >
          <Brain className="w-4 h-4 mr-2" />
          {isGenerating 
            ? (lang === "ar" ? "جارٍ التحليل..." : "Analyzing...") 
            : (lang === "ar" ? "تحليل ذكي جديد" : "New AI Analysis")
          }
        </Button>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-emerald-400">
          {lang === "ar" ? "التحليلات والتوصيات الحديثة" : "Recent Insights & Recommendations"}
        </h4>
        <div className="space-y-3">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  )
}
