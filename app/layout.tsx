import type { Metadata, Viewport } from 'next'
import { Noto_Sans } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/bottom-nav'
import { Toaster } from '@/components/ui/sonner'
import { SwRegister } from '@/components/sw-register'

const notoSans = Noto_Sans({ variable: '--font-noto-sans', subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'DOMS',
  description: 'Distributor Order Management System',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DOMS',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${notoSans.variable} h-full`}>
      <body className={`min-h-full bg-gray-50 antialiased ${notoSans.className}`}>
        <main className="pb-20 max-w-2xl mx-auto">
          {children}
        </main>
        <BottomNav />
        <Toaster />
        <SwRegister />
      </body>
    </html>
  )
}
