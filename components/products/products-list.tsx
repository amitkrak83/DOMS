'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
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

  const filteredProducts = initialProducts.filter(p => {
    const matchesProductName = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesVariantName = p.product_variants.some(v => v.variant_name.toLowerCase().includes(search.toLowerCase()))
    return matchesProductName || matchesVariantName
  })

  return (
    <div>
      {/* Search Bar */}
      <div className="sticky top-[64px] z-20 bg-white px-4 pb-3 shadow-sm border-b border-gray-100 !mt-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products or variants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          />
        </div>
      </div>

      <div className="px-4 space-y-3 pt-4">
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500">No matching products</p>
          </div>
        )}

        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900">{product.name}</p>
                <DeleteProductButton productId={product.id} productName={product.name} />
              </div>
              <AddVariantDialog productId={product.id} productName={product.name} />
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
                    <EditVariantDialog variant={v} />
                    <DeleteVariantButton variantId={v.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
