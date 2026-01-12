import { getSupabaseClient } from '../supabase'
import { DailyEntry, DailyEntryInsert, DailyEntryUpdate, DailyEntryWithRelations } from '../database.types'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

const supabase = getSupabaseClient() as any

export async function getDailyEntries(options?: {
    shedId?: string
    workerId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
}): Promise<DailyEntryWithRelations[]> {
    let query = supabase
        .from('daily_entries')
        .select('*, shed:sheds(*), worker:profiles(*)')
        .order('entry_date', { ascending: false })

    if (options?.shedId) {
        query = query.eq('shed_id', options.shedId)
    }
    if (options?.workerId) {
        query = query.eq('worker_id', options.workerId)
    }
    if (options?.startDate) {
        query = query.gte('entry_date', options.startDate)
    }
    if (options?.endDate) {
        query = query.lte('entry_date', options.endDate)
    }
    if (options?.limit) {
        query = query.limit(options.limit)
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options?.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data || []
}

export async function getDailyEntryById(id: string): Promise<DailyEntryWithRelations | null> {
    const { data, error } = await supabase
        .from('daily_entries')
        .select('*, shed:sheds(*), worker:profiles(*)')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
    }
    return data
}

export async function createDailyEntry(entry: DailyEntryInsert): Promise<DailyEntry> {
    const { data, error } = await supabase
        .from('daily_entries')
        .insert(entry as any)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function updateDailyEntry(id: string, updates: DailyEntryUpdate): Promise<DailyEntry> {
    const { data, error } = await supabase
        .from('daily_entries')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function deleteDailyEntry(id: string): Promise<void> {
    const { error } = await supabase
        .from('daily_entries')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
}

export async function getEntriesForMonth(month: Date, shedId?: string): Promise<DailyEntry[]> {
    const startDate = format(startOfMonth(month), 'yyyy-MM-dd')
    const endDate = format(endOfMonth(month), 'yyyy-MM-dd')

    let query = supabase
        .from('daily_entries')
        .select('*')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true })

    if (shedId) {
        query = query.eq('shed_id', shedId)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data || []
}

export async function getWorkerEntries(workerId: string, limit?: number): Promise<DailyEntryWithRelations[]> {
    let query = supabase
        .from('daily_entries')
        .select('*, shed:sheds(*)')
        .eq('worker_id', workerId)
        .order('entry_date', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data || []
}

export async function checkEntryExists(shedId: string, date: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('shed_id', shedId)
        .eq('entry_date', date)
        .maybeSingle()

    if (error) throw new Error(error.message)
    return !!data
}

export async function getLatestEntry(shedId: string): Promise<DailyEntry | null> {
    const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('shed_id', shedId)
        .order('entry_date', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)
    return data
}

export async function getEntriesCount(options?: {
    shedId?: string
    workerId?: string
    startDate?: string
    endDate?: string
}): Promise<number> {
    let query = supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })

    if (options?.shedId) {
        query = query.eq('shed_id', options.shedId)
    }
    if (options?.workerId) {
        query = query.eq('worker_id', options.workerId)
    }
    if (options?.startDate) {
        query = query.gte('entry_date', options.startDate)
    }
    if (options?.endDate) {
        query = query.lte('entry_date', options.endDate)
    }

    const { count, error } = await query

    if (error) throw new Error(error.message)
    return count || 0
}
