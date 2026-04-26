'use client'

import { SidebarMenu } from '@/components/sidebar-menu'
import { LogoutButton } from '@/components/auth/logout-button'

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3">
      <SidebarMenu />
      <h1 className="text-xl font-bold text-gray-900 flex-1">{title}</h1>
      {children}
      <LogoutButton />
    </div>
  )
}
