import type { Metadata } from 'next'
import { Noto_Sans } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/bottom-nav'
import { Toaster } from '@/components/ui/sonner'

const notoSans = Noto_Sans({ variable: '--font-noto-sans', subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'DOMS - Distributor Order Management',
  description: 'Distributor Order Management System',
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
      </body>
    </html>
  )
}
