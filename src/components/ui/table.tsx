'use client'

import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Column<T> {
    key: keyof T | string
    header: string
    render?: (item: T) => ReactNode
    sortable?: boolean
    className?: string
}

interface TableProps<T> {
    data: T[]
    columns: Column<T>[]
    keyExtractor: (item: T) => string
    isLoading?: boolean
    emptyMessage?: string
    pagination?: {
        currentPage: number
        totalPages: number
        onPageChange: (page: number) => void
        pageSize?: number
        totalItems?: number
    }
    onRowClick?: (item: T) => void
    className?: string
}

export function Table<T>({
    data,
    columns,
    keyExtractor,
    isLoading = false,
    emptyMessage = 'No data available',
    pagination,
    onRowClick,
    className,
}: TableProps<T>) {
    const [sortColumn, setSortColumn] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(columnKey)
            setSortDirection('asc')
        }
    }

    const getValue = (item: T, key: string): any => {
        const keys = key.split('.')
        let value: any = item
        for (const k of keys) {
            value = value?.[k]
        }
        return value
    }

    const sortedData = sortColumn
        ? [...data].sort((a, b) => {
            const aVal = getValue(a, sortColumn)
            const bVal = getValue(b, sortColumn)

            if (aVal === bVal) return 0
            if (aVal === null || aVal === undefined) return 1
            if (bVal === null || bVal === undefined) return -1

            const comparison = aVal < bVal ? -1 : 1
            return sortDirection === 'asc' ? comparison : -comparison
        })
        : data

    return (
        <div className={cn('overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700', className)}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className={cn(
                                        'px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                                        column.sortable && 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none',
                                        column.className
                                    )}
                                    onClick={() => column.sortable && handleSort(String(column.key))}
                                >
                                    <span className="flex items-center gap-2">
                                        {column.header}
                                        {column.sortable && sortColumn === column.key && (
                                            <span className="text-primary-500">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((item) => (
                                <tr
                                    key={keyExtractor(item)}
                                    className={cn(
                                        'transition-colors',
                                        onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    )}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={String(column.key)}
                                            className={cn(
                                                'px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap',
                                                column.className
                                            )}
                                        >
                                            {column.render
                                                ? column.render(item)
                                                : getValue(item, String(column.key)) ?? '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {pagination.totalItems !== undefined && (
                            <>
                                Showing{' '}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {(pagination.currentPage - 1) * (pagination.pageSize || 10) + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {Math.min(pagination.currentPage * (pagination.pageSize || 10), pagination.totalItems)}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {pagination.totalItems}
                                </span>{' '}
                                results
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => pagination.onPageChange(1)}
                            disabled={pagination.currentPage === 1}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>

                        <button
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(pagination.totalPages)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
