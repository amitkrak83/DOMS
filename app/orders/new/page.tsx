import { supabase } from '@/lib/supabase'
import { NewOrderForm } from '@/components/orders/new-order-form'

async function getProductsWithVariants() {
  const { data } = await supabase
    .from('products')
    .select('id, name, product_variants(id, variant_name, bottles_per_case, price_per_case, free_bottles_per_case)')
    .order('name')
  return data ?? []
}

export default async function NewOrderPage() {
  const products = await getProductsWithVariants()
  return <NewOrderForm products={products} />
}
