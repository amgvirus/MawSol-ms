import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

// Singleton instance for client-side usage
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
    if (!supabaseInstance) {
        supabaseInstance = createClient()
    }
    return supabaseInstance
}
