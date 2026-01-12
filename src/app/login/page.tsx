'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/lib/auth'
import { loginSchema, LoginFormData } from '@/lib/validations'
import { Button, Input, Card } from '@/components/ui'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { signIn } = useAuth()
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await signIn(data.email, data.password)

            if (error) {
                throw error
            }

            // Redirect handled by AuthContext/layout
        } catch (err: any) {
            setError(err.message || 'Failed to sign in')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 mb-6 group hover:scale-105 transition-transform duration-300">
                        <span className="text-4xl group-hover:rotate-12 transition-transform duration-300">🐔</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400">
                        Sign in to manage your poultry farm
                    </p>
                </div>

                <Card className="border-gray-700/50 bg-gray-800/50 backdrop-blur-xl shadow-glass-dark">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                                <span className="mt-0.5">⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                error={errors.email?.message}
                                {...register('email')}
                                className="bg-gray-900/50 border-gray-700 focus:border-primary-500 text-white placeholder:text-gray-600"
                            />

                            <div className="space-y-1">
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    error={errors.password?.message}
                                    {...register('password')}
                                    className="bg-gray-900/50 border-gray-700 focus:border-primary-500 text-white placeholder:text-gray-600"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-3 text-lg font-semibold shadow-xl shadow-primary-500/20"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </Card>

                <p className="mt-8 text-center text-sm text-gray-500">
                    Done with care via <span className="text-gray-400 font-medium">Poultry Farm System</span>
                </p>
            </div>
        </div>
    )
}
