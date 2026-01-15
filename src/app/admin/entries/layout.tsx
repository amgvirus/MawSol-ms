import { AuthGuard } from '@/lib/auth'

export default function EntriesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard requiredRole="admin">
            {children}
        </AuthGuard>
    )
}
