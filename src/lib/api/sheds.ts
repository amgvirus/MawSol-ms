import { getSupabaseClient } from '../supabase'
import { Shed, ShedInsert, ShedUpdate, ShedStatistics } from '../database.types'

const supabase = getSupabaseClient() as any

export async function getSheds(): Promise<Shed[]> {
    const { data, error } = await supabase
        .from('sheds')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

export async function getShedById(id: string): Promise<Shed | null> {
    const { data, error } = await supabase
        .from('sheds')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
    }
    return data
}

export async function getShedStatistics(): Promise<ShedStatistics[]> {
    const { data, error } = await supabase
        .from('shed_statistics')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

export async function createShed(shed: ShedInsert): Promise<Shed> {
    const { data, error } = await supabase
        .from('sheds')
        .insert(shed as any)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function updateShed(id: string, updates: ShedUpdate): Promise<Shed> {
    const { data, error } = await supabase
        .from('sheds')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function deleteShed(id: string): Promise<void> {
    const { error } = await supabase
        .from('sheds')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
}

export async function getShedsByVariant(variant: 'W' | 'B'): Promise<Shed[]> {
    const { data, error } = await supabase
        .from('sheds')
        .select('*')
        .eq('variant', variant)
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

export async function getActiveSheds(): Promise<Shed[]> {
    const { data, error } = await supabase
        .from('sheds')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

export async function getAssignedSheds(workerId: string): Promise<Shed[]> {
    const { data, error } = await supabase
        .from('worker_assignments')
        .select('shed:sheds(*)')
        .eq('worker_id', workerId)
        .eq('is_active', true)

    if (error) throw new Error(error.message)
    return (data || []).map((item: any) => item.shed as unknown as Shed).filter(Boolean)
}
