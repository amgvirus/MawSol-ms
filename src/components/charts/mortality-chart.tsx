'use client'

import { useMemo } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { DailyEntry, ProductionSummary } from '@/lib/database.types'

interface MortalityChartProps {
    data: DailyEntry[] | ProductionSummary[]
    type?: 'daily' | 'monthly'
    variant?: 'area' | 'pie'
    height?: number
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#8B5CF6']

export function MortalityChart({
    data,
    type = 'daily',
    variant = 'area',
    height = 300,
}: MortalityChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return []

        if (variant === 'pie') {
            // Group by shed for pie chart
            const grouped: Record<string, number> = {}
            data.forEach((item: any) => {
                const shedName = item.shed?.name || 'Unknown'
                grouped[shedName] = (grouped[shedName] || 0) + (item.mortality || item.total_mortality || 0)
            })
            return Object.entries(grouped).map(([name, value]) => ({ name, value }))
        }

        return data.map((item: any) => ({
            date: type === 'daily'
                ? format(parseISO(item.entry_date), 'MMM dd')
                : format(parseISO(item.month), 'MMM yyyy'),
            mortality: type === 'daily' ? item.mortality : item.total_mortality,
            totalBirds: type === 'daily' ? item.total_birds : item.avg_total_birds,
        })).reverse()
    }, [data, type, variant])

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                No mortality data available
            </div>
        )
    }

    if (variant === 'pie') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '12px',
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                    <linearGradient id="mortalityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                />
                <Area
                    type="monotone"
                    dataKey="mortality"
                    name="Mortality"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#mortalityGradient)"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
