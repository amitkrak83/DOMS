'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'

type LedgerItem = {
  customer_name: string
  total: number
  paid: number
  outstanding: number
  orders: {
    id: string
    total_amount: number
    paid: number
    status: string
    created_at: string
  }[]
}

export function LedgerList({ initialLedger }: { initialLedger: LedgerItem[] }) {
  const [search, setSearch] = useState('')

  const filteredLedger = initialLedger.filter(c => 
    c.customer_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalOutstanding = filteredLedger.reduce((s, c) => s + c.outstanding, 0)

  return (
    <div>
      {/* Search Bar */}
      <div className="sticky top-[63px] z-20 bg-white px-4 pb-3 shadow-sm border-b border-gray-100 !mt-0">
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
      </div>

      <div className="px-4 space-y-3 pt-4">
        {totalOutstanding > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-white rounded-xl border-l-4 border-red-500 shadow-sm px-4 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Udhar</p>
            <p className="text-2xl font-bold text-red-700 mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</p>
          </div>
        )}

        {filteredLedger.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500">No matching customers</p>
          </div>
        )}

        {filteredLedger.map(customer => (
          <div key={customer.customer_name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <p className="font-bold text-gray-900">{customer.customer_name}</p>
              {customer.outstanding > 0 ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                  ₹{customer.outstanding.toLocaleString('en-IN')} due
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                  Settled
                </span>
              )}
            </div>

            <div className="px-4 py-2 flex gap-4 text-xs text-gray-500 border-b border-gray-50">
              <span>Total: <span className="font-bold text-gray-700">₹{customer.total.toLocaleString('en-IN')}</span></span>
              <span>Paid: <span className="font-bold text-gray-700">₹{customer.paid.toLocaleString('en-IN')}</span></span>
            </div>

            <div className="divide-y divide-gray-50">
              {customer.orders.map(o => (
                <Link key={o.id} href={`/orders/${o.id}`}>
                  <div className="flex items-center justify-between px-4 py-3 active:bg-gray-50 transition-colors">
                    <p className="text-sm text-gray-500">
                      {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-sm font-bold text-gray-900">₹{o.total_amount.toLocaleString('en-IN')}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      o.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {o.status === 'pending' ? 'Pending' : 'Delivered'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
