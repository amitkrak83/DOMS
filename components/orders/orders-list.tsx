'use client'

import { useState, useMemo, memo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, Search, Check, Trash2 } from 'lucide-react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const fetchingRef = useRef(false)

  const allOrders = useMemo(() => {
    const seen = new Set(initialOrders.map(o => o.id))
    return [...initialOrders, ...loadedOrders.filter(o => !seen.has(o.id))]
  }, [initialOrders, loadedOrders])

  const cursor = allOrders.at(-1)?.created_at

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
    if (deletedIds.has(order.id)) return false

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending'   && order.status === 'pending') ||
      (activeTab === 'delivered' && order.status === 'delivered')

    const matchesSearch = order.customer_name.toLowerCase().includes(search.toLowerCase())

    const orderDate = new Date(order.created_at).toLocaleDateString('en-CA', { timeZone: IST })
    const matchesFrom = !fromDate || orderDate >= fromDate
    const matchesTo   = !toDate   || orderDate <= toDate

    return matchesTab && matchesSearch && matchesFrom && matchesTo
  }), [allOrders, activeTab, search, fromDate, toDate, deletedIds])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitSelect() {
    setIsSelecting(false)
    setSelectedIds(new Set())
  }

  async function handleBulkDelete() {
    if (!selectedIds.size) return
    const count = selectedIds.size
    if (!confirm(`Delete ${count} order${count > 1 ? 's' : ''}? This cannot be undone.`)) return
    setDeleting(true)
    const ids = [...selectedIds]
    const { error } = await supabase.from('orders').delete().in('id', ids)
    setDeleting(false)
    if (error) { toast.error('Failed to delete orders'); return }
    setDeletedIds(prev => new Set([...prev, ...ids]))
    toast.success(`${count} order${count > 1 ? 's' : ''} deleted`)
    exitSelect()
  }

  const allVisibleSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.has(o.id))

  return (
    <div>
      {/* Sticky filters */}
      <div className="sticky top-16 z-20 bg-white px-4 pt-3 pb-3 space-y-3 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>
          <button
            onClick={() => isSelecting ? exitSelect() : setIsSelecting(true)}
            className={`shrink-0 text-sm font-bold px-3 py-2 rounded-xl transition-colors ${
              isSelecting ? 'bg-gray-100 text-gray-700' : 'text-blue-600'
            }`}
          >
            {isSelecting ? 'Cancel' : 'Select'}
          </button>
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

        {filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            isSelecting={isSelecting}
            isSelected={selectedIds.has(order.id)}
            onToggle={() => toggleSelect(order.id)}
          />
        ))}

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

      {/* Bulk action bar */}
      {isSelecting && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">{selectedIds.size} selected</span>
              <button
                onClick={() => setSelectedIds(allVisibleSelected ? new Set() : new Set(filteredOrders.map(o => o.id)))}
                className="text-xs font-bold text-blue-600"
              >
                {allVisibleSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <button
              onClick={handleBulkDelete}
              disabled={!selectedIds.size || deleting}
              className="flex items-center gap-1.5 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const OrderCard = memo(function OrderCard({
  order, isSelecting, isSelected, onToggle,
}: {
  order: Order
  isSelecting: boolean
  isSelected: boolean
  onToggle: () => void
}) {
  const router = useRouter()

  return (
    <div
      onClick={() => isSelecting ? onToggle() : router.push(`/orders/${order.id}`)}
      className={`bg-white rounded-xl px-4 py-3.5 shadow-sm border flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer ${
        isSelected ? 'border-blue-400 bg-blue-50/40' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {isSelecting && (
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
          }`}>
            {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
          </div>
        )}
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
