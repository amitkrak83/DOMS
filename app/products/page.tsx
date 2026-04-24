import { supabase } from '@/lib/supabase'
import { AddProductDialog } from '@/components/products/add-product-dialog'
import { ProductsList } from '@/components/products/products-list'

async function getProducts() {
  const { data } = await supabase
    .from('products')
    .select('id, name, product_variants(id, variant_name, bottles_per_case, price_per_case, free_bottles_per_case)')
    .order('name')
  return data ?? []
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Products</h1>
        <AddProductDialog />
      </div>

      <ProductsList initialProducts={products} />
    </div>
  )
}
