'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Banknote, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

export function RecordPaymentSection({ orderId, outstanding }: { orderId: string; outstanding: number }) {
  const [paymentType, setPaymentType] = useState<'cash' | 'online' | null>(null)
  const [amount, setAmount] = useState(outstanding.toString())
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRecord() {
    if (!paymentType) return
    const paid = parseFloat(amount) || 0
    if (paid <= 0) { toast.error('Enter a valid amount'); return }
    if (paid > outstanding) { toast.error('Amount cannot exceed outstanding'); return }
    setLoading(true)
    const { error } = await supabase.from('payments').insert({
      order_id: orderId,
      payment_type: paymentType,
      amount: paid,
    })
    setLoading(false)
    if (error) { toast.error('Failed to record payment'); return }
    toast.success('Payment recorded')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
      <p className="font-bold text-gray-900 text-sm">Payment Record Karo</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setPaymentType('cash'); setAmount(outstanding.toString()) }}
          className={`h-14 flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-colors ${
            paymentType === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <Banknote size={18} className={paymentType === 'cash' ? 'text-green-600' : 'text-gray-400'} />
          <span className={`text-xs font-bold ${paymentType === 'cash' ? 'text-green-700' : 'text-gray-600'}`}>Cash</span>
        </button>
        <button
          type="button"
          onClick={() => { setPaymentType('online'); setAmount(outstanding.toString()) }}
          className={`h-14 flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-colors ${
            paymentType === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <Smartphone size={18} className={paymentType === 'online' ? 'text-blue-600' : 'text-gray-400'} />
          <span className={`text-xs font-bold ${paymentType === 'online' ? 'text-blue-700' : 'text-gray-600'}`}>Online</span>
        </button>
      </div>
      {paymentType && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount (₹)</label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
            />
            <button
              type="button"
              onClick={() => setAmount(outstanding.toString())}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"
            >
              FULL
            </button>
          </div>
        </div>
      )}
      <button
        onClick={handleRecord}
        disabled={!paymentType || loading}
        className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all active:scale-[0.98]"
      >
        {loading ? 'Recording...' : 'Record Payment'}
      </button>
    </div>
  )
}
