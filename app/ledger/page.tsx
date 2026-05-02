import { createClient } from '@/lib/supabase-server'
import { LedgerList } from '@/components/ledger/ledger-list'
import { PageHeader } from '@/components/page-header'
import { RealtimeSync } from '@/components/realtime-sync'

async function getLedger() {
  const supabase = await createClient()

  const [{ data: orders }, { data: payments }] = await Promise.all([
    supabase.from('orders').select('id, customer_id, customer_name, total_amount, status, created_at').order('customer_name'),
    supabase.from('payments').select('order_id, amount, payment_type'),
  ])

  if (!orders) return []

  const paymentsByOrder = (payments ?? []).reduce((acc, p) => {
    if (p.payment_type !== 'credit') {
      acc[p.order_id] = (acc[p.order_id] ?? 0) + Number(p.amount)
    }
    return acc
  }, {} as Record<string, number>)

  // Key by customer_id when available, fall back to name-prefix for orderless entries
  const customerMap: Record<string, {
    customer_id: string | null
    customer_name: string
    orders: { id: string; total_amount: number; paid: number; status: string; created_at: string }[]
  }> = {}

  for (const o of orders) {
    const key = o.customer_id ?? `name:${o.customer_name}`
    if (!customerMap[key]) {
      customerMap[key] = { customer_id: o.customer_id, customer_name: o.customer_name, orders: [] }
    }
    customerMap[key].orders.push({
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
      <RealtimeSync tables={['orders', 'payments']} />
      <div className="sticky top-0 z-30 bg-white">
        <PageHeader title="Khata" />
      </div>

      <LedgerList initialLedger={ledger} />
    </div>
  )
}
