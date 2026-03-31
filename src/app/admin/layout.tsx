'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { AuthGuard } from '@/lib/auth'
import {
    LayoutDashboard,
    Home,
    Users,
    BarChart3,
    FileText,
    LogOut,
    Menu,
    X,
    Search,
    Bell,
    MessageSquare,
    Settings,
    ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()
    const { signOut, user, profile } = useAuth()
    
    // For live clock update (to match UI exactly)
    const [currentTime, setCurrentTime] = useState(new Date())
    
    useEffect(() => {
        setMounted(true)
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Sheds', href: '/admin/sheds', icon: Home },
        { name: 'Workers', href: '/admin/workers', icon: Users },
        { name: 'Production', href: '/admin/production', icon: BarChart3 },
        { name: 'Entries', href: '/admin/entries', icon: FileText },
        { name: 'Reports', href: '/admin/reports', icon: FileText },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]

    if (!mounted) return null

    return (
        <AuthGuard requiredRole="admin">
            {/* The main background: deep dark blue-slash slate like in the design */}
            <div className="min-h-screen bg-[#0B0F19] text-gray-200 flex font-sans selection:bg-green-500/30">
                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-[#0B0F19]/80 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-50 w-[260px] bg-[#131826] border-r border-[#1e2532] shadow-[4px_0_24px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col items-center py-6',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-8 px-6 w-full relative">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute right-4 top-0 lg:hidden text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold italic shadow-[0_4px_16px_rgba(59,130,246,0.4)] mb-3 relative overflow-hidden group">
                            {/* Subtle animated sheen */}
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:-translate-y-full transition-transform duration-700"></div>
                            A
                        </div>
                        <span className="font-bold text-gray-300 text-xs tracking-widest uppercase mb-1">
                            Admin Panel
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 w-full px-4 mb-6 space-y-1.5 overflow-y-auto scrollbar-hide">
                        {navigation.map((item) => {
                            // Map generic URLs to dashboard paths. If pathname is /admin and item is /admin, it's active.
                            // But wait, the image shows "Analytics" active. We can leave Dashboard active or Analytics active based on path.
                            const isActive = pathname === item.href || (pathname === '/admin' && item.name === 'Dashboard')
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative',
                                        isActive 
                                            ? 'bg-gradient-to-r from-[rgba(255,255,255,0.06)] to-transparent text-white border-[0.5px] border-[rgba(255,255,255,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.2)]' 
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-[rgba(255,255,255,0.03)]'
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#22C55E] rounded-r-md shadow-[0_0_8px_#22C55E]"></div>
                                    )}
                                    <item.icon className={cn(
                                        'w-5 h-5 transition-colors',
                                        isActive ? 'text-[#22C55E]' : 'text-gray-500 group-hover:text-gray-400'
                                    )} />
                                    <span className="font-medium text-[14px]">{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Bottom Profile and Logout */}
                    <div className="w-full px-4 pb-4 mt-auto">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm mb-3 group hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer">
                            <div className="w-9 h-9 rounded-full bg-cover bg-center bg-[#1e2532] border border-[#2e3646] flex items-center justify-center text-white text-sm font-medium relative">
                                {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'D'}
                                {/* Online Status Dot - Green */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] border-[2.5px] border-[#131826] rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-white truncate">
                                    {profile?.full_name || 'Admin User'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => signOut()}
                            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                        >
                            <LogOut className="w-[18px] h-[18px] text-gray-500 group-hover:text-gray-400" />
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    {/* Header */}
                    <header className="h-[72px] px-6 md:px-8 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] bg-[#0B0F19]/80 backdrop-blur-md z-10 sticky top-0">
                        {/* Mobile Menu Toggle & Date */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-gray-400 hover:text-white transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            
                            <div className="hidden sm:block text-[13px] text-gray-400 font-medium tracking-wide">
                                {format(currentTime, 'MMMM d, yyyy')} <span className="mx-1 text-gray-600">|</span> {format(currentTime, 'h:mm a')}
                            </div>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-5 md:gap-7">
                            {/* Search */}
                            <div className="relative hidden md:flex items-center">
                                <Search className="w-4 h-4 text-gray-500 absolute left-3.5" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="h-[38px] w-[240px] lg:w-[280px] bg-[#131826] border border-[#1e2532] hover:border-gray-600 rounded-full pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#22C55E]/50 focus:ring-1 focus:ring-[#22C55E]/30 transition-all shadow-sm"
                                />
                            </div>

                            {/* Notifications & Messages */}
                            <div className="flex items-center gap-4 text-gray-400">
                                <button className="hover:text-white transition-colors relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)]">
                                    <Bell className="w-5 h-5" />
                                    {/* Red dot alert */}
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-[2px] border-[#0B0F19]"></span>
                                </button>
                                <button className="hover:text-white transition-colors relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)]">
                                    <MessageSquare className="w-[18px] h-[18px]" />
                                </button>
                            </div>

                            {/* Profile Dropdown */}
                            <div className="flex items-center gap-2.5 cursor-pointer group pl-2 md:border-l border-[rgba(255,255,255,0.08)]">
                                <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm overflow-hidden mix-blend-overlay border border-[#2e3646]">
                                    {/* Mock image could go here, fallback to letter */}
                                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'D'}
                                </div>
                                <span className="text-[14px] font-medium text-gray-300 hidden lg:block group-hover:text-white transition-colors">
                                    {profile?.full_name || 'Admin User'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-400 hidden lg:block transition-transform group-hover:translate-y-0.5" />
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                        <div className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
            {/* Global style for scrollbar inside layout */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </AuthGuard>
    )
}
