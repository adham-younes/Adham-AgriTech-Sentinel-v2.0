"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface TrendGraphProps {
    data: {
        date: string
        value: number
    }[]
    metric: string
    color?: string
    height?: number
}

export function TrendGraph({ data, metric, color = "#00ff00", height = 150 }: TrendGraphProps) {
    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={10}
                        tickFormatter={(value) => {
                            const date = new Date(value)
                            return `${date.getDate()}/${date.getMonth() + 1}`
                        }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={10}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.9)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff"
                        }}
                        labelStyle={{ color: "#fff" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
