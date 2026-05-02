'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Shield, ShieldOff, UserX, User } from 'lucide-react'

type Profile = {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}

type NotifPref = {
  new_order: boolean
  payment_recorded: boolean
  order_delivered: boolean
}

const NOTIF_CATEGORIES = [
  { key: 'new_order',        label: 'New Order'        },
  { key: 'payment_recorded', label: 'Payment Received'  },
  { key: 'order_delivered',  label: 'Order Delivered'   },
] as const

export function UsersPanel({
  initialProfiles,
  superAdminEmail,
  initialNotifPrefs,
}: {
  initialProfiles: Profile[]
  superAdminEmail: string
  initialNotifPrefs: Record<string, NotifPref>
}) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [notifPrefs, setNotifPrefs] = useState<Record<string, NotifPref>>(initialNotifPrefs)
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleAdmin(profile: Profile) {
    if (profile.email === superAdminEmail) { toast.error('Cannot change super-admin role'); return }
    const next = !profile.is_admin
    setLoading(profile.id + '-admin')
    const { error } = await supabase.from('profiles').update({ is_admin: next }).eq('id', profile.id)
    setLoading(null)
    if (error) { toast.error('Failed to update role'); return }
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_admin: next } : p))
    toast.success(next ? `${profile.email} is now admin` : `${profile.email} admin removed`)
  }

  async function revokeAccess(profile: Profile) {
    if (profile.email === superAdminEmail) { toast.error('Cannot revoke super-admin access'); return }
    if (!confirm(`Revoke access for ${profile.email}?`)) return
    setLoading(profile.id + '-revoke')
    const { error } = await supabase.from('allowed_emails').delete().eq('email', profile.email)
    setLoading(null)
    if (error) { toast.error('Failed to revoke access'); return }
    setProfiles(prev => prev.filter(p => p.id !== profile.id))
    toast.success(`Access revoked for ${profile.email}`)
  }

  async function toggleNotif(userId: string, key: keyof NotifPref) {
    const current = notifPrefs[userId] ?? { new_order: true, payment_recorded: true, order_delivered: true }
    const updated = { ...current, [key]: !current[key] }
    setNotifPrefs(prev => ({ ...prev, [userId]: updated }))
    await (supabase as any).from('notification_preferences').upsert({
      user_id: userId, ...updated, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  if (profiles.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
        <User size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No users have signed in yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {profiles.map(profile => {
        const pref = notifPrefs[profile.id] ?? { new_order: true, payment_recorded: true, order_delivered: true }
        return (
          <div key={profile.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5 space-y-3">
            {/* User info + role/revoke buttons */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-gray-900 truncate">{profile.email}</p>
                  {profile.is_admin && (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Admin</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleAdmin(profile)}
                  disabled={loading === profile.id + '-admin' || profile.email === superAdminEmail}
                  title={profile.is_admin ? 'Remove admin' : 'Make admin'}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${profile.is_admin ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  {profile.is_admin ? <Shield size={16} /> : <ShieldOff size={16} />}
                </button>
                <button
                  onClick={() => revokeAccess(profile)}
                  disabled={loading === profile.id + '-revoke' || profile.email === superAdminEmail}
                  title="Revoke access"
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                >
                  <UserX size={16} />
                </button>
              </div>
            </div>

            {/* Notification preferences */}
            <div className="border-t border-gray-50 pt-2.5 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Notifications</p>
              {NOTIF_CATEGORIES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{label}</span>
                  <button
                    onClick={() => toggleNotif(profile.id, key)}
                    className={`relative inline-flex w-10 h-6 rounded-full transition-colors shrink-0 ${pref[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pref[key] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
