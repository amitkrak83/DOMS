'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'

type AuditEntry = {
  id: string
  table_name: string
  operation: string
  old_data: any
  new_data: any
  user_email: string | null
  user_name: string | null
  created_at: string
}

function typeLabel(type: string) {
  if (type === 'cash') return 'Cash'
  if (type === 'online') return 'Online'
  if (type === 'credit') return 'Udhar'
  return type
}

function describe(log: AuditEntry): string {
  const { table_name, operation, old_data, new_data } = log
  const who = log.user_name ?? log.user_email ?? 'Someone'

  if (table_name === 'orders') {
    if (operation === 'INSERT') return `${who} created order for ${new_data?.customer_name ?? ''}`
    if (operation === 'DELETE') return `${who} deleted order of ${old_data?.customer_name ?? ''}`
    if (operation === 'UPDATE') {
      if (old_data?.status !== new_data?.status) {
        const labels: Record<string, string> = { pending: 'Pending', delivered: 'Delivered' }
        return `${who} changed order status: ${labels[old_data?.status] ?? old_data?.status} → ${labels[new_data?.status] ?? new_data?.status} (${new_data?.customer_name ?? ''})`
      }
      if (old_data?.total_amount !== new_data?.total_amount)
        return `${who} updated order amount: ₹${Number(old_data?.total_amount).toLocaleString('en-IN')} → ₹${Number(new_data?.total_amount).toLocaleString('en-IN')}`
      return `${who} updated order of ${new_data?.customer_name ?? ''}`
    }
  }

  if (table_name === 'payments') {
    if (operation === 'INSERT')
      return `${who} recorded ${typeLabel(new_data?.payment_type)} payment of ₹${Number(new_data?.amount).toLocaleString('en-IN')}`
    if (operation === 'DELETE')
      return `${who} deleted ${typeLabel(old_data?.payment_type)} payment of ₹${Number(old_data?.amount).toLocaleString('en-IN')}`
    if (operation === 'UPDATE') {
      const parts: string[] = []
      if (old_data?.amount !== new_data?.amount)
        parts.push(`₹${Number(old_data?.amount).toLocaleString('en-IN')} → ₹${Number(new_data?.amount).toLocaleString('en-IN')}`)
      if (old_data?.payment_type !== new_data?.payment_type)
        parts.push(`${typeLabel(old_data?.payment_type)} → ${typeLabel(new_data?.payment_type)}`)
      return `${who} updated payment: ${parts.join(', ')}`
    }
  }

  if (table_name === 'products') {
    if (operation === 'INSERT') return `${who} added product: ${new_data?.name ?? ''}`
    if (operation === 'DELETE') return `${who} deleted product: ${old_data?.name ?? ''}`
    if (operation === 'UPDATE') return `${who} updated product: ${new_data?.name ?? ''}`
  }

  if (table_name === 'product_variants') {
    if (operation === 'INSERT') return `${who} added variant: ${new_data?.variant_name ?? ''}`
    if (operation === 'DELETE') return `${who} deleted variant: ${old_data?.variant_name ?? ''}`
    if (operation === 'UPDATE') {
      const parts: string[] = []
      if (old_data?.price_per_case !== new_data?.price_per_case)
        parts.push(`price ₹${old_data?.price_per_case} → ₹${new_data?.price_per_case}`)
      if (old_data?.variant_name !== new_data?.variant_name)
        parts.push(`name: ${old_data?.variant_name} → ${new_data?.variant_name}`)
      return `${who} updated variant ${new_data?.variant_name ?? ''}: ${parts.join(', ') || 'updated'}`
    }
  }

  if (table_name === 'customers') {
    if (operation === 'INSERT') return `${who} added customer: ${new_data?.name ?? ''}`
    if (operation === 'DELETE') return `${who} deleted customer: ${old_data?.name ?? ''}`
    if (operation === 'UPDATE') return `${who} updated customer: ${new_data?.name ?? ''}`
  }

  return `${who} ${operation.toLowerCase()}d ${table_name}`
}

function opBadge(op: string) {
  if (op === 'INSERT') return 'bg-green-100 text-green-700'
  if (op === 'DELETE') return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}

function opLabel(op: string) {
  if (op === 'INSERT') return 'Added'
  if (op === 'DELETE') return 'Deleted'
  return 'Edited'
}

const TABLE_LABELS: Record<string, string> = {
  orders: 'Orders',
  payments: 'Payments',
  products: 'Products',
  product_variants: 'Variants',
  customers: 'Customers',
}

export function AuditLogPanel({ logs }: { logs: AuditEntry[] }) {
  const [search, setSearch] = useState('')
  const [filterTable, setFilterTable] = useState('all')
  const [filterOp, setFilterOp] = useState('all')

  const tables = useMemo(() => Array.from(new Set(logs.map(l => l.table_name))), [logs])

  const filtered = useMemo(() => logs.filter(log => {
    if (filterTable !== 'all' && log.table_name !== filterTable) return false
    if (filterOp !== 'all' && log.operation !== filterOp) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (log.user_email ?? '').toLowerCase().includes(q) ||
        describe(log).toLowerCase().includes(q)
      )
    }
    return true
  }), [logs, filterTable, filterOp, search])

  const IST = { timeZone: 'Asia/Kolkata' } as const

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user or action..."
            className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterTable}
            onChange={e => setFilterTable(e.target.value)}
            className="flex-1 h-9 text-xs border border-gray-200 rounded-lg px-2 font-medium text-gray-700 outline-none"
          >
            <option value="all">All Tables</option>
            {tables.map(t => <option key={t} value={t}>{TABLE_LABELS[t] ?? t}</option>)}
          </select>
          <select
            value={filterOp}
            onChange={e => setFilterOp(e.target.value)}
            className="flex-1 h-9 text-xs border border-gray-200 rounded-lg px-2 font-medium text-gray-700 outline-none"
          >
            <option value="all">All Actions</option>
            <option value="INSERT">Added</option>
            <option value="UPDATE">Edited</option>
            <option value="DELETE">Deleted</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} entries</p>

      {/* Log entries */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No activity found</p>
        )}
        {filtered.map(log => (
          <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${opBadge(log.operation)}`}>
                  {opLabel(log.operation)}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {TABLE_LABELS[log.table_name] ?? log.table_name}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0">
                {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...IST })}
              </span>
            </div>
            <p className="text-sm text-gray-800">{describe(log)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
