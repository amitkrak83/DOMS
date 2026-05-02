'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type UserPref = {
  user_id: string
  email: string
  new_order: boolean
  payment_recorded: boolean
  order_delivered: boolean
}

const CATEGORIES = [
  { key: 'new_order',        label: 'New Order'        },
  { key: 'payment_recorded', label: 'Payment Received'  },
  { key: 'order_delivered',  label: 'Order Delivered'   },
] as const

export function NotificationsPanel({ initialPrefs }: { initialPrefs: UserPref[] }) {
  const [prefs, setPrefs] = useState<UserPref[]>(initialPrefs)

  async function toggle(userId: string, key: keyof Omit<UserPref, 'user_id' | 'email'>) {
    const updated = prefs.map(p => p.user_id === userId ? { ...p, [key]: !p[key] } : p)
    setPrefs(updated)
    const pref = updated.find(p => p.user_id === userId)!
    await (supabase as any).from('notification_preferences').upsert({
      user_id: userId,
      new_order: pref.new_order,
      payment_recorded: pref.payment_recorded,
      order_delivered: pref.order_delivered,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  if (prefs.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No users have notification preferences set yet</p>
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-[1fr_repeat(3,_44px)] gap-2 px-3 pb-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">User</span>
        {CATEGORIES.map(c => (
          <span key={c.key} className="text-[10px] font-bold text-gray-400 text-center leading-tight">{c.label}</span>
        ))}
      </div>

      {prefs.map(pref => (
        <div key={pref.user_id} className="bg-white rounded-xl border border-gray-100 px-3 py-3 grid grid-cols-[1fr_repeat(3,_44px)] gap-2 items-center">
          <span className="text-sm font-medium text-gray-800 truncate">{pref.email}</span>
          {CATEGORIES.map(({ key }) => (
            <div key={key} className="flex justify-center">
              <button
                onClick={() => toggle(pref.user_id, key)}
                className={`relative w-9 h-5 rounded-full transition-colors ${pref[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${pref[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
