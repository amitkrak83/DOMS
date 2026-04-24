import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { OrdersList } from '@/components/orders/orders-list'

async function getOrders() {
  const { data } = await supabase
    .from('orders')
    .select('id, customer_name, status, total_amount, created_at')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-16 flex items-center">
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
      </div>

      <OrdersList initialOrders={orders} />

      <Link href="/orders/new" className="fixed bottom-20 right-4 z-40">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
          <Plus size={18} strokeWidth={2.5} />
          New Order
        </button>
      </Link>
    </div>
  )
}
