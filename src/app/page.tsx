'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
    const { user, role, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isLoading) return

        if (!user) {
            router.push('/login')
        } else if (role === 'admin') {
            router.push('/admin')
        } else if (role === 'worker') {
            router.push('/worker')
        }
    }, [user, role, isLoading, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="text-center">
                <div className="mb-8">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <span className="text-4xl">🐔</span>
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">
                    Poultry Farm Management
                </h1>
                <div className="flex items-center justify-center gap-3 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        </div>
    )
}
