'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, User, Phone, MapPin, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EditCustomerDialog } from './edit-customer-dialog'

export type Customer = {
  id: string
  name: string
  mobile: string | null
  address: string | null
  created_at: string
}

export function CustomersList({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState(initialCustomers)
  const router = useRouter()

  useEffect(() => { setCustomers(initialCustomers) }, [initialCustomers])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile ?? '').includes(search)
  )

  async function handleDelete(customer: Customer) {
    if (!confirm(`Delete "${customer.name}"? This won't delete their orders.`)) return
    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
    if (error) { toast.error('Cannot delete customer'); return }
    toast.success(`${customer.name} deleted`)
    setCustomers(prev => prev.filter(c => c.id !== customer.id))
  }

  function handleUpdated(updated: Customer) {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  return (
    <div>
      <div className="sticky top-[64px] z-20 bg-white px-4 pb-3 shadow-sm border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          />
        </div>
      </div>

      <div className="px-4 space-y-2.5 pt-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
            <User size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No customers yet</p>
            <p className="text-xs text-gray-400 mt-1">Customers are created when you place orders</p>
          </div>
        )}
        {filtered.map(customer => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <User size={18} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-tight">{customer.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {customer.mobile && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone size={10} /> {customer.mobile}
                    </span>
                  )}
                  {customer.address && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-[140px]">
                      <MapPin size={10} /> {customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <EditCustomerDialog customer={customer} onUpdated={handleUpdated} />
              <button
                onClick={() => handleDelete(customer)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
