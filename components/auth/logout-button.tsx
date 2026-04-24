'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      suppressHydrationWarning
      className="flex flex-col items-center py-2.5 gap-1 flex-1 text-gray-500 transition-colors"
    >
      <LogOut size={22} strokeWidth={2} />
      <span className="text-xs font-semibold">Logout</span>
    </button>
  )
}
