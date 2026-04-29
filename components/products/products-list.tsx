'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Check, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { AddVariantDialog } from './add-variant-dialog'
import { EditVariantDialog } from './edit-variant-dialog'
import { DeleteVariantButton } from './delete-variant-button'
import { DeleteProductButton } from './delete-product-button'

type Product = {
  id: string
  name: string
  product_variants: {
    id: string
    variant_name: string
    bottles_per_case: number
    price_per_case: number
    free_bottles_per_case: number
  }[]
}

export function ProductsList({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState('')
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const filteredProducts = initialProducts.filter(p => {
    if (deletedIds.has(p.id)) return false
    const matchesProductName = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesVariantName = p.product_variants.some(v => v.variant_name.toLowerCase().includes(search.toLowerCase()))
    return matchesProductName || matchesVariantName
  })

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
    if (!confirm(`Delete ${count} product${count > 1 ? 's' : ''} and all their variants?`)) return
    setDeleting(true)
    const ids = [...selectedIds]
    const { error } = await supabase.from('products').delete().in('id', ids)
    setDeleting(false)
    if (error) { toast.error('Cannot delete — some products are used in existing orders'); return }
    setDeletedIds(prev => new Set([...prev, ...ids]))
    toast.success(`${count} product${count > 1 ? 's' : ''} deleted`)
    exitSelect()
    router.refresh()
  }

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id))

  return (
    <div>
      <div className="sticky top-16 z-20 bg-white px-4 pt-3 pb-3 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products or variants..."
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
      </div>

      <div className="px-4 space-y-3 pt-4">
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500">No matching products</p>
          </div>
        )}

        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
              selectedIds.has(product.id) ? 'border-blue-400' : 'border-gray-100'
            }`}
          >
            <div
              onClick={() => isSelecting ? toggleSelect(product.id) : undefined}
              className={`px-4 py-3 flex items-center justify-between border-b border-gray-100 transition-colors ${
                selectedIds.has(product.id) ? 'bg-blue-50/40' : 'bg-gray-50/50'
              } ${isSelecting ? 'cursor-pointer active:scale-[0.99]' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                {isSelecting && (
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    selectedIds.has(product.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {selectedIds.has(product.id) && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                )}
                <p className="font-bold text-gray-900">{product.name}</p>
                {!isSelecting && <DeleteProductButton productId={product.id} productName={product.name} />}
              </div>
              {!isSelecting && <AddVariantDialog productId={product.id} productName={product.name} />}
            </div>

            <div className="divide-y divide-gray-50">
              {product.product_variants.length === 0 && (
                <p className="text-xs text-gray-400 px-4 py-3">No variants added</p>
              )}
              {product.product_variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/30 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{v.variant_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {v.bottles_per_case} btl/case · ₹{Number(v.price_per_case).toLocaleString('en-IN')}/case
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.free_bottles_per_case > 0 ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        +{v.free_bottles_per_case} free/case
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        No scheme
                      </span>
                    )}
                    {!isSelecting && <EditVariantDialog variant={v} />}
                    {!isSelecting && <DeleteVariantButton variantId={v.id} />}
                  </div>
                </div>
              ))}
            </div>
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
                onClick={() => setSelectedIds(allVisibleSelected ? new Set() : new Set(filteredProducts.map(p => p.id)))}
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
