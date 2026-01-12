'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { AuthGuard } from '@/lib/auth'
import {
    ClipboardList,
    History,
    LogOut,
    Menu,
    X,
} from 'lucide-react'

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const { signOut, user, profile } = useAuth()

    const navigation = [
        { name: 'Daily Entry', href: '/worker', icon: ClipboardList },
        { name: 'My History', href: '/worker/history', icon: History },
    ]

    return (
        <AuthGuard requiredRole="worker">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/50 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    <div className="flex flex-col h-full">
                        {/* Logo */}
                        <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100 dark:border-gray-700/50">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-white text-lg shadow-lg shadow-secondary-500/20">
                                🐔
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white tracking-tight">
                                Worker<span className="text-secondary-500">Portal</span>
                            </span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="ml-auto lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="px-6 py-6">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white font-bold text-sm">
                                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {profile?.full_name || 'Farm Worker'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            'sidebar-item group',
                                            isActive ? 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        )}
                                    >
                                        <item.icon className={cn(
                                            'w-5 h-5 transition-colors',
                                            isActive ? 'text-secondary-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                                        )} />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Logout */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700/50">
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors group"
                            >
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <span className="font-bold text-gray-900 dark:text-white">
                                Worker<span className="text-secondary-500">Portal</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-900">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    )
}
