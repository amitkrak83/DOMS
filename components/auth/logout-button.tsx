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
      className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-red-500 active:scale-90 transition-all text-sm font-medium"
      aria-label="Logout"
    >
      <LogOut size={18} strokeWidth={2} />
      <span>Logout</span>
    </button>
  )
}
