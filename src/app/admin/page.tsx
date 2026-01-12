'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components/ui'
import { ProductionChart, MortalityChart } from '@/components/charts'
import { getDashboardStats, getProductionSummary } from '@/lib/api'
import { ProductionSummary } from '@/lib/database.types'
import { LayoutDashboard, Users, Home, Activity, TrendingUp, AlertTriangle } from 'lucide-react'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [productionData, setProductionData] = useState<ProductionSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const [statsData, productionHistory] = await Promise.all([
                    getDashboardStats(),
                    getProductionSummary({ months: 6 })
                ])
                setStats(statsData)
                setProductionData(productionHistory)
            } catch (error) {
                console.error('Error loading dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                ))}
                <div className="col-span-full h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Welcome to your farm management command center</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Sheds"
                    value={stats?.totalSheds || 0}
                    icon={<Home className="w-6 h-6 text-primary-500" />}
                />
                <StatCard
                    title="Active Workers"
                    value={stats?.totalWorkers || 0}
                    icon={<Users className="w-6 h-6 text-primary-500" />}
                />
                <StatCard
                    title="Monthly Production"
                    value={`${stats?.monthlyProduction?.crates.toFixed(0) || 0} Crates`}
                    icon={<TrendingUp className="w-6 h-6 text-green-500" />}
                    change={{ value: 12, type: 'increase' }} // Placeholder for change calculation
                />
                <StatCard
                    title="Monthly Mortality"
                    value={stats?.monthlyMortality || 0}
                    icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
                    change={{ value: 5, type: 'decrease' }} // Placeholder for change calculation
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Production Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Production Trends</CardTitle>
                        <CardDescription>Monthly egg production over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProductionChart
                            data={productionData}
                            type="monthly"
                            variant="line"
                            height={300}
                        />
                    </CardContent>
                </Card>

                {/* Mortality Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mortality Overview</CardTitle>
                        <CardDescription>Monthly mortality rates across all sheds</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MortalityChart
                            data={productionData}
                            type="monthly"
                            variant="area"
                            height={300}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
