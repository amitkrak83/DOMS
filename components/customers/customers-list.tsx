'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, User, Phone, MapPin, Trash2, Check } from 'lucide-react'
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
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { setCustomers(initialCustomers) }, [initialCustomers])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile ?? '').includes(search)
  )

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

  async function handleDelete(customer: Customer) {
    if (!confirm(`Delete "${customer.name}"? This won't delete their orders.`)) return
    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
    if (error) { toast.error('Cannot delete customer'); return }
    toast.success(`${customer.name} deleted`)
    setCustomers(prev => prev.filter(c => c.id !== customer.id))
  }

  async function handleBulkDelete() {
    if (!selectedIds.size) return
    const count = selectedIds.size
    if (!confirm(`Delete ${count} customer${count > 1 ? 's' : ''}? This won't delete their orders.`)) return
    setDeleting(true)
    const ids = [...selectedIds]
    const { error } = await supabase.from('customers').delete().in('id', ids)
    setDeleting(false)
    if (error) { toast.error('Failed to delete customers'); return }
    setCustomers(prev => prev.filter(c => !ids.includes(c.id)))
    toast.success(`${count} customer${count > 1 ? 's' : ''} deleted`)
    exitSelect()
  }

  function handleUpdated(updated: Customer) {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))

  return (
    <div>
      <div className="sticky top-16 z-20 bg-white px-4 pt-3 pb-3 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
          <div
            key={customer.id}
            onClick={() => isSelecting ? toggleSelect(customer.id) : undefined}
            className={`bg-white rounded-xl shadow-sm border px-4 py-3.5 flex items-center justify-between gap-3 transition-all ${
              isSelecting ? 'cursor-pointer active:scale-[0.98]' : ''
            } ${selectedIds.has(customer.id) ? 'border-blue-400 bg-blue-50/40' : 'border-gray-100'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {isSelecting && (
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  selectedIds.has(customer.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}>
                  {selectedIds.has(customer.id) && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
              )}
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
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" /> <span className="truncate">{customer.address}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!isSelecting && (
              <div className="flex items-center gap-1 shrink-0">
                <EditCustomerDialog customer={customer} onUpdated={handleUpdated} />
                <button
                  onClick={() => handleDelete(customer)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bulk action bar */}
      {isSelecting && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">{selectedIds.size} selected</span>
              <button
                onClick={() => setSelectedIds(allVisibleSelected ? new Set() : new Set(filtered.map(c => c.id)))}
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
