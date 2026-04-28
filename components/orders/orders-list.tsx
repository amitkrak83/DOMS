'use client'

import { useState, useMemo, memo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, Search } from 'lucide-react'
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
  hasMore: boolean
}

const IST = 'Asia/Kolkata'
const PAGE_SIZE = 10

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'pending',   label: 'Pending'   },
  { id: 'delivered', label: 'Delivered' },
] as const

export function OrdersList({ initialOrders, hasMore: initialHasMore }: Props) {
  const [loadedOrders, setLoadedOrders] = useState<Order[]>([])
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'delivered'>('all')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Synchronous guard — prevents double-fetch when IO fires before state update propagates
  const fetchingRef = useRef(false)

  // Merge server-rendered orders with client-loaded older ones (no duplicates)
  const allOrders = useMemo(() => {
    const seen = new Set(initialOrders.map(o => o.id))
    return [...initialOrders, ...loadedOrders.filter(o => !seen.has(o.id))]
  }, [initialOrders, loadedOrders])

  // Cursor = created_at of last loaded order
  const cursor = allOrders.at(-1)?.created_at

  // Always-fresh ref so the IntersectionObserver callback never goes stale
  const fetchRef = useRef<() => void>(() => {})
  fetchRef.current = async () => {
    if (!cursor || !hasMore || fetchingRef.current) return
    fetchingRef.current = true
    setLoadingMore(true)

    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, status, total_amount, created_at')
      .lt('created_at', cursor)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)

    const rows = data ?? []
    const gotMore = rows.length > PAGE_SIZE
    setLoadedOrders(prev => [...prev, ...(gotMore ? rows.slice(0, PAGE_SIZE) : rows)])
    setHasMore(gotMore)
    fetchingRef.current = false
    setLoadingMore(false)
  }

  // Attach / detach IntersectionObserver whenever hasMore changes
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchRef.current() },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

  const filteredOrders = useMemo(() => allOrders.filter(order => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending'   && order.status === 'pending') ||
      (activeTab === 'delivered' && order.status === 'delivered')

    const matchesSearch = order.customer_name.toLowerCase().includes(search.toLowerCase())

    const orderDate = new Date(order.created_at).toLocaleDateString('en-CA', { timeZone: IST })
    const matchesFrom = !fromDate || orderDate >= fromDate
    const matchesTo   = !toDate   || orderDate <= toDate

    return matchesTab && matchesSearch && matchesFrom && matchesTo
  }), [allOrders, activeTab, search, fromDate, toDate])


  return (
    <div>
      {/* Sticky filters */}
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
          {TABS.map(tab => (
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
            </button>
          ))}
        </div>
      </div>

      {/* Order cards */}
      <div className="px-4 space-y-2.5 pt-4">
        {filteredOrders.length === 0 && !loadingMore && (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">No orders found</p>
          </div>
        )}

        {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}

        {/* Infinite scroll sentinel — invisible, sits below the list */}
        <div ref={sentinelRef} className="h-1" />

        {loadingMore && (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && allOrders.length > PAGE_SIZE && (
          <p className="text-center text-xs text-gray-400 py-4">All orders loaded</p>
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
      <div className="text-right">
        <p className="text-gray-900 font-extrabold text-sm">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${
          order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
        }`}>
          {order.status === 'pending' ? 'Pending' : 'Delivered'}
        </span>
      </div>
    </div>
  )
})
