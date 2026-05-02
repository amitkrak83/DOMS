import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Plus, Clock, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { RealtimeSync } from '@/components/realtime-sync'

async function getDashboardData(filter?: string) {
  const supabase = await createClient()
  // Midnight IST — works regardless of server timezone
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const today = new Date(`${todayStr}T00:00:00+05:30`)
  const todayISO = today.toISOString()

  type OrderRow = { id: string; customer_name: string; status: string; total_amount: number; created_at: string }
  let ordersData: OrderRow[] = []

  if (filter === 'collection' || filter === 'udhar') {
    // Pre-query (cashIds / udharIds) runs in parallel with stats
    const [preResult, cashTodayRes, udharRes, pendingRes, deliveredTodayRes] = await Promise.all([
      filter === 'collection'
        ? supabase.from('payments').select('order_id').in('payment_type', ['cash', 'online']).gte('created_at', todayISO)
        : supabase.from('payments').select('order_id').eq('payment_type', 'credit'),
      supabase.from('payments').select('amount').in('payment_type', ['cash', 'online']).gte('created_at', todayISO),
      supabase.from('payments').select('amount').eq('payment_type', 'credit'),
      supabase.from('orders').select('id').eq('status', 'pending'),
      supabase.from('orders').select('id').eq('status', 'delivered').gte('created_at', todayISO),
    ])

    const ids = (preResult.data ?? []).map((p: { order_id: string }) => p.order_id)
    if (ids.length > 0) {
      let q = supabase
        .from('orders')
        .select('id, customer_name, status, total_amount, created_at')
        .in('id', ids)
        .order('created_at', { ascending: false })
      if (filter === 'collection') q = q.gte('created_at', todayISO)
      const { data } = await q
      ordersData = (data ?? []) as OrderRow[]
    }

    const todayCollection = ((cashTodayRes.data ?? []) as { amount: number }[]).reduce((sum, p) => sum + Number(p.amount), 0)
    const udharTotal = ((udharRes.data ?? []) as { amount: number }[]).reduce((sum, p) => sum + Number(p.amount), 0)
    return {
      recentOrders: ordersData,
      todayDeliveries: deliveredTodayRes.data?.length ?? 0,
      todayCollection,
      udharTotal,
      pendingCount: pendingRes.data?.length ?? 0,
    }
  }

  // Simple filters — all queries run in parallel
  let ordersQ = supabase
    .from('orders')
    .select('id, customer_name, status, total_amount, created_at')
    .order('created_at', { ascending: false })

  if (filter === 'pending') ordersQ = ordersQ.eq('status', 'pending')
  else if (filter === 'delivered_today') ordersQ = ordersQ.eq('status', 'delivered').gte('created_at', todayISO)
  else ordersQ = ordersQ.limit(6)

  const [ordersResult, cashTodayRes, udharRes, pendingRes, deliveredTodayRes] = await Promise.all([
    ordersQ,
    supabase.from('payments').select('amount').in('payment_type', ['cash', 'online']).gte('created_at', todayISO),
    supabase.from('payments').select('amount').eq('payment_type', 'credit'),
    supabase.from('orders').select('id').eq('status', 'pending'),
    supabase.from('orders').select('id').eq('status', 'delivered').gte('created_at', todayISO),
  ])

  ordersData = (ordersResult.data ?? []) as OrderRow[]
  const todayCollection = ((cashTodayRes.data ?? []) as { amount: number }[]).reduce((sum, p) => sum + Number(p.amount), 0)
  const udharTotal = ((udharRes.data ?? []) as { amount: number }[]).reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    recentOrders: ordersData,
    todayDeliveries: deliveredTodayRes.data?.length ?? 0,
    todayCollection,
    udharTotal,
    pendingCount: pendingRes.data?.length ?? 0,
  }
}

const colorMap = {
  orange: { border: 'border-orange-500', from: 'from-orange-50', ring: 'ring-2 ring-orange-300' },
  green:  { border: 'border-green-500',  from: 'from-green-50',  ring: 'ring-2 ring-green-300'  },
  blue:   { border: 'border-blue-500',   from: 'from-blue-50',   ring: 'ring-2 ring-blue-300'   },
  red:    { border: 'border-red-500',    from: 'from-red-50',    ring: 'ring-2 ring-red-300'    },
}

const filterLabels: Record<string, string> = {
  pending:        'Pending Orders',
  delivered_today: 'Delivered Today',
  collection:     "Today's Collection",
  udhar:          'Udhar',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const data = await getDashboardData(filter)

  const stats = [
    { label: 'Pending Orders',   value: data.pendingCount,    color: 'orange', filterKey: 'pending',        format: 'number'   },
    { label: 'Delivered Today',  value: data.todayDeliveries, color: 'green',  filterKey: 'delivered_today', format: 'number'  },
    { label: 'Today Collection', value: data.todayCollection, color: 'blue',   filterKey: 'collection',     format: 'currency' },
    { label: 'Udhar',            value: data.udharTotal,      color: 'red',    filterKey: 'udhar',          format: 'currency' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <RealtimeSync tables={['orders', 'payments']} />

      <PageHeader title="Dashboard" />

      {/* Sticky stats */}
      <div className="sticky top-16 z-20 bg-gray-50">
        <div className="px-4 pt-4 pb-3">
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, color, filterKey, format }) => {
              const colors = colorMap[color]
              const isActive = filter === filterKey
              return (
                <Link
                  key={filterKey}
                  href={isActive ? '/dashboard' : `/dashboard?filter=${filterKey}`}
                  className={`bg-gradient-to-r ${colors.from} to-white rounded-xl p-4 border-l-4 ${colors.border} shadow-sm ${isActive ? colors.ring : ''} active:scale-95 transition-transform block`}
                >
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-gray-900 text-2xl font-bold mt-1">
                    {format === 'currency'
                      ? `₹${Number(value).toLocaleString('en-IN')}`
                      : value}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Orders header — sticky with stats */}
        <div className="flex items-center justify-between px-4 pb-1">
          <h2 className="text-gray-900 text-base font-bold">
            {filter ? (filterLabels[filter] ?? 'Recent Orders') : 'Recent Orders'}
          </h2>
          {filter ? (
            <Link href="/dashboard">
              <span className="bg-gray-100 text-gray-700 font-semibold text-sm px-3 py-1 rounded-lg border border-gray-300">
                Clear ×
              </span>
            </Link>
          ) : (
            <Link href="/orders">
              <span className="text-blue-600 font-medium text-sm">View all →</span>
            </Link>
          )}
        </div>
      </div>

      {/* Scrollable orders list */}
      <div className="px-4 pb-4 space-y-2.5">

        {data.recentOrders.length === 0 && (

          <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}

        {data.recentOrders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <div className="bg-white rounded-xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                {order.status === 'pending'
                  ? <Clock size={20} className="text-orange-500 shrink-0" strokeWidth={2} />
                  : <CheckCircle2 size={20} className="text-green-600 shrink-0" strokeWidth={2} />
                }
                <div>
                  <p className="text-gray-900 font-bold text-sm leading-tight">{order.customer_name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                    {' '}
                    {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-900 font-bold text-base">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  order.status === 'pending'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {order.status === 'pending' ? 'Pending' : 'Delivered'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Floating New Order Button */}
      <Link href="/orders/new" className="fixed bottom-20 right-4 z-40">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
          <Plus size={18} strokeWidth={2.5} />
          New Order
        </button>
      </Link>
    </div>
  )
}
