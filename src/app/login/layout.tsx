import { redirect } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export default async function Layout({ children }: { children: React.ReactNode }) {
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
        redirect('/')
    }

    return <>{children}</>
}
