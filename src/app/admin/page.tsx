'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats, getProductionSummary } from '@/lib/api'
import { ProductionSummary } from '@/lib/database.types'
import { Calendar, Filter, ChevronDown, Download } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from 'recharts'

// Mock sparkline data
const sparklineData1 = Array.from({ length: 20 }, () => ({ value: Math.floor(Math.random() * 50) + 50 }))
const sparklineData2 = Array.from({ length: 20 }, () => ({ value: Math.floor(Math.random() * 30) + 70 }))
const sparklineData3 = Array.from({ length: 20 }, () => ({ value: Math.floor(Math.random() * 40) + 40 }))

const mockResourceData = [
  { name: 'Shed 1', Feed: 400, Water: 240, Medicine: 150 },
  { name: 'Shed 2', Feed: 300, Water: 139, Medicine: 220 },
  { name: 'Shed 3', Feed: 200, Water: 480, Medicine: 180 },
  { name: 'Shed 4', Feed: 278, Water: 390, Medicine: 200 },
  { name: 'Shed 5', Feed: 189, Water: 480, Medicine: 150 },
  { name: 'Shed 6', Feed: 239, Water: 380, Medicine: 190 },
  { name: 'Shed 7', Feed: 349, Water: 430, Medicine: 210 },
]

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
                // Use real data or fallback to mock if empty
                setProductionData(productionHistory.length > 0 ? productionHistory : [
                    { month: 'Oct 1', total_production_crates: 10, total_production_birds: 1000, avg_total_birds: 1000, total_non_production: 0, total_mortality: 2, entry_count: 1, id: '1', shed_id: '1', created_at: '', updated_at: '' },
                    { month: 'Oct 5', total_production_crates: 25, total_production_birds: 1000, avg_total_birds: 1000, total_non_production: 0, total_mortality: 1, entry_count: 1, id: '2', shed_id: '1', created_at: '', updated_at: '' },
                    { month: 'Oct 10', total_production_crates: 45, total_production_birds: 1000, avg_total_birds: 1000, total_non_production: 0, total_mortality: 3, entry_count: 1, id: '3', shed_id: '1', created_at: '', updated_at: '' },
                    { month: 'Oct 15', total_production_crates: 35, total_production_birds: 1000, avg_total_birds: 1000, total_non_production: 0, total_mortality: 2, entry_count: 1, id: '4', shed_id: '1', created_at: '', updated_at: '' },
                    { month: 'Oct 20', total_production_crates: 65, total_production_birds: 1000, avg_total_birds: 1000, total_non_production: 0, total_mortality: 1, entry_count: 1, id: '5', shed_id: '1', created_at: '', updated_at: '' },
                    { month: 'Oct 26', total_production_crates: 90, total_production_birds: 1000, avg_total_birds: 1000, total_non_production: 0, total_mortality: 4, entry_count: 1, id: '6', shed_id: '1', created_at: '', updated_at: '' },
                ])
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 w-full max-w-[1400px] mx-auto text-gray-200">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-wide">
                    Analytics
                </h1>
                
                <div className="flex items-center gap-3">
                    {/* Date Picker Button */}
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-sm font-medium hover:bg-[rgba(255,255,255,0.06)] transition-all">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Oct 1, 2024 - Oct 26, 2024</span>
                        <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                    </button>
                    
                    {/* Filter Button */}
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-sm font-medium hover:bg-[rgba(255,255,255,0.06)] transition-all">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span>Filter</span>
                    </button>
                    
                    {/* Export Button */}
                    <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-white text-sm font-medium transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        <span>Export Data</span>
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1 */}
                <div className="bg-[#131826] border border-[#1e2532] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2 z-10">Total Active Birds</p>
                    <div className="flex items-end justify-between z-10">
                        <h3 className="text-3xl font-bold text-white">
                            {stats?.monthlyTotalBirds?.toLocaleString() || '1,245'}
                        </h3>
                        <div className="w-24 h-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sparklineData1}>
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#131826] border border-[#1e2532] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#22C55E]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2 z-10">Active Sheds</p>
                    <div className="flex items-end justify-between z-10">
                        <h3 className="text-3xl font-bold text-white">
                            {stats?.totalSheds || '78%'}
                        </h3>
                        <div className="w-24 h-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sparklineData2}>
                                    <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-[#131826] border border-[#1e2532] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2 z-10">Avg Daily Crates</p>
                    <div className="flex items-end justify-between z-10">
                        <h3 className="text-3xl font-bold text-white">
                            {stats?.monthlyProduction?.crates ? Math.round(stats.monthlyProduction.crates / 30) : '120'}
                        </h3>
                        <div className="w-24 h-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sparklineData3}>
                                    <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Chart: Area Chart */}
            <div className="bg-[#131826] border border-[#1e2532] rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[15px] font-semibold text-gray-200">Production Growth (Last 30 Days)</h3>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors">
                        <Filter className="w-3 h-3" />
                        <span>Filter</span>
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                </div>
                
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={productionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 12 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e2532', borderColor: '#2e3646', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#22C55E' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="total_production_crates" 
                                stroke="#22C55E" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorGrowth)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Chart: Stacked Bar Chart */}
            <div className="bg-[#131826] border border-[#1e2532] rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[15px] font-semibold text-gray-200">Resource Usage by Shed</h3>
                    <div className="flex gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]"></div><span className="text-gray-400">Feed</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#eab308]"></div><span className="text-gray-400">Water</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]"></div><span className="text-gray-400">Medicine</span></div>
                    </div>
                </div>

                <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockResourceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                contentStyle={{ backgroundColor: '#1e2532', borderColor: '#2e3646', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="Feed" stackId="a" fill="#22C55E" radius={[0, 0, 4, 4]} barSize={32} />
                            <Bar dataKey="Water" stackId="a" fill="#eab308" />
                            <Bar dataKey="Medicine" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
