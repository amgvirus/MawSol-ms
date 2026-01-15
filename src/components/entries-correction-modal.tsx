'use client'

import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { DailyEntryWithRelations } from '@/lib/database.types'

interface EntriesCorrectionModalProps {
    entry: DailyEntryWithRelations | null
    isOpen: boolean
    onClose: () => void
    onSave: (values: {
        production_crates: number
        production_birds: number
        total_birds: number
        non_production: number
        mortality: number
        notes: string
    }) => Promise<void>
}

const EGGS_PER_CRATE = 30

export function EntriesCorrectionModal({
    entry,
    isOpen,
    onClose,
    onSave,
}: EntriesCorrectionModalProps) {
    const [formData, setFormData] = useState({
        production_crates: entry?.production_crates || 0,
        production_birds: entry?.production_birds || 0,
        total_birds: entry?.total_birds || 0,
        non_production: entry?.non_production || 0,
        mortality: entry?.mortality || 0,
        notes: entry?.notes || '',
    })
    const [isSaving, setIsSaving] = useState(false)

    if (!entry) return null

    // Auto-calculate based on production crates
    const handleCratesChange = (value: string) => {
        const crates = parseFloat(value) || 0
        const productionBirds = Math.round(crates * EGGS_PER_CRATE)
        const totalBirds = formData.total_birds || entry.shed?.number_of_birds || entry.shed?.capacity || 0
        const nonProduction = Math.max(0, totalBirds - productionBirds)

        setFormData(prev => ({
            ...prev,
            production_crates: crates,
            production_birds: productionBirds,
            non_production: nonProduction,
        }))
    }

    const handleChange = (field: string, value: string | number) => {
        if (field === 'production_crates') {
            handleCratesChange(value as string)
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: typeof value === 'string' && field !== 'notes' ? parseFloat(value) || 0 : value
            }))
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            await onSave(formData)
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="p-6 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Correct Entry
                    </h2>
                </div>

                <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Shed:</span> {entry.shed?.name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Worker:</span> {entry.worker?.full_name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Date:</span> {new Date(entry.entry_date).toLocaleDateString()}
                    </p>
                </div>

                {entry.original_values && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Original Values:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span>Crates: {(entry.original_values as any).production_crates}</span>
                            <span>Birds: {(entry.original_values as any).production_birds}</span>
                            <span>Total: {(entry.original_values as any).total_birds}</span>
                            <span>Non-Prod: {(entry.original_values as any).non_production}</span>
                            <span>Mortality: {(entry.original_values as any).mortality}</span>
                        </div>
                        {(entry.original_values as any).notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Notes: {(entry.original_values as any).notes}
                            </p>
                        )}
                    </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                    <p>💡 <span className="font-semibold">Auto-calculation enabled:</span> Production birds and non-production will be calculated automatically based on crates entered.</p>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Production Crates"
                        type="number"
                        step="0.01"
                        value={formData.production_crates}
                        onChange={(e) => handleChange('production_crates', e.target.value)}
                        placeholder="Enter crates (auto-calculates birds)"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Production Birds <span className="text-amber-500">(Auto)</span>
                            </label>
                            <input
                                type="number"
                                value={formData.production_birds}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white cursor-not-allowed"
                            />
                        </div>
                        <Input
                            label="Total Birds"
                            type="number"
                            value={formData.total_birds}
                            onChange={(e) => handleChange('total_birds', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Non-Production <span className="text-amber-500">(Auto)</span>
                        </label>
                        <input
                            type="number"
                            value={formData.non_production}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white cursor-not-allowed"
                        />
                    </div>

                    <Input
                        label="Mortality"
                        type="number"
                        value={formData.mortality}
                        onChange={(e) => handleChange('mortality', e.target.value)}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Add correction notes..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1"
                    >
                        {isSaving ? 'Saving...' : 'Save Correction'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
