import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
    children: ReactNode
    className?: string
    hover?: boolean
    gradient?: boolean
}

export function Card({ children, className, hover = false, gradient = false }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl p-6',
                'bg-white dark:bg-gray-800/50',
                'border border-gray-100 dark:border-gray-700/50',
                'shadow-glass dark:shadow-glass-dark',
                'backdrop-blur-glass',
                hover && 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
                gradient && 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900',
                className
            )}
        >
            {children}
        </div>
    )
}

interface CardHeaderProps {
    children: ReactNode
    className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={cn('mb-4', className)}>
            {children}
        </div>
    )
}

interface CardTitleProps {
    children: ReactNode
    className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
    return (
        <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}>
            {children}
        </h3>
    )
}

interface CardDescriptionProps {
    children: ReactNode
    className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return (
        <p className={cn('text-sm text-gray-500 dark:text-gray-400 mt-1', className)}>
            {children}
        </p>
    )
}

interface CardContentProps {
    children: ReactNode
    className?: string
}

export function CardContent({ children, className }: CardContentProps) {
    return (
        <div className={cn(className)}>
            {children}
        </div>
    )
}

interface CardFooterProps {
    children: ReactNode
    className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
    return (
        <div className={cn('mt-4 pt-4 border-t border-gray-100 dark:border-gray-700', className)}>
            {children}
        </div>
    )
}

interface StatCardProps {
    title: string
    value: string | number
    icon?: ReactNode
    change?: {
        value: number
        type: 'increase' | 'decrease'
    }
    className?: string
}

export function StatCard({ title, value, icon, change, className }: StatCardProps) {
    return (
        <Card className={cn('', className)} hover>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {change && (
                        <p
                            className={cn(
                                'mt-2 text-sm font-medium flex items-center',
                                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                            )}
                        >
                            {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}%
                            <span className="text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    )
}
