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

export function UsersPanel({ initialProfiles, superAdminEmail }: { initialProfiles: Profile[]; superAdminEmail: string }) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleAdmin(profile: Profile) {
    const next = !profile.is_admin
    if (profile.email === superAdminEmail) {
      toast.error('Cannot change super-admin role')
      return
    }
    setLoading(profile.id + '-admin')
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: next })
      .eq('id', profile.id)
    setLoading(null)
    if (error) { toast.error('Failed to update role'); return }
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_admin: next } : p))
    toast.success(next ? `${profile.email} is now admin` : `${profile.email} admin removed`)
  }

  async function revokeAccess(profile: Profile) {
    if (profile.email === superAdminEmail) {
      toast.error('Cannot revoke super-admin access')
      return
    }
    if (!confirm(`Revoke access for ${profile.email}? They won't be able to log in next time.`)) return
    setLoading(profile.id + '-revoke')
    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('email', profile.email)
    setLoading(null)
    if (error) { toast.error('Failed to revoke access'); return }
    setProfiles(prev => prev.filter(p => p.id !== profile.id))
    toast.success(`Access revoked for ${profile.email}`)
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
      {profiles.map(profile => (
        <div key={profile.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-gray-900 truncate">{profile.email}</p>
                {profile.is_admin && (
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Admin
                  </span>
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
                className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                  profile.is_admin
                    ? 'text-blue-600 hover:bg-blue-50'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {profile.is_admin ? <Shield size={16} /> : <ShieldOff size={16} />}
              </button>
              <button
                onClick={() => revokeAccess(profile)}
                disabled={loading === profile.id + '-revoke' || profile.email === superAdminEmail}
                title="Revoke access"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              >
                <UserX size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
