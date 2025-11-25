"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { 
  Brain, 
  Target, 
  Droplets, 
  Leaf, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Info,
  BarChart3,
  Zap,
  Shield,
  Clock,
  ChevronRight
} from "lucide-react"

interface AIInsightsPanelProps {
  insights: {
    healthScore: number
    diseaseRisk: {
      level: "low" | "medium" | "high"
      probability: number
      predictedDiseases: string[]
    }
    yieldPrediction: {
      estimated: number
      confidence: number
      factors: string[]
    }
    irrigationNeed: {
      urgency: "low" | "medium" | "high"
      amount: number
      timing: string
      efficiency: number
    }
    fertilizerRecommendation: {
      type: string
      amount: number
      timing: string
      npkRatio: { N: number; P: number; K: number }
    }
    harvestingWindow: {
      start: string
      end: string
      optimal: string
      qualityScore: number
    }
    sustainabilityMetrics: {
      carbonFootprint: number
      waterEfficiency: number
      soilHealth: number
      biodiversityIndex: number
    }
  }
  onActionClick?: (action: string, data: any) => void
}

export function AIInsightsPanel({ insights, onActionClick }: AIInsightsPanelProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "destructive"
      case "medium": return "default"
      case "low": return "secondary"
      default: return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      {/* AI Processing Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Advanced machine learning analysis</p>
              <p className="text-sm text-purple-200 mt-1">Processing satellite, weather, and historical data</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{insights.healthScore.toFixed(1)}%</div>
              <p className="text-sm text-purple-100">Field Health Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button 
          variant={insights.irrigationNeed.urgency === "high" ? "destructive" : "default"}
          className="flex items-center gap-2 h-auto p-4"
          onClick={() => onActionClick?.("irrigation", insights.irrigationNeed)}
        >
          <Droplets className="h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Irrigation</div>
            <div className="text-xs opacity-80">{insights.irrigationNeed.amount}mm needed</div>
          </div>
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Button>

        <Button 
          variant="outline"
          className="flex items-center gap-2 h-auto p-4"
          onClick={() => onActionClick?.("fertilizer", insights.fertilizerRecommendation)}
        >
          <Leaf className="h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Fertilizer</div>
            <div className="text-xs opacity-80">{insights.fertilizerRecommendation.amount} kg/ha</div>
          </div>
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Button>

        <Button 
          variant="outline"
          className="flex items-center gap-2 h-auto p-4"
          onClick={() => onActionClick?.("disease", insights.diseaseRisk)}
        >
          <Shield className="h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Disease Risk</div>
            <div className="text-xs opacity-80">{insights.diseaseRisk.level}</div>
          </div>
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Button>

        <Button 
          variant="outline"
          className="flex items-center gap-2 h-auto p-4"
          onClick={() => onActionClick?.("harvest", insights.harvestingWindow)}
        >
          <Calendar className="h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Harvest</div>
            <div className="text-xs opacity-80">{formatDate(insights.harvestingWindow.optimal)}</div>
          </div>
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disease Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Disease Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Risk Level</span>
              <Badge variant={insights.diseaseRisk.level === "high" ? "destructive" : 
                             insights.diseaseRisk.level === "medium" ? "default" : "secondary"}>
                {insights.diseaseRisk.level.toUpperCase()}
              </Badge>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Probability</span>
                <span>{insights.diseaseRisk.probability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getRiskColor(insights.diseaseRisk.level)}`}
                  style={{ width: `${insights.diseaseRisk.probability}%` }}
                />
              </div>
            </div>

            {insights.diseaseRisk.predictedDiseases.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Predicted Diseases:</p>
                <div className="space-y-1">
                  {insights.diseaseRisk.predictedDiseases.map((disease, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span>{disease}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.diseaseRisk.level === "high" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Immediate action recommended. Contact agronomist for treatment plan.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Yield Prediction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Yield Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {insights.yieldPrediction.estimated.toLocaleString()}
              </div>
              <p className="text-gray-600">kg/ha estimated yield</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Confidence Level</span>
                <span>{insights.yieldPrediction.confidence}%</span>
              </div>
              <Progress value={insights.yieldPrediction.confidence} className="h-2" />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Key Factors:</p>
              <div className="space-y-1">
                {insights.yieldPrediction.factors.map((factor, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Irrigation Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Irrigation Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Urgency</span>
              <Badge variant={getUrgencyColor(insights.irrigationNeed.urgency)}>
                {insights.irrigationNeed.urgency.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Amount Needed</p>
                <p className="text-lg font-semibold">{insights.irrigationNeed.amount}mm</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Efficiency</p>
                <p className="text-lg font-semibold">{insights.irrigationNeed.efficiency}%</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Optimal Timing</p>
              <p className="text-sm text-gray-600">{insights.irrigationNeed.timing}</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Water Efficiency</span>
                <span>{insights.irrigationNeed.efficiency}%</span>
              </div>
              <Progress value={insights.irrigationNeed.efficiency} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Fertilizer Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Fertilizer Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Product Type</p>
              <p className="font-semibold">{insights.fertilizerRecommendation.type}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Application Rate</p>
                <p className="font-semibold">{insights.fertilizerRecommendation.amount} kg/ha</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Timing</p>
                <p className="font-semibold text-sm">{insights.fertilizerRecommendation.timing}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">NPK Ratio</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-xs text-gray-600">N</p>
                  <p className="font-semibold">{insights.fertilizerRecommendation.npkRatio.N}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-xs text-gray-600">P</p>
                  <p className="font-semibold">{insights.fertilizerRecommendation.npkRatio.P}</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="text-xs text-gray-600">K</p>
                  <p className="font-semibold">{insights.fertilizerRecommendation.npkRatio.K}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harvesting Window */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Harvesting Window
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatDate(insights.harvestingWindow.optimal)}
              </div>
              <p className="text-gray-600">Optimal harvest date</p>
            </div>

            <div className="flex justify-between text-sm">
              <span>Start: {formatDate(insights.harvestingWindow.start)}</span>
              <span>End: {formatDate(insights.harvestingWindow.end)}</span>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Quality Score</span>
                <span>{insights.harvestingWindow.qualityScore}%</span>
              </div>
              <Progress value={insights.harvestingWindow.qualityScore} className="h-2" />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Monitor weather conditions for optimal timing</span>
            </div>
          </CardContent>
        </Card>

        {/* Sustainability Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sustainability Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Carbon Footprint
                  </span>
                  <span>{insights.sustainabilityMetrics.carbonFootprint} kg CO₂/ha</span>
                </div>
                <Progress value={100 - insights.sustainabilityMetrics.carbonFootprint / 5} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    Water Efficiency
                  </span>
                  <span>{insights.sustainabilityMetrics.waterEfficiency}%</span>
                </div>
                <Progress value={insights.sustainabilityMetrics.waterEfficiency} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    Soil Health
                  </span>
                  <span>{insights.sustainabilityMetrics.soilHealth}%</span>
                </div>
                <Progress value={insights.sustainabilityMetrics.soilHealth} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Biodiversity Index
                  </span>
                  <span>{insights.sustainabilityMetrics.biodiversityIndex}%</span>
                </div>
                <Progress value={insights.sustainabilityMetrics.biodiversityIndex} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
