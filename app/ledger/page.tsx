import { supabase } from '@/lib/supabase'
import { LedgerList } from '@/components/ledger/ledger-list'

async function getLedger() {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, total_amount, status, created_at')
    .order('customer_name')

  const { data: payments } = await supabase
    .from('payments')
    .select('order_id, amount, payment_type')

  if (!orders) return []

  const paymentsByOrder = (payments ?? []).reduce((acc, p) => {
    acc[p.order_id] = (acc[p.order_id] ?? 0) + Number(p.amount)
    return acc
  }, {} as Record<string, number>)

  const customerMap: Record<string, {
    customer_name: string
    orders: { id: string; total_amount: number; paid: number; status: string; created_at: string }[]
  }> = {}

  for (const o of orders) {
    if (!customerMap[o.customer_name]) {
      customerMap[o.customer_name] = { customer_name: o.customer_name, orders: [] }
    }
    customerMap[o.customer_name].orders.push({
      id: o.id,
      total_amount: Number(o.total_amount),
      paid: paymentsByOrder[o.id] ?? 0,
      status: o.status,
      created_at: o.created_at,
    })
  }

  return Object.values(customerMap).map(c => {
    const total = c.orders.reduce((s, o) => s + o.total_amount, 0)
    const paid = c.orders.reduce((s, o) => s + o.paid, 0)
    return { ...c, total, paid, outstanding: total - paid }
  }).sort((a, b) => b.outstanding - a.outstanding)
}

export default async function LedgerPage() {
  const ledger = await getLedger()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-16 flex items-center">
        <h1 className="text-xl font-bold text-gray-900">Khata</h1>
      </div>

      <LedgerList initialLedger={ledger} />
    </div>
  )
}
