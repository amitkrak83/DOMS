import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatQuantity, aggregateOrderSummary } from '@/lib/calculations'
import { ArrowLeft, Banknote, BookOpen, Pencil } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { DeliverSection } from '@/components/orders/deliver-section'
import { UndeliverButton } from '@/components/orders/undeliver-button'

async function getOrder(id: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_name, status, total_amount, created_at')
    .eq('id', id)
    .single()

  if (!order) return null

  const { data: items } = await supabase
    .from('order_items')
    .select('id, cases, free_bottles, total_bottles, amount, price_per_case_snapshot, product_variants(id, variant_name, bottles_per_case, free_bottles_per_case, products(name))')
    .eq('order_id', id)

  const { data: payments } = await supabase
    .from('payments')
    .select('id, payment_type, amount, created_at')
    .eq('order_id', id)

  return { order, items: items ?? [], payments: payments ?? [] }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getOrder(id)
  if (!result) notFound()

  const { order, items, payments } = result

  const computedItems = items.map(item => {
    const v = item.product_variants
    const bpc = v?.bottles_per_case ?? 24
    const schemeCases = Math.floor(item.free_bottles / bpc)
    const schemeBottles = item.free_bottles % bpc
    return { item, schemeCases, schemeBottles }
  })

  const summary = aggregateOrderSummary(
    items.map(i => ({
      cases: i.cases,
      free_bottles: i.free_bottles,
      total_bottles: i.total_bottles,
      amount: Number(i.amount),
      bottles_per_case: i.product_variants?.bottles_per_case ?? 24,
    }))
  )

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const outstanding = Number(order.total_amount) - totalPaid

  const orderIdShort = order.id.slice(-5).toUpperCase()
  const orderDate = new Date(order.created_at)
  const displayOrderId = `ORD-${orderDate.getFullYear()}-${orderIdShort}`

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-lg font-bold text-gray-900">Order Details</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {order.status === 'pending' && (
            <Link href={`/orders/${order.id}/edit`}>
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 active:scale-95 transition-transform">
                <Pencil size={12} />
                Edit
              </span>
            </Link>
          )}
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
            order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
          }`}>
            {order.status === 'pending' ? 'Pending' : 'Delivered'}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Customer Details Block */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
            <span className="text-gray-500 font-medium">Order ID</span>
            <span className="text-gray-900 font-bold">{displayOrderId}</span>
            
            <span className="text-gray-500 font-medium">Customer</span>
            <span className="text-gray-900 font-bold">{order.customer_name}</span>
            
            <span className="text-gray-500 font-medium">Date</span>
            <span className="text-gray-900 font-bold">
              {orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-bold text-gray-600">Item</th>
                  <th className="text-center px-3 py-3 font-bold text-gray-600">Qty (Cases)</th>
                  <th className="text-center px-3 py-3 font-bold text-gray-600">Scheme</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {computedItems.map(({ item, schemeCases, schemeBottles }) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{(item.product_variants as any)?.products?.name}</p>
                      <p className="text-xs text-gray-400">{item.product_variants?.variant_name}</p>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-700">{item.cases}</td>
                    <td className="px-3 py-3 text-center">
                      {item.free_bottles === 0
                        ? <span className="text-gray-300">—</span>
                        : <span className="text-green-600 font-bold text-xs">{formatQuantity(schemeCases, schemeBottles)}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl border-l-4 border-blue-500 shadow-sm p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Paid Cases</span>
            <span className="font-bold text-gray-900">{summary.total_paid_cases} Case</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Scheme</span>
            <span className="font-bold text-green-600">{summary.scheme_display}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between text-sm">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="font-bold text-blue-700 text-base">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment info */}
        {payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
            <p className="font-bold text-gray-900 text-sm">Payment</p>
            {payments.map(p => (
              <div key={p.id} className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 text-gray-600">
                  {p.payment_type === 'cash'
                    ? <><Banknote size={16} className="text-green-600" /> Cash</>
                    : <><BookOpen size={16} className="text-orange-500" /> Udhar</>
                  }
                </span>
                <span className="font-bold text-gray-900">₹{Number(p.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {outstanding > 0 && (
              <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                <span className="font-bold text-red-600">Remaining</span>
                <span className="font-bold text-red-600">₹{outstanding.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {order.status === 'pending' && (
          <DeliverSection orderId={order.id} totalAmount={Number(order.total_amount)} />
        )}
        {order.status === 'delivered' && (
          <UndeliverButton orderId={order.id} />
        )}

      </div>
    </div>
  )
}
