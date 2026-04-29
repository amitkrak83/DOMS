'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

type Settings = { upi_id: string; merchant_name: string }

export function SettingsPanel({ initialSettings }: { initialSettings: Settings }) {
  const [upiId, setUpiId] = useState(initialSettings.upi_id)
  const [merchantName, setMerchantName] = useState(initialSettings.merchant_name)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const [r1, r2] = await Promise.all([
      supabase.from('app_settings').update({ value: upiId.trim(), updated_at: new Date().toISOString() }).eq('key', 'upi_id'),
      supabase.from('app_settings').update({ value: merchantName.trim(), updated_at: new Date().toISOString() }).eq('key', 'merchant_name'),
    ])
    setSaving(false)
    if (r1.error || r2.error) { toast.error('Failed to save settings'); return }
    toast.success('Settings saved')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">UPI ID</label>
        <input
          type="text"
          value={upiId}
          onChange={e => setUpiId(e.target.value)}
          placeholder="yourname@okbizicici"
          className="w-full h-11 px-4 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
        />
        <p className="text-xs text-gray-400 px-1">Used in UPI QR code shown during payment</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Merchant Name</label>
        <input
          type="text"
          value={merchantName}
          onChange={e => setMerchantName(e.target.value)}
          placeholder="Your Business Name"
          className="w-full h-11 px-4 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
        />
        <p className="text-xs text-gray-400 px-1">Displayed on the QR payment screen</p>
      </div>

      <button
        onClick={save}
        disabled={saving || !upiId.trim() || !merchantName.trim()}
        className="w-full h-11 bg-blue-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-transform"
      >
        <Save size={16} />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
