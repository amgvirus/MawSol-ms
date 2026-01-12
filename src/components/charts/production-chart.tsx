'use client'

import { useMemo } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { DailyEntry, ProductionSummary } from '@/lib/database.types'

interface ProductionChartProps {
    data: DailyEntry[] | ProductionSummary[]
    type?: 'daily' | 'monthly'
    variant?: 'line' | 'bar'
    showCrates?: boolean
    showBirds?: boolean
    height?: number
}

export function ProductionChart({
    data,
    type = 'daily',
    variant = 'line',
    showCrates = true,
    showBirds = true,
    height = 350,
}: ProductionChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return []

        return data.map((item: any) => ({
            date: type === 'daily'
                ? format(parseISO(item.entry_date), 'MMM dd')
                : format(parseISO(item.month), 'MMM yyyy'),
            crates: type === 'daily' ? item.production_crates : item.total_production_crates,
            birds: type === 'daily' ? item.production_birds : item.total_production_birds,
        })).reverse()
    }, [data, type])

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                No production data available
            </div>
        )
    }

    const ChartComponent = variant === 'line' ? LineChart : BarChart

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    yAxisId="left"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                {showBirds && (
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                )}
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                {showCrates && (
                    variant === 'line' ? (
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="crates"
                            name="Crates"
                            stroke="#22C55E"
                            strokeWidth={3}
                            dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ) : (
                        <Bar
                            yAxisId="left"
                            dataKey="crates"
                            name="Crates"
                            fill="#22C55E"
                            radius={[4, 4, 0, 0]}
                        />
                    )
                )}
                {showBirds && (
                    variant === 'line' ? (
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="birds"
                            name="Birds"
                            stroke="#F97316"
                            strokeWidth={3}
                            dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ) : (
                        <Bar
                            yAxisId="right"
                            dataKey="birds"
                            name="Birds"
                            fill="#F97316"
                            radius={[4, 4, 0, 0]}
                        />
                    )
                )}
            </ChartComponent>
        </ResponsiveContainer>
    )
}
