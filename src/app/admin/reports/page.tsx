'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    generateReportData,
    generatePDFReport,
    generateCSVReport,
    downloadBlob,
    downloadCSV,
    getSheds
} from '@/lib/api'
import { reportFilterSchema, ReportFilterData } from '@/lib/validations'
import { Shed } from '@/lib/database.types'
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    Select
} from '@/components/ui'
import { FileText, Download, Loader2 } from 'lucide-react'
import { format, subDays } from 'date-fns'

export default function ReportsPage() {
    const [sheds, setSheds] = useState<Shed[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [previewData, setPreviewData] = useState<any>(null)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ReportFilterData>({
        resolver: zodResolver(reportFilterSchema),
        defaultValues: {
            start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
            end_date: format(new Date(), 'yyyy-MM-dd'),
            variant: 'all',
            shed_id: '',
        }
    })

    useEffect(() => {
        getSheds().then(setSheds).catch(console.error)
    }, [])

    const handleGenerate = async (data: ReportFilterData) => {
        try {
            setIsGenerating(true)
            const reportData = await generateReportData({
                shedId: data.shed_id || undefined,
                variant: data.variant === 'all' ? undefined : (data.variant as 'W' | 'B'),
                startDate: data.start_date!,
                endDate: data.end_date!,
            })
            setPreviewData(reportData)
        } catch (error) {
            console.error('Error generating report:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownloadPDF = () => {
        if (!previewData) return
        const blob = generatePDFReport(previewData, 'Poultry Production Report')
        downloadBlob(blob, `report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    }

    const handleDownloadCSV = () => {
        if (!previewData) return
        const csv = generateCSVReport(previewData)
        downloadCSV(csv, `report-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports Generator</h1>
                <p className="text-gray-500 dark:text-gray-400">Export detailed production and performance reports</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Filters Card */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Report Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(handleGenerate)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Start Date"
                                    type="date"
                                    {...register('start_date')}
                                    error={errors.start_date?.message}
                                />
                                <Input
                                    label="End Date"
                                    type="date"
                                    {...register('end_date')}
                                    error={errors.end_date?.message}
                                />
                            </div>

                            <Select
                                label="Filter by Shed"
                                options={[
                                    { value: '', label: 'All Sheds' },
                                    ...sheds.map(s => ({ value: s.id, label: s.name }))
                                ]}
                                {...register('shed_id')}
                            />

                            <Select
                                label="Filter by Variant"
                                options={[
                                    { value: 'all', label: 'All Variants' },
                                    { value: 'W', label: 'White' },
                                    { value: 'B', label: 'Brown' },
                                ]}
                                {...register('variant')}
                            />

                            <Button type="submit" className="w-full" disabled={isGenerating}>
                                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Generate Preview
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card className="lg:col-span-2 min-h-[500px]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Report Preview</CardTitle>
                        {previewData && (
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                                    <Download className="w-4 h-4 mr-2" />
                                    CSV
                                </Button>
                                <Button size="sm" onClick={handleDownloadPDF}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    PDF
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {!previewData ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                <p>Select settings and click generate to view report</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase">Total Crates</p>
                                        <p className="text-xl font-bold text-primary-600">{previewData.summary.totalCrates.toFixed(2)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase">Total Mortality</p>
                                        <p className="text-xl font-bold text-red-600">{previewData.summary.totalMortality}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase">Avg Birds</p>
                                        <p className="text-xl font-bold text-blue-600">{previewData.summary.avgBirds.toFixed(0)}</p>
                                    </div>
                                </div>

                                {/* Data Preview Table */}
                                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shed</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crates</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mortality</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {previewData.entries.slice(0, 5).map((entry: any) => (
                                                <tr key={entry.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                        {entry.entry_date}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                        {entry.shed?.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                        {entry.production_crates}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                        {entry.mortality}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {previewData.entries.length > 5 && (
                                        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
                                            Show first 5 of {previewData.entries.length} records in preview. Download full report for all data.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
