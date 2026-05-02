'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, Bell, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type UserInfo = {
  name: string
  email: string
  avatarUrl: string | null
  isAdmin: boolean
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
  return <span className="text-sm font-bold text-white select-none">{initials}</span>
}

export function UserAvatar() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      setUser({
        name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
        email: user.email ?? '',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        isAdmin: profile?.is_admin ?? false,
      })
    })
  }, [])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden ring-2 ring-white hover:ring-blue-200 active:scale-90 transition-all"
      >
        {user?.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.name} width={36} height={36} className="w-full h-full object-cover" unoptimized />
        ) : (
          <Initials name={user?.name ?? '?'} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* User info */}
          <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-blue-100">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user?.name ?? ''} width={48} height={48} className="w-full h-full object-cover" unoptimized />
              ) : (
                <Initials name={user?.name ?? '?'} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Bell size={16} className="text-gray-400" />
              Notification Settings
            </Link>

            {user?.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ShieldCheck size={16} className="text-gray-400" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 transition-colors text-sm font-bold disabled:opacity-40"
            >
              <LogOut size={16} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
