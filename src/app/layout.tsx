import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
    title: 'Poultry Farm Management System',
    description: 'Track production, birds, mortality, and shed performance for your poultry farm',
    keywords: ['poultry', 'farm', 'management', 'production', 'eggs', 'birds'],
    authors: [{ name: 'Uncle Mawuli Farm' }],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="min-h-screen">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
