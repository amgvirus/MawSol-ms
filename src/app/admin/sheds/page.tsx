'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    getSheds,
    createShed,
    updateShed,
    deleteShed,
    getShedStatistics
} from '@/lib/api'
import { shedSchema, ShedFormData } from '@/lib/validations'
import { Shed, ShedStatistics } from '@/lib/database.types'
import {
    Table,
    Button,
    Modal,
    ConfirmModal,
    Input,
    Select,
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui'
import { Plus, Pencil, Trash2, Home, Search } from 'lucide-react'

export default function ShedsPage() {
    const [sheds, setSheds] = useState<Shed[]>([])
    const [stats, setStats] = useState<ShedStatistics[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedShed, setSelectedShed] = useState<Shed | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: keyof Shed; direction: 'asc' | 'desc' } | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ShedFormData>({
        resolver: zodResolver(shedSchema),
    })

    // Load data
    const loadData = async () => {
        try {
            setIsLoading(true)
            const [shedsData, statsData] = await Promise.all([
                getSheds(),
                getShedStatistics()
            ])
            setSheds(shedsData)
            setStats(statsData)
        } catch (error) {
            console.error('Error loading sheds:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // Form handlers
    const openCreateModal = () => {
        setSelectedShed(null)
        reset({
            name: '',
            variant: 'W',
            capacity: 0,
            number_of_birds: 0,
            description: '',
            is_active: true
        })
        setIsModalOpen(true)
    }

    const openEditModal = (shed: Shed) => {
        setSelectedShed(shed)
        setValue('name', shed.name)
        setValue('variant', shed.variant)
        setValue('capacity', shed.capacity)
        setValue('number_of_birds', shed.number_of_birds)
        setValue('description', shed.description || '')
        setValue('is_active', shed.is_active)
        setIsModalOpen(true)
    }

    const onSubmit = async (data: ShedFormData) => {
        try {
            if (selectedShed) {
                await updateShed(selectedShed.id, data)
            } else {
                await createShed(data)
            }
            await loadData()
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error saving shed:', error)
        }
    }

    const handleDelete = async () => {
        if (!selectedShed) return
        try {
            await deleteShed(selectedShed.id)
            await loadData()
            setIsDeleteModalOpen(false)
            setSelectedShed(null)
        } catch (error) {
            console.error('Error deleting shed:', error)
        }
    }

    // Filter sheds
    const filteredSheds = sheds.filter(shed =>
        shed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shed.variant.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const columns = [
        {
            key: 'name',
            header: 'Shed Name',
            sortable: true,
            render: (shed: Shed) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <Home className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{shed.name}</span>
                </div>
            )
        },
        {
            key: 'variant',
            header: 'Variant',
            sortable: true,
            render: (shed: Shed) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${shed.variant === 'W'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                    {shed.variant === 'W' ? 'White' : 'Brown'}
                </span>
            )
        },
        {
            key: 'capacity',
            header: 'Capacity',
            sortable: true,
            render: (shed: Shed) => (
                <span>{shed.capacity.toLocaleString()} birds</span>
            )
        },
        {
            key: 'stats',
            header: 'Current Month Prod.',
            render: (shed: Shed) => {
                const shedStats = stats.find(s => s.id === shed.id)
                return shedStats ? (
                    <div className="flex flex-col text-sm">
                        <span className="text-gray-900 dark:text-white font-medium">{shedStats.current_month_crates || 0} crates</span>
                        <span className="text-gray-500 text-xs">{shedStats.current_month_mortality || 0} mortality</span>
                    </div>
                ) : '-'
            }
        },
        {
            key: 'is_active',
            header: 'Status',
            sortable: true,
            render: (shed: Shed) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${shed.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${shed.is_active ? 'bg-green-500' : 'bg-gray-500'}`} />
                    {shed.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (shed: Shed) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openEditModal(shed); }}
                        className="h-8 w-8 p-0"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShed(shed);
                            setIsDeleteModalOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shed Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your poultry sheds and assign variants</p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Shed
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>All Sheds</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search sheds..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table
                        data={filteredSheds}
                        columns={columns}
                        keyExtractor={(shed) => shed.id}
                        isLoading={isLoading}
                        className="border-0 rounded-none border-t"
                        onRowClick={openEditModal}
                    />
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedShed ? 'Edit Shed' : 'Add New Shed'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Shed Name"
                        placeholder="e.g. M1"
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Variant"
                            options={[
                                { value: 'W', label: 'White' },
                                { value: 'B', label: 'Brown' }
                            ]}
                            error={errors.variant?.message}
                            {...register('variant')}
                        />

                        <Input
                            label="Capacity"
                            type="number"
                            error={errors.capacity?.message}
                            {...register('capacity', { valueAsNumber: true })}
                        />
                    </div>

                    <Input
                        label="Number of Birds"
                        type="number"
                        placeholder="Total birds currently in shed"
                        error={errors.number_of_birds?.message}
                        {...register('number_of_birds', { valueAsNumber: true })}
                    />

                    <Input
                        label="Description"
                        placeholder="Optional description"
                        error={errors.description?.message}
                        {...register('description')}
                    />

                    <div className="mt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            {selectedShed ? 'Save Changes' : 'Create Shed'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Shed"
                message={`Are you sure you want to delete shed "${selectedShed?.name}"? This action cannot be undone.`}
                variant="danger"
            />
        </div>
    )
}
