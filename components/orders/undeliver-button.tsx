'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export function UndeliverButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function markUndelivered() {
    setLoading(true)

    const { error: orderErr } = await supabase
      .from('orders')
      .update({ status: 'pending' })
      .eq('id', orderId)

    if (orderErr) { toast.error('Failed to update order'); setLoading(false); return }

    const { error: payErr } = await supabase
      .from('payments')
      .delete()
      .eq('order_id', orderId)

    setLoading(false)
    if (payErr) { toast.error('Failed to remove payment'); return }

    toast.success('Order moved back to pending')
    router.refresh()
  }

  return (
    <button
      onClick={markUndelivered}
      disabled={loading}
      className="w-full h-12 rounded-xl border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
    >
      <RotateCcw size={16} />
      {loading ? 'Updating...' : 'Mark as Undelivered'}
    </button>
  )
}
