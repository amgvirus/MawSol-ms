'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/lib/auth'
import {
    getDailyEntries,
    correctDailyEntry,
    getWorkers,
    getSheds
} from '@/lib/api'
import { Shed, Profile, DailyEntryWithRelations } from '@/lib/database.types'
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    Select,
} from '@/components/ui'
import { EntriesCorrectionModal } from '@/components/entries-correction-modal'
import { Edit2, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { z } from 'zod'

const filterSchema = z.object({
    shed_id: z.string().optional(),
    worker_id: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    show_corrected: z.string().optional(),
})

type FilterData = z.infer<typeof filterSchema>

export default function AdminEntriesPage() {
    const { user } = useAuth()
    const [entries, setEntries] = useState<DailyEntryWithRelations[]>([])
    const [sheds, setSheds] = useState<Shed[]>([])
    const [workers, setWorkers] = useState<Profile[]>([])
    const [selectedEntry, setSelectedEntry] = useState<DailyEntryWithRelations | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const pageSize = 10

    const { register, handleSubmit, watch } = useForm<FilterData>({
        resolver: zodResolver(filterSchema),
        defaultValues: {
            shed_id: '',
            worker_id: '',
            start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
            end_date: format(new Date(), 'yyyy-MM-dd'),
            show_corrected: 'all',
        }
    })

    // Watch individual fields to avoid object recreation
    const shedId = watch('shed_id')
    const workerId = watch('worker_id')
    const startDate = watch('start_date')
    const endDate = watch('end_date')
    const showCorrected = watch('show_corrected')

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const [sheds, workers] = await Promise.all([
                getSheds(),
                getWorkers()
            ])
            setSheds(sheds)
            setWorkers(workers)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const loadEntries = useCallback(async (page: number = 1) => {
        try {
            setIsLoading(true)
            const offset = (page - 1) * pageSize

            let query: any = {
                shedId: shedId || undefined,
                workerId: workerId || undefined,
                startDate: startDate,
                endDate: endDate,
                limit: pageSize,
                offset: offset,
            }

            const data = await getDailyEntries(query)
            
            // Filter corrected entries if needed
            let filtered = data
            if (showCorrected === 'corrected') {
                filtered = data.filter(e => e.corrected_by)
            } else if (showCorrected === 'original') {
                filtered = data.filter(e => !e.corrected_by)
            }

            setEntries(filtered)
            setCurrentPage(page)
        } catch (error) {
            console.error('Error loading entries:', error)
        } finally {
            setIsLoading(false)
        }
    }, [shedId, workerId, startDate, endDate, showCorrected, pageSize])

    useEffect(() => {
        loadData()
    }, [loadData])

    useEffect(() => {
        loadEntries(1)
    }, [shedId, workerId, startDate, endDate, showCorrected, loadEntries])

    const handleCorrect = (entry: DailyEntryWithRelations) => {
        setSelectedEntry(entry)
        setIsModalOpen(true)
    }

    const handleSaveCorrection = async (values: any) => {
        if (!selectedEntry || !user) return

        try {
            setIsSaving(true)
            await correctDailyEntry(selectedEntry.id, values, user.id)
            await loadEntries(currentPage)
            setIsModalOpen(false)
            setSelectedEntry(null)
            setSuccessMessage('Entry corrected successfully')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (error) {
            console.error('Error saving correction:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const tableColumns = [
        { key: 'entry_date', label: 'Date' },
        { key: 'shed', label: 'Shed' },
        { key: 'worker', label: 'Worker' },
        { key: 'production_crates', label: 'Crates' },
        { key: 'production_birds', label: 'Birds' },
        { key: 'mortality', label: 'Mortality' },
        { key: 'corrected', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Entries Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    View and correct worker entries
                </p>
            </div>

            {successMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
                    {successMessage}
                </div>
            )}

            {/* Filters Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(() => {})} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Select
                            label="Shed"
                            {...register('shed_id')}
                            options={[
                                { value: '', label: 'All Sheds' },
                                ...sheds.map(shed => ({
                                    value: shed.id,
                                    label: shed.name
                                }))
                            ]}
                        />

                        <Select
                            label="Worker"
                            {...register('worker_id')}
                            options={[
                                { value: '', label: 'All Workers' },
                                ...workers.map(worker => ({
                                    value: worker.id,
                                    label: worker.full_name || worker.email
                                }))
                            ]}
                        />

                        <Input
                            label="Start Date"
                            type="date"
                            {...register('start_date')}
                        />

                        <Input
                            label="End Date"
                            type="date"
                            {...register('end_date')}
                        />

                        <Select
                            label="Status"
                            {...register('show_corrected')}
                            options={[
                                { value: 'all', label: 'All Entries' },
                                { value: 'corrected', label: 'Corrected Only' },
                                { value: 'original', label: 'Original Only' }
                            ]}
                        />
                    </form>
                </CardContent>
            </Card>

            {/* Entries Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-gray-500">
                            <p>No entries found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        {tableColumns.map(col => (
                                            <th
                                                key={col.key}
                                                className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white"
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => (
                                        <tr
                                            key={entry.id}
                                            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                                entry.corrected_by ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.shed?.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.worker?.full_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.production_crates.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.production_birds}
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.mortality}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {entry.corrected_by ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                                                Corrected
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                                                Original
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCorrect(entry)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Correct
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && entries.length > 0 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Page {currentPage}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadEntries(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadEntries(currentPage + 1)}
                                    disabled={entries.length < pageSize}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <EntriesCorrectionModal
                entry={selectedEntry}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setSelectedEntry(null)
                }}
                onSave={handleSaveCorrection}
            />
        </div>
    )
}
