'use client'

import { useEffect, useState } from 'react'
import {
    getWorkers,
    getSheds,
    getWorkerAssignments,
    assignWorkerToShed,
    removeWorkerFromShed
} from '@/lib/api'
import { Profile, Shed, WorkerAssignment } from '@/lib/database.types'
import {
    Table,
    Button,
    Modal,
    Select,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    ConfirmModal
} from '@/components/ui'
import { Users, Plus, Trash2, Home } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export default function WorkersPage() {
    const [workers, setWorkers] = useState<Profile[]>([])
    const [sheds, setSheds] = useState<Shed[]>([])
    const [assignments, setAssignments] = useState<WorkerAssignment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>('')
    const [selectedShedId, setSelectedShedId] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user } = useAuth()

    const loadData = async () => {
        try {
            setIsLoading(true)
            const [workersData, shedsData] = await Promise.all([
                getWorkers(),
                getSheds()
            ])
            setWorkers(workersData)
            setSheds(shedsData)

            // Fetch assignments for all workers
            // In a real app with many workers, we would optimize this
            const assignmentsPromises = workersData.map(w => getWorkerAssignments(w.id))
            const allAssignments = (await Promise.all(assignmentsPromises)).flat()
            setAssignments(allAssignments)

        } catch (error) {
            console.error('Error loading workers:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleAssign = async () => {
        if (!selectedWorkerId || !selectedShedId) return

        try {
            setIsSubmitting(true)
            await assignWorkerToShed({
                worker_id: selectedWorkerId,
                shed_id: selectedShedId,
                assigned_by: user?.id
            })
            await loadData()
            setIsAssignModalOpen(false)
            setSelectedShedId('')
        } catch (error) {
            console.error('Error assigning worker:', error)
            alert('Failed to assign worker. They may already be assigned to this shed.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRemoveAssignment = async (workerId: string, shedId: string) => {
        try {
            await removeWorkerFromShed(workerId, shedId)
            await loadData()
        } catch (error) {
            console.error('Error removing assignment:', error)
        }
    }

    const columns = [
        {
            key: 'full_name',
            header: 'Worker Name',
            sortable: true,
            render: (worker: Profile) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-xs font-bold">
                        {worker.full_name?.charAt(0) || worker.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{worker.full_name || 'Unnamed Worker'}</p>
                        <p className="text-xs text-gray-500">{worker.email}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'assignments',
            header: 'Assigned Sheds',
            render: (worker: Profile) => {
                const workerAssignments = assignments.filter(a => a.worker_id === worker.id && a.is_active)
                return (
                    <div className="flex flex-wrap gap-2">
                        {workerAssignments.length > 0 ? (
                            workerAssignments.map(assignment => {
                                const shed = (assignment as any).shed
                                return (
                                    <span
                                        key={assignment.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium"
                                    >
                                        <Home className="w-3 h-3 text-gray-400" />
                                        {shed?.name}
                                        <button
                                            onClick={() => handleRemoveAssignment(worker.id, shed.id)}
                                            className="ml-1 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </span>
                                )
                            })
                        ) : (
                            <span className="text-gray-400 text-sm italic">No assignments</span>
                        )}
                    </div>
                )
            }
        },
        {
            key: 'joined',
            header: 'Joined',
            render: (worker: Profile) => new Date(worker.created_at).toLocaleDateString()
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (worker: Profile) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setSelectedWorkerId(worker.id)
                        setIsAssignModalOpen(true)
                    }}
                >
                    <Plus className="w-4 h-4 mr-1" /> Assign Shed
                </Button>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Worker Management</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage farm workers and their shed assignments</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table
                        data={workers}
                        columns={columns}
                        keyExtractor={(worker) => worker.id}
                        isLoading={isLoading}
                        emptyMessage="No workers found. Create worker accounts via Supabase auth."
                        className="border-0 rounded-none"
                    />
                </CardContent>
            </Card>

            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Assign Shed"
                description="Select a shed to assign to this worker"
                size="sm"
            >
                <div className="space-y-4">
                    <Select
                        label="Select Shed"
                        placeholder="Choose a shed..."
                        options={sheds
                            .filter(s => s.is_active)
                            .map(s => ({ value: s.id, label: `${s.name} (${s.variant === 'W' ? 'White' : 'Brown'})` }))}
                        value={selectedShedId}
                        onChange={(e) => setSelectedShedId(e.target.value)}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedShedId || isSubmitting}
                            isLoading={isSubmitting}
                        >
                            Assign Worker
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
