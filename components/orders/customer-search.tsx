'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Plus, Check, X } from 'lucide-react'

export type SelectedCustomer = {
  id?: string
  name: string
  mobile: string
  address: string
}

type Customer = {
  id: string
  name: string
  mobile: string | null
  address: string | null
}

type Props = {
  value: SelectedCustomer | null
  onChange: (customer: SelectedCustomer | null) => void
}

export function CustomerSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<Customer[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [mobile, setMobile] = useState(value?.mobile ?? '')
  const [address, setAddress] = useState(value?.address ?? '')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 1) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, mobile, address')
        .ilike('name', `%${query}%`)
        .limit(6)
      setResults(data ?? [])
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  function selectExisting(customer: Customer) {
    setQuery(customer.name)
    setMobile(customer.mobile ?? '')
    setAddress(customer.address ?? '')
    setIsNew(false)
    setShowDropdown(false)
    onChange({ id: customer.id, name: customer.name, mobile: customer.mobile ?? '', address: customer.address ?? '' })
  }

  function selectNew() {
    setIsNew(true)
    setShowDropdown(false)
    onChange({ name: query.trim(), mobile, address })
  }

  function handleInputChange(v: string) {
    setQuery(v)
    setIsNew(false)
    setShowDropdown(true)
    onChange(v.trim() ? { name: v.trim(), mobile, address } : null)
  }

  function clearSelection() {
    setQuery('')
    setMobile('')
    setAddress('')
    setIsNew(false)
    setShowDropdown(false)
    onChange(null)
  }

  const isExistingSelected = !!(value?.id)

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="relative">
        <input
          className={`w-full h-12 px-4 pr-10 rounded-xl border-2 outline-none font-medium text-gray-900 text-base transition-colors ${
            isExistingSelected
              ? 'border-green-400 bg-green-50'
              : isNew
              ? 'border-orange-300 bg-orange-50'
              : 'border-gray-200 bg-white focus:border-blue-400'
          }`}
          placeholder="Search or enter customer name..."
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => { if (query.length >= 1) setShowDropdown(true) }}
        />
        {(isExistingSelected || isNew) ? (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        ) : (
          query && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
        )}

        {showDropdown && query.length >= 1 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {results.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); selectExisting(c) }}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User size={14} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                  {(c.mobile || c.address) && (
                    <p className="text-xs text-gray-400 truncate">{[c.mobile, c.address].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
              </button>
            ))}
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); selectNew() }}
              className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center gap-3 border-t border-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Plus size={14} className="text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-orange-700 text-sm">New: "{query.trim()}"</p>
                <p className="text-xs text-gray-400">Create new customer</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {isExistingSelected && value && (value.mobile || value.address) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
          {value.mobile && <p className="text-xs text-gray-500"><span className="font-bold">Mobile:</span> {value.mobile}</p>}
          {value.address && <p className="text-xs text-gray-500"><span className="font-bold">Address:</span> {value.address}</p>}
        </div>
      )}

      {isNew && (
        <div className="space-y-2 bg-orange-50 rounded-xl p-3 border border-orange-100">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">New Customer — Add Details (optional)</p>
          <input
            className="w-full h-10 px-3 rounded-lg border border-orange-200 bg-white outline-none text-sm font-medium text-gray-900 focus:ring-2 focus:ring-orange-300"
            placeholder="Mobile number"
            value={mobile}
            onChange={e => { setMobile(e.target.value); onChange({ name: query.trim(), mobile: e.target.value, address }) }}
          />
          <input
            className="w-full h-10 px-3 rounded-lg border border-orange-200 bg-white outline-none text-sm font-medium text-gray-900 focus:ring-2 focus:ring-orange-300"
            placeholder="Address"
            value={address}
            onChange={e => { setAddress(e.target.value); onChange({ name: query.trim(), mobile, address: e.target.value }) }}
          />
        </div>
      )}
    </div>
  )
}
