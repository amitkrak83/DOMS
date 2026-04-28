import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Plus } from 'lucide-react'
import { OrdersList } from '@/components/orders/orders-list'
import { PageHeader } from '@/components/page-header'
import { RealtimeSync } from '@/components/realtime-sync'

const PAGE_SIZE = 10

async function getOrders() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('orders')
    .select('id, customer_name, status, total_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  const rows = data ?? []
  const hasMore = rows.length > PAGE_SIZE
  return {
    orders: hasMore ? rows.slice(0, PAGE_SIZE) : rows,
    hasMore,
  }
}

export default async function OrdersPage() {
  const { orders, hasMore } = await getOrders()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <RealtimeSync tables={['orders']} />
      <div className="sticky top-0 z-30 bg-white">
        <PageHeader title="Orders" />
      </div>

      <OrdersList initialOrders={orders} hasMore={hasMore} />

      <Link href="/orders/new" className="fixed bottom-20 right-4 z-40">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
          <Plus size={18} strokeWidth={2.5} />
          New Order
        </button>
      </Link>
    </div>
  )
}
