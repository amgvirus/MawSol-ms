'use client'

import { useEffect, useState } from 'react'
import { getProductionSummary, getSheds } from '@/lib/api'
import { ProductionSummary, Shed } from '@/lib/database.types'
import {
    getDashboardStats
} from '@/lib/api'
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Select,
    StatCard,
    Button
} from '@/components/ui'
import { ProductionChart, MortalityChart } from '@/components/charts'
import { BarChart3, TrendingUp, AlertTriangle, Filter } from 'lucide-react'

export default function ProductionPage() {
    const [data, setData] = useState<ProductionSummary[]>([])
    const [sheds, setSheds] = useState<Shed[]>([])
    const [stats, setStats] = useState<any>(null)
    const [selectedShedId, setSelectedShedId] = useState<string>('all')
    const [selectedMonth, setSelectedMonth] = useState<string>('6') // 6 months
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function init() {
            try {
                const [shedsData, statsData] = await Promise.all([
                    getSheds(),
                    getDashboardStats()
                ])
                setSheds(shedsData)
                setStats(statsData)
            } catch (error) {
                console.error('Error loading initial data:', error)
            }
        }
        init()
    }, [])

    useEffect(() => {
        async function loadChartData() {
            try {
                setIsLoading(true)
                const historyData = await getProductionSummary({
                    shedId: selectedShedId === 'all' ? undefined : selectedShedId,
                    months: parseInt(selectedMonth)
                })
                setData(historyData)
            } catch (error) {
                console.error('Error loading chart data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadChartData()
    }, [selectedShedId, selectedMonth])

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400">Analyze performance trends and bird health</p>
                </div>

                <div className="flex items-center gap-3">
                    <Select
                        className="w-40"
                        options={[
                            { value: 'all', label: 'All Sheds' },
                            ...sheds.map(s => ({ value: s.id, label: s.name }))
                        ]}
                        value={selectedShedId}
                        onChange={(e) => setSelectedShedId(e.target.value)}
                    />
                    <Select
                        className="w-40"
                        options={[
                            { value: '3', label: 'Last 3 Months' },
                            { value: '6', label: 'Last 6 Months' },
                            { value: '12', label: 'Last Year' },
                        ]}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Production (Month)"
                    value={`${stats?.monthlyProduction?.crates.toFixed(0) || 0} Crates`}
                    icon={<BarChart3 className="w-6 h-6 text-primary-500" />}
                />
                <StatCard
                    title="Avg Daily Production"
                    value={`${((stats?.monthlyProduction?.crates || 0) / 30).toFixed(1)} Crates`}
                    icon={<TrendingUp className="w-6 h-6 text-green-500" />}
                />
                <StatCard
                    title="Mortality Rate"
                    value={`${((stats?.monthlyMortality || 0) / (stats?.monthlyProduction?.birds || 1) * 100).toFixed(2)}%`}
                    icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Production Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse">
                                <p className="text-gray-400">Loading charts...</p>
                            </div>
                        ) : (
                            <ProductionChart
                                data={data}
                                type="monthly"
                                variant="line"
                                height={400}
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Mortality Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[300px] bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse" />
                        ) : (
                            <MortalityChart
                                data={data}
                                type="monthly"
                                variant="area"
                                height={300}
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Shed Performance Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[300px] bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse" />
                        ) : (
                            <MortalityChart
                                data={data} // Reusing data which comes from production_summary
                                // Ideally this should be a breakdown by shed for the current month
                                // For now showing the same data structure in a pie format
                                type="monthly"
                                variant="pie"
                                height={300}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
