'use client'

import { useState, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, Search, ChevronDown } from 'lucide-react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { supabase } from '@/lib/supabase'

type Order = {
  id: string
  customer_name: string
  status: string
  total_amount: number
  created_at: string
}

type Props = {
  initialOrders: Order[]
  windowStart: string  // ISO — start of the initial 2-day window (yesterday midnight IST)
}

const IST = 'Asia/Kolkata'

export function OrdersList({ initialOrders, windowStart: initialWindowStart }: Props) {
  const [loadedOrders, setLoadedOrders] = useState<Order[]>([])
  const [windowStart, setWindowStart] = useState(initialWindowStart)
  const [loadingMore, setLoadingMore] = useState(false)
  const [noMore, setNoMore] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'delivered'>('all')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Merge server orders (realtime-refreshed) with client-loaded older orders, no duplicates
  const allOrders = useMemo(() => {
    const seen = new Set(initialOrders.map(o => o.id))
    const extra = loadedOrders.filter(o => !seen.has(o.id))
    return [...initialOrders, ...extra]
  }, [initialOrders, loadedOrders])

  async function loadMore() {
    if (noMore || loadingMore) return
    setLoadingMore(true)

    const newWindowEnd = windowStart
    const newWindowStart = new Date(new Date(windowStart).getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, status, total_amount, created_at')
      .gte('created_at', newWindowStart)
      .lt('created_at', newWindowEnd)
      .order('created_at', { ascending: false })

    const more = data ?? []
    setLoadedOrders(prev => [...prev, ...more])
    setWindowStart(newWindowStart)
    setNoMore(more.length === 0)
    setLoadingMore(false)
  }

  const filteredOrders = useMemo(() => allOrders.filter(order => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && order.status === 'pending') ||
      (activeTab === 'delivered' && order.status === 'delivered')

    const matchesSearch = order.customer_name.toLowerCase().includes(search.toLowerCase())

    // Use IST date for day-boundary comparison
    const orderDate = new Date(order.created_at).toLocaleDateString('en-CA', { timeZone: IST })
    const matchesFrom = !fromDate || orderDate >= fromDate
    const matchesTo = !toDate || orderDate <= toDate

    return matchesTab && matchesSearch && matchesFrom && matchesTo
  }), [allOrders, activeTab, search, fromDate, toDate])

  const tabs = useMemo(() => [
    { id: 'all',       label: 'All',       count: allOrders.length },
    { id: 'pending',   label: 'Pending',   count: allOrders.filter(o => o.status === 'pending').length },
    { id: 'delivered', label: 'Delivered', count: allOrders.filter(o => o.status === 'delivered').length },
  ] as const, [allOrders])

  return (
    <div>
      {/* Search and Filters */}
      <div className="sticky top-16 z-20 bg-white px-4 pt-3 pb-3 space-y-3 shadow-sm border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          />
        </div>

        <DateRangePicker
          from={fromDate}
          to={toDate}
          onChange={(f, t) => { setFromDate(f); setToDate(t) }}
        />

        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-blue-100' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2.5 pt-4">
        {filteredOrders.length === 0 && !loadingMore ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">No orders found</p>
          </div>
        ) : (
          filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
        )}

        {/* Load More */}
        {!noMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-50 mt-2"
          >
            <ChevronDown size={16} />
            {loadingMore ? 'Loading…' : 'Load More (older orders)'}
          </button>
        )}

        {noMore && loadedOrders.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-2">All orders loaded</p>
        )}
      </div>
    </div>
  )
}

const OrderCard = memo(function OrderCard({ order }: { order: Order }) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/orders/${order.id}`)}
      className="bg-white rounded-xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          order.status === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'
        }`}>
          {order.status === 'pending' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
        </div>
        <div>
          <p className="text-gray-900 font-bold text-sm leading-tight">{order.customer_name}</p>
          <p className="text-gray-400 text-[10px] mt-1 font-medium">
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: IST })}
            {' • '}
            {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: IST })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-gray-900 font-extrabold text-sm">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${
            order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
          }`}>
            {order.status === 'pending' ? 'Pending' : 'Delivered'}
          </span>
        </div>
      </div>
    </div>
  )
})
