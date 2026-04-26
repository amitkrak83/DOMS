import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { NewOrderForm, type Product, type OrderItem } from '@/components/orders/new-order-form'

async function getEditData(id: string) {
  const supabase = await createClient()
  const [productsRes, orderRes, itemsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, product_variants(id, variant_name, bottles_per_case, price_per_case, free_bottles_per_case)')
      .order('name'),
    supabase
      .from('orders')
      .select('id, customer_name, status')
      .eq('id', id)
      .single(),
    supabase
      .from('order_items')
      .select('id, cases, variant_id')
      .eq('order_id', id),
  ])

  const order = orderRes.data
  if (!order || order.status !== 'pending') return null

  const products = (productsRes.data ?? []) as Product[]
  const dbItems = (itemsRes.data ?? []) as { id: string; cases: number; variant_id: string }[]

  const initialItems: OrderItem[] = []
  for (const dbItem of dbItems) {
    for (const product of products) {
      const variant = product.product_variants.find(v => v.id === dbItem.variant_id)
      if (variant) {
        initialItems.push({ product, variant, cases: dbItem.cases, itemId: dbItem.id })
        break
      }
    }
  }

  return { products, order, initialItems }
}

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getEditData(id)
  if (!data) notFound()

  return (
    <NewOrderForm
      products={data.products}
      initialCustomerName={data.order.customer_name}
      initialItems={data.initialItems}
      editOrderId={id}
    />
  )
}
