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
        .select('*, shed:sheds(*), worker:profiles!worker_id(*)')
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
        .select('*, shed:sheds(*), worker:profiles!worker_id(*)')
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

export async function correctDailyEntry(
    id: string,
    updates: DailyEntryUpdate,
    adminId: string,
    originalEntry?: DailyEntryWithRelations
): Promise<DailyEntry> {
    // Use provided entry or fetch it
    let currentEntry = originalEntry
    if (!currentEntry) {
        try {
            currentEntry = await getDailyEntryById(id) || undefined
        } catch (e) {
            console.error('Failed to fetch entry:', e)
            throw e
        }
    }
    
    if (!currentEntry) {
        throw new Error('Entry not found')
    }

    // Store original values if not already corrected
    const originalValues = currentEntry.original_values || {
        production_crates: currentEntry.production_crates,
        production_birds: currentEntry.production_birds,
        total_birds: currentEntry.total_birds,
        non_production: currentEntry.non_production,
        mortality: currentEntry.mortality,
        notes: currentEntry.notes,
    }

    // Build the update payload - only include updatable fields
    const updatePayload: any = {
        production_crates: Number(updates.production_crates) || 0,
        production_birds: Number(updates.production_birds) || 0,
        total_birds: Number(updates.total_birds) || 0,
        non_production: Number(updates.non_production) || 0,
        mortality: Number(updates.mortality) || 0,
        notes: updates.notes || '',
        corrected_by: adminId,
        corrected_at: new Date().toISOString(),
    }

    console.log('=== API correctDailyEntry ===')
    console.log('Entry ID:', id)
    console.log('Admin ID:', adminId)
    console.log('Update payload:', JSON.stringify(updatePayload, null, 2))

    // Update entry with correction metadata
    const { data, error } = await supabase
        .from('daily_entries')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('=== Supabase Update Error ===')
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', (error as any).hint)
        throw new Error(`Failed to update entry: ${error.message}`)
    }
    
    console.log('=== Update Successful ===')
    console.log('Returned data:', data)
    return data
}

export async function getCorrectedEntries(options?: {
    shedId?: string
    workerId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
}): Promise<DailyEntryWithRelations[]> {
    let query = supabase
        .from('daily_entries')
        .select('*, shed:sheds(*), worker:profiles(*), corrected_by_profile:corrected_by(full_name, email)')
        .not('corrected_by', 'is', null)
        .order('corrected_at', { ascending: false })

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

