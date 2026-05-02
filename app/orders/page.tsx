import { createClient } from '@/lib/supabase-server'
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
      <PageHeader title="Orders" />

      <OrdersList initialOrders={orders} hasMore={hasMore} />
    </div>
  )
}
