'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { usePush } from '@/lib/use-push'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'

type Prefs = {
  new_order: boolean
  payment_recorded: boolean
  order_delivered: boolean
}

const CATEGORIES = [
  { key: 'new_order',        label: 'New Order'       },
  { key: 'payment_recorded', label: 'Payment Received' },
  { key: 'order_delivered',  label: 'Order Delivered'  },
] as const

export function NotificationSettings() {
  const { permission, subscribed, loading: pushLoading, subscribe, unsubscribe } = usePush()
  const [prefs, setPrefs] = useState<Prefs>({ new_order: true, payment_recorded: true, order_delivered: true })
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      ;(supabase as any).from('notification_preferences').select('new_order, payment_recorded, order_delivered').eq('user_id', user.id).maybeSingle()
        .then(({ data }: any) => { if (data) setPrefs({ new_order: data.new_order, payment_recorded: data.payment_recorded, order_delivered: data.order_delivered }) })
    })
  }, [])

  async function togglePref(key: keyof Prefs) {
    if (!userId) return
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    setSaving(true)
    await (supabase as any).from('notification_preferences').upsert({ user_id: userId, ...updated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setSaving(false)
  }

  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900">Push Notifications</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {!supported ? 'Not supported on this browser' : subscribed ? 'Enabled on this device' : 'Not enabled on this device'}
          </p>
        </div>
        {supported && (
          <button
            onClick={subscribed ? unsubscribe : subscribe}
            disabled={pushLoading || permission === 'denied'}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${
              subscribed ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-600 text-white'
            }`}
          >
            {subscribed ? <><BellOff size={14} /> Turn Off</> : <><Bell size={14} /> Enable</>}
          </button>
        )}
      </div>

      {permission === 'denied' && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          Notifications blocked in browser settings. Please allow them manually.
        </p>
      )}

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Notify me when</p>
        {CATEGORIES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <button
              onClick={() => togglePref(key)}
              disabled={saving}
              className={`relative inline-flex w-10 h-6 rounded-full transition-colors shrink-0 ${prefs[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
