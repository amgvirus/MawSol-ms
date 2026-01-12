import { getSupabaseClient } from '../supabase'
import { Profile, WorkerAssignment, WorkerStatistics, WorkerAssignmentInsert } from '../database.types'

const supabase = getSupabaseClient() as any

export async function getWorkers(): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')
        .order('full_name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

export async function getWorkerById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'worker')
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
    }
    return data
}

export async function getWorkerStatistics(): Promise<WorkerStatistics[]> {
    const { data, error } = await supabase
        .from('worker_statistics')
        .select('*')
        .order('full_name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

export async function getWorkerAssignments(workerId: string): Promise<WorkerAssignment[]> {
    const { data, error } = await supabase
        .from('worker_assignments')
        .select('*, shed:sheds(*)')
        .eq('worker_id', workerId)
        .eq('is_active', true)

    if (error) throw new Error(error.message)
    return data || []
}

export async function assignWorkerToShed(assignment: WorkerAssignmentInsert): Promise<WorkerAssignment> {
    const { data, error } = await supabase
        .from('worker_assignments')
        .insert(assignment as any)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function removeWorkerFromShed(workerId: string, shedId: string): Promise<void> {
    const { error } = await supabase
        .from('worker_assignments')
        .update({ is_active: false } as any)
        .eq('worker_id', workerId)
        .eq('shed_id', shedId)

    if (error) throw new Error(error.message)
}

export async function deleteWorkerAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
        .from('worker_assignments')
        .delete()
        .eq('id', assignmentId)

    if (error) throw new Error(error.message)
}

export async function getWorkersForShed(shedId: string): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('worker_assignments')
        .select('worker:profiles(*)')
        .eq('shed_id', shedId)
        .eq('is_active', true)

    if (error) throw new Error(error.message)
    return (data || []).map((item: any) => item.worker as unknown as Profile).filter(Boolean)
}

export async function updateWorkerRole(userId: string, role: 'admin' | 'worker'): Promise<Profile> {
    const { data, error } = await supabase
        .from('profiles')
        .update({ role } as any)
        .eq('id', userId)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })
        .order('full_name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}
