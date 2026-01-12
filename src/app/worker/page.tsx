'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/lib/auth'
import {
    getAssignedSheds,
    createDailyEntry,
    checkEntryExists
} from '@/lib/api'
import { dailyEntrySchema, DailyEntryFormData } from '@/lib/validations'
import { Shed } from '@/lib/database.types'
import {
    Button,
    Input,
    Select,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    ConfirmModal
} from '@/components/ui'
import { Loader2, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function WorkerDailyEntryPage() {
    const [sheds, setSheds] = useState<Shed[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [dateWarning, setDateWarning] = useState<string | null>(null)

    const { user } = useAuth()

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors }
    } = useForm<DailyEntryFormData>({
        resolver: zodResolver(dailyEntrySchema),
        defaultValues: {
            entry_date: format(new Date(), 'yyyy-MM-dd'),
            production_crates: 0,
            production_birds: 0,
            total_birds: 0,
            non_production: 0,
            mortality: 0,
            notes: ''
        }
    })

    // Watch fields for logic
    const selectedShedId = watch('shed_id')
    const entryDate = watch('entry_date')

    useEffect(() => {
        async function loadSheds() {
            if (!user) return
            try {
                const assignedSheds = await getAssignedSheds(user.id)
                setSheds(assignedSheds)
            } catch (error) {
                console.error('Error loading sheds:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadSheds()
    }, [user])

    // Check for existing entries on date change or shed change
    useEffect(() => {
        async function checkExisting() {
            if (!selectedShedId || !entryDate) return
            try {
                const exists = await checkEntryExists(selectedShedId, entryDate)
                if (exists) {
                    setDateWarning('An entry already exists for this shed on this date.')
                } else {
                    setDateWarning(null)
                }
            } catch (error) {
                console.error('Error checking entry:', error)
            }
        }
        checkExisting()
    }, [selectedShedId, entryDate])

    const onSubmit = async (data: DailyEntryFormData) => {
        if (!user) return
        setIsSubmitting(true)

        try {
            await createDailyEntry({
                ...data,
                worker_id: user.id
            })

            setShowSuccess(true)
            // Reset form but keep shed selection for convenience
            reset({
                shed_id: data.shed_id,
                entry_date: format(new Date(), 'yyyy-MM-dd'),
                production_crates: 0,
                production_birds: 0,
                total_birds: data.total_birds, // Keep total birds as it likely changes little
                non_production: 0,
                mortality: 0,
                notes: ''
            })

            // Hide success message after 3 seconds
            setTimeout(() => setShowSuccess(false), 3000)
        } catch (error: any) {
            console.error('Error submitting entry:', error)
            alert(`Failed to save entry: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
            </div>
        )
    }

    if (sheds.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Sheds Assigned</h2>
                <p className="text-gray-500 mt-2">Please contact an administrator to assign you to a shed.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Recording</h1>
                <p className="text-gray-500 dark:text-gray-400">Record today's production statistics</p>
            </div>

            <Card className="border-t-4 border-t-secondary-500">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Shed & Date Selection */}
                            <div className="space-y-4">
                                <Select
                                    label="Select Shed"
                                    options={sheds.map(s => ({
                                        value: s.id,
                                        label: `${s.name} (${s.variant === 'W' ? 'White' : 'Brown'})`
                                    }))}
                                    placeholder="Choose a shed..."
                                    error={errors.shed_id?.message}
                                    {...register('shed_id')}
                                />

                                <Input
                                    label="Date"
                                    type="date"
                                    error={errors.entry_date?.message}
                                    {...register('entry_date')}
                                />

                                {dateWarning && (
                                    <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-lg flex items-start gap-2 border border-yellow-200">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p>{dateWarning}</p>
                                    </div>
                                )}
                            </div>

                            {/* Stats Input */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Prod. Crates"
                                        type="number"
                                        step="0.01"
                                        className="font-mono"
                                        error={errors.production_crates?.message}
                                        {...register('production_crates', { valueAsNumber: true })}
                                    />
                                    <Input
                                        label="Prod. Birds"
                                        type="number"
                                        className="font-mono"
                                        error={errors.production_birds?.message}
                                        {...register('production_birds', { valueAsNumber: true })}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <Input
                                        label="Total Birds"
                                        type="number"
                                        className="font-mono"
                                        error={errors.total_birds?.message}
                                        {...register('total_birds', { valueAsNumber: true })}
                                    />
                                    <Input
                                        label="Non-Prod"
                                        type="number"
                                        className="font-mono"
                                        error={errors.non_production?.message}
                                        {...register('non_production', { valueAsNumber: true })}
                                    />
                                    <Input
                                        label="Mortality"
                                        type="number"
                                        className="font-mono text-red-600"
                                        error={errors.mortality?.message}
                                        {...register('mortality', { valueAsNumber: true })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 transition-all min-h-[100px]"
                                placeholder="Any observations or issues..."
                                {...register('notes')}
                            />
                            {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 focus:ring-secondary-500 shadow-lg shadow-secondary-500/25"
                            disabled={isSubmitting || !!dateWarning}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Saving Entry...
                                </>
                            ) : (
                                'Submit Daily Record'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Success Notification */}
            {showSuccess && (
                <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up z-50">
                    <CheckCircle2 className="w-6 h-6" />
                    <div className="font-medium">
                        <p className="text-lg">Success!</p>
                        <p className="text-sm opacity-90">Daily entry recorded successfully</p>
                    </div>
                </div>
            )}
        </div>
    )
}
