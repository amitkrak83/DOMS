import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Plus } from 'lucide-react'
import { OrdersList } from '@/components/orders/orders-list'
import { PageHeader } from '@/components/page-header'
import { RealtimeSync } from '@/components/realtime-sync'

async function getOrders() {
  const supabase = await createClient()

  // Window start: midnight IST 2 days ago (today + yesterday)
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const todayIST = new Date(`${todayStr}T00:00:00+05:30`)
  const windowStart = new Date(todayIST.getTime() - 1 * 24 * 60 * 60 * 1000) // yesterday midnight IST

  const { data } = await supabase
    .from('orders')
    .select('id, customer_name, status, total_amount, created_at')
    .gte('created_at', windowStart.toISOString())
    .order('created_at', { ascending: false })

  return { orders: data ?? [], windowStart: windowStart.toISOString() }
}

export default async function OrdersPage() {
  const { orders, windowStart } = await getOrders()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <RealtimeSync tables={['orders']} />
      <div className="sticky top-0 z-30 bg-white">
        <PageHeader title="Orders" />
      </div>

      <OrdersList initialOrders={orders} windowStart={windowStart} />

      <Link href="/orders/new" className="fixed bottom-20 right-4 z-40">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
          <Plus size={18} strokeWidth={2.5} />
          New Order
        </button>
      </Link>
    </div>
  )
}
