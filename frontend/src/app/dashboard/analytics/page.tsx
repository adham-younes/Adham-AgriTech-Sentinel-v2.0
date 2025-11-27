"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts"
import { useTranslation } from "@/lib/i18n/use-language"
import { Download, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

const yieldData = [
    { year: "2020", wheat: 4000, corn: 2400, rice: 2400 },
    { year: "2021", wheat: 3000, corn: 1398, rice: 2210 },
    { year: "2022", wheat: 2000, corn: 9800, rice: 2290 },
    { year: "2023", wheat: 2780, corn: 3908, rice: 2000 },
    { year: "2024", wheat: 1890, corn: 4800, rice: 2181 },
]

const waterData = [
    { month: "Jan", usage: 4000, rain: 2400 },
    { month: "Feb", usage: 3000, rain: 1398 },
    { month: "Mar", usage: 2000, rain: 9800 },
    { month: "Apr", usage: 2780, rain: 3908 },
    { month: "May", usage: 1890, rain: 4800 },
    { month: "Jun", usage: 2390, rain: 3800 },
    { month: "Jul", usage: 3490, rain: 4300 },
]

const cropDistribution = [
    { name: "Wheat", value: 400 },
    { name: "Corn", value: 300 },
    { name: "Rice", value: 300 },
    { name: "Cotton", value: 200 },
]

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"]

export default function AnalyticsPage() {
    const { language } = useTranslation()
    const isAr = language === "ar"

    return (
        <div className="space-y-6 p-6" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{isAr ? "التحليلات المتقدمة" : "Advanced Analytics"}</h1>
                    <p className="text-muted-foreground mt-1">
                        {isAr ? "رؤى تفصيلية حول أداء المزرعة واستهلاك الموارد." : "Detailed insights into farm performance and resource consumption."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        {isAr ? "2024" : "2024"}
                    </Button>
                    <Button className="gap-2">
                        <Download className="h-4 w-4" />
                        {isAr ? "تصدير التقرير" : "Export Report"}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="yield" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="yield">{isAr ? "الإنتاجية" : "Yield"}</TabsTrigger>
                    <TabsTrigger value="water">{isAr ? "المياه" : "Water"}</TabsTrigger>
                    <TabsTrigger value="crops">{isAr ? "المحاصيل" : "Crops"}</TabsTrigger>
                </TabsList>

                <TabsContent value="yield" className="space-y-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>{isAr ? "تاريخ الإنتاجية" : "Yield History"}</CardTitle>
                            <CardDescription>
                                {isAr ? "مقارنة الإنتاجية بالطن عبر السنوات الخمس الماضية." : "Yield comparison in tons over the last 5 years."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yieldData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="year" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                        itemStyle={{ color: "#e5e7eb" }}
                                    />
                                    <Legend />
                                    <Bar dataKey="wheat" name={isAr ? "قمح" : "Wheat"} fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="corn" name={isAr ? "ذرة" : "Corn"} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="water" className="space-y-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>{isAr ? "استهلاك المياه مقابل الأمطار" : "Water Usage vs Rainfall"}</CardTitle>
                            <CardDescription>
                                {isAr ? "تحليل كفاءة الري بالمتر المكعب." : "Irrigation efficiency analysis in cubic meters."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={waterData}>
                                    <defs>
                                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                        itemStyle={{ color: "#e5e7eb" }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="usage" name={isAr ? "ري" : "Irrigation"} stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsage)" />
                                    <Area type="monotone" dataKey="rain" name={isAr ? "أمطار" : "Rainfall"} stroke="#10b981" fillOpacity={1} fill="url(#colorRain)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="crops" className="space-y-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>{isAr ? "توزيع المحاصيل" : "Crop Distribution"}</CardTitle>
                            <CardDescription>
                                {isAr ? "توزيع المساحة المزروعة حسب نوع المحصول." : "Cultivated area distribution by crop type."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={cropDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={150}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {cropDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                        itemStyle={{ color: "#e5e7eb" }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
