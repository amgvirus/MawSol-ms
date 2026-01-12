'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-context'
import { UserRole } from '../database.types'

interface AuthGuardProps {
    children: React.ReactNode
    requiredRole?: UserRole | UserRole[]
    redirectTo?: string
}

export function AuthGuard({
    children,
    requiredRole,
    redirectTo = '/login'
}: AuthGuardProps) {
    const { user, role, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isLoading) return

        // Not authenticated
        if (!user) {
            router.push(redirectTo)
            return
        }

        // Check role if required
        if (requiredRole && role) {
            const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
            if (!allowedRoles.includes(role)) {
                // Redirect to appropriate dashboard based on actual role
                if (role === 'admin') {
                    router.push('/admin')
                } else {
                    router.push('/worker')
                }
            }
        }
    }, [user, role, isLoading, requiredRole, redirectTo, router])

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 animate-pulse">Loading...</p>
                </div>
            </div>
        )
    }

    // Not authenticated
    if (!user) {
        return null
    }

    // Check role
    if (requiredRole && role) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        if (!allowedRoles.includes(role)) {
            return null
        }
    }

    return <>{children}</>
}

// HOC for protecting pages
export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    requiredRole?: UserRole | UserRole[]
) {
    return function ProtectedComponent(props: P) {
        return (
            <AuthGuard requiredRole={requiredRole}>
                <Component {...props} />
            </AuthGuard>
        )
    }
}
