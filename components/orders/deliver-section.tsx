'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Banknote, BookOpen, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function DeliverSection({ orderId, totalAmount }: { orderId: string; totalAmount: number }) {
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | null>(null)
  const [amountReceived, setAmountReceived] = useState(totalAmount.toString())
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function markDelivered() {
    if (!paymentType) return
    const cashAmount = parseFloat(amountReceived) || 0
    const creditAmount = totalAmount - cashAmount
    
    if (cashAmount < 0) { toast.error('Amount cannot be negative'); return }
    if (cashAmount > totalAmount) { toast.error('Amount cannot exceed total'); return }

    setLoading(true)

    const { error: orderErr } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)

    if (orderErr) { toast.error('Failed to update order'); setLoading(false); return }

    const payments = []
    if (cashAmount > 0) {
      payments.push({ order_id: orderId, payment_type: 'cash', amount: cashAmount })
    }
    if (creditAmount > 0) {
      payments.push({ order_id: orderId, payment_type: 'credit', amount: creditAmount })
    }

    if (payments.length > 0) {
      const { error: payErr } = await supabase.from('payments').insert(payments)
      if (payErr) { toast.error('Failed to record payment'); setLoading(false); return }
    }

    setLoading(false)
    toast.success('✅ Order Delivered successfully')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
      <p className="font-bold text-gray-900 text-sm">Payment Mode</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setPaymentType('cash')
            setAmountReceived(totalAmount.toString())
          }}
          className={`h-16 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-colors ${
            paymentType === 'cash'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-gray-50 hover:border-green-300'
          }`}
        >
          <Banknote size={22} className={paymentType === 'cash' ? 'text-green-600' : 'text-gray-400'} />
          <span className={`text-sm font-bold ${paymentType === 'cash' ? 'text-green-700' : 'text-gray-600'}`}>Cash</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setPaymentType('credit')
            setAmountReceived('0')
          }}
          className={`h-16 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-colors ${
            paymentType === 'credit'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-gray-50 hover:border-orange-300'
          }`}
        >
          <BookOpen size={22} className={paymentType === 'credit' ? 'text-orange-500' : 'text-gray-400'} />
          <span className={`text-sm font-bold ${paymentType === 'credit' ? 'text-orange-700' : 'text-gray-600'}`}>Udhar</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount Received (₹)</label>
        <div className="relative">
          <input
            type="number"
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
            placeholder="0.00"
          />
          <button 
            type="button"
            onClick={() => setAmountReceived(totalAmount.toString())}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"
          >
            FULL
          </button>
        </div>
        {parseFloat(amountReceived) < totalAmount && (
          <p className="text-[10px] font-medium text-orange-600 px-1">
            ₹{(totalAmount - (parseFloat(amountReceived) || 0)).toLocaleString('en-IN')} will be recorded as Udhar
          </p>
        )}
      </div>

      <button
        onClick={markDelivered}
        disabled={!paymentType || loading}
        className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      >
        <CheckCircle size={18} />
        {loading ? 'Processing...' : 'Mark as Delivered'}
      </button>
    </div>
  )
}
