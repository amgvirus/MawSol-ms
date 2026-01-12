'use client'

import { useEffect, useState } from 'react'
import { getWorkerEntries } from '@/lib/api'
import { DailyEntryWithRelations } from '@/lib/database.types'
import { useAuth } from '@/lib/auth'
import { Table, Card, CardContent } from '@/components/ui'
import { Calendar, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function WorkerHistoryPage() {
    const [entries, setEntries] = useState<DailyEntryWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        async function loadEntries() {
            if (!user) return
            try {
                const data = await getWorkerEntries(user.id)
                setEntries(data)
            } catch (error) {
                console.error('Error loading entries:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadEntries()
    }, [user])

    const columns = [
        {
            key: 'entry_date',
            header: 'Date',
            render: (entry: DailyEntryWithRelations) => (
                <span className="font-medium text-gray-900 dark:text-white">
                    {format(parseISO(entry.entry_date), 'MMM dd, yyyy')}
                </span>
            )
        },
        {
            key: 'shed.name',
            header: 'Shed',
            sortable: true,
            render: (entry: DailyEntryWithRelations) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    {entry.shed?.name}
                </span>
            )
        },
        {
            key: 'production_crates',
            header: 'Crates',
            render: (entry: DailyEntryWithRelations) => (
                <span className="font-mono">{entry.production_crates.toFixed(2)}</span>
            )
        },
        {
            key: 'production_birds',
            header: 'Prod. Birds',
            render: (entry: DailyEntryWithRelations) => (
                <span className="font-mono">{entry.production_birds}</span>
            )
        },
        {
            key: 'mortality',
            header: 'Mortality',
            render: (entry: DailyEntryWithRelations) => (
                <span className={`font-mono font-medium ${entry.mortality > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {entry.mortality}
                </span>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entry History</h1>
                <p className="text-gray-500 dark:text-gray-400">View your past submissions</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table
                        data={entries}
                        columns={columns}
                        keyExtractor={(entry) => entry.id}
                        isLoading={isLoading}
                        emptyMessage="No entries found. Start by adding a daily record."
                        className="border-0 rounded-none"
                    />
                </CardContent>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm border border-blue-100 dark:border-blue-900/50">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                    Note: You can view all your history here, but entries can typically only be edited on the same day they were created. Contact an admin if you need to correct older records.
                </p>
            </div>
        </div>
    )
}
