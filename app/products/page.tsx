import { createClient } from '@/lib/supabase-server'
import { AddProductDialog } from '@/components/products/add-product-dialog'
import { ProductsList } from '@/components/products/products-list'
import { PageHeader } from '@/components/page-header'

async function getProducts() {
  const supabase = await createClient()
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
      <div className="sticky top-0 z-30 bg-white">
        <PageHeader title="Products" />
      </div>

      <ProductsList initialProducts={products} />
      <AddProductDialog />
    </div>
  )
}
