'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '../supabase'
import { Profile, UserRole } from '../database.types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    role: UserRole | null
    isLoading: boolean
    isAdmin: boolean
    isWorker: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const supabase = getSupabaseClient()

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
                return null
            }
            return data as Profile
        } catch (error) {
            console.error('Error in fetchProfile:', error)
            return null
        }
    }

    const refreshProfile = async () => {
        if (user) {
            const profileData = await fetchProfile(user.id)
            setProfile(profileData)
        }
    }

    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession()
                setSession(initialSession)
                setUser(initialSession?.user ?? null)

                if (initialSession?.user) {
                    const profileData = await fetchProfile(initialSession.user.id)
                    setProfile(profileData)
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                setSession(currentSession)
                setUser(currentSession?.user ?? null)

                if (currentSession?.user) {
                    // Small delay to ensure profile is created by trigger
                    setTimeout(async () => {
                        const profileData = await fetchProfile(currentSession.user.id)
                        setProfile(profileData)
                    }, 100)
                } else {
                    setProfile(null)
                }

                setIsLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            return { error: error ? new Error(error.message) : null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'worker') => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                },
            })
            return { error: error ? new Error(error.message) : null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    const role = profile?.role ?? null
    const isAdmin = role === 'admin'
    const isWorker = role === 'worker'

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                role,
                isLoading,
                isAdmin,
                isWorker,
                signIn,
                signUp,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
