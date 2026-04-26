'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this order? This cannot be undone.')) return
    setLoading(true)
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    setLoading(false)
    if (error) { toast.error('Failed to delete order'); return }
    toast.success('Order deleted')
    router.push('/orders')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="w-full h-10 flex items-center justify-center gap-1.5 text-red-500 font-bold text-sm rounded-xl border border-red-200 hover:bg-red-50 active:scale-95 transition-transform disabled:opacity-40"
    >
      <Trash2 size={14} />
      {loading ? '...' : 'Delete'}
    </button>
  )
}
