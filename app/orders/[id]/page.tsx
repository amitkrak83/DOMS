import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { formatQuantity, aggregateOrderSummary } from '@/lib/calculations'
import { Pencil } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { DeliverSection } from '@/components/orders/deliver-section'
import { RecordPaymentSection } from '@/components/orders/record-payment-section'
import { PaymentsList } from '@/components/orders/payments-list'
import { OrderActivity } from '@/components/orders/order-activity'
import { DeleteOrderButton } from '@/components/orders/delete-order-button'
import { ShareOrderButton } from '@/components/orders/share-order-button'

async function getOrder(id: string) {
  const supabase = await createClient()

  const [{ data: order }, { data: items }, { data: payments }, { data: settings }] = await Promise.all([
    supabase.from('orders').select('id, customer_name, customer_id, status, total_amount, created_at, customers(mobile, address)').eq('id', id).single(),
    supabase.from('order_items').select('id, cases, free_bottles, total_bottles, amount, price_per_case_snapshot, product_variants(id, variant_name, bottles_per_case, free_bottles_per_case, products(name))').eq('order_id', id),
    supabase.from('payments').select('id, payment_type, amount, created_at').eq('order_id', id),
    supabase.from('app_settings').select('key, value'),
  ])

  if (!order) return null

  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))

  return {
    order,
    items: items ?? [],
    payments: payments ?? [],
    upiId: settingsMap['upi_id'] ?? process.env.NEXT_PUBLIC_UPI_ID ?? '',
    merchantName: settingsMap['merchant_name'] ?? process.env.NEXT_PUBLIC_MERCHANT_NAME ?? '',
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getOrder(id)
  if (!result) notFound()

  const { order, items, payments, upiId, merchantName } = result

  const customerInfo = (order as any).customers as { mobile: string | null; address: string | null } | null

  const computedItems = items.map(item => {
    const v = item.product_variants
    const bpc = v?.bottles_per_case ?? 24
    const schemeCases = Math.floor(item.free_bottles / bpc)
    const schemeBottles = item.free_bottles % bpc
    return { item, schemeCases, schemeBottles }
  })

  const summary = aggregateOrderSummary(
    items.map(i => ({ cases: i.cases, amount: Number(i.amount) }))
  )

  const totalPaid = payments.filter(p => p.payment_type !== 'credit').reduce((s, p) => s + Number(p.amount), 0)
  const outstanding = Number(order.total_amount) - totalPaid

  const orderIdShort = order.id.slice(-5).toUpperCase()
  const orderDate = new Date(order.created_at)
  const displayOrderId = `ORD-${orderDate.getFullYear()}-${orderIdShort}`
  const IST = { timeZone: 'Asia/Kolkata' } as const
  const orderDateStr = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...IST })

  const colCount = order.status === 'pending' ? 3 : 2

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-lg font-bold text-gray-900">Order Details</h1>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
          order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
        }`}>
          {order.status === 'pending' ? 'Pending' : 'Delivered'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {order.status === 'pending' && (
          <Link href={`/orders/${order.id}/edit`} className="flex items-center justify-center gap-1.5 h-10 text-sm font-bold rounded-xl bg-blue-50 text-blue-600 border border-blue-100 active:scale-95 transition-transform">
            <Pencil size={14} />
            Edit
          </Link>
        )}
        <ShareOrderButton displayOrderId={displayOrderId} />
        <DeleteOrderButton orderId={order.id} />
      </div>

      <div className="px-4 py-4 pb-6 space-y-4 bg-gray-50" id="order-share-content">
        {/* Customer Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
            <span className="text-gray-500 font-medium">Customer</span>
            <span className="text-gray-900 font-bold">{order.customer_name}</span>

            {customerInfo?.mobile && (
              <>
                <span className="text-gray-500 font-medium">Mobile</span>
                <span className="text-gray-900 font-bold">{customerInfo.mobile}</span>
              </>
            )}

            {customerInfo?.address && (
              <>
                <span className="text-gray-500 font-medium">Address</span>
                <span className="text-gray-900 font-bold">{customerInfo.address}</span>
              </>
            )}

            <span className="text-gray-500 font-medium">Date</span>
            <span className="text-gray-900 font-bold">
              {orderDateStr}, {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', ...IST })}
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
                  <th className="text-center px-3 py-3 font-bold text-gray-600">Qty</th>
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
          <div className="border-t border-blue-200 pt-2 flex justify-between text-sm">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="font-bold text-blue-700 text-base">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment info */}
        {payments.length > 0 && (
          <PaymentsList payments={payments.map(p => ({ ...p, amount: Number(p.amount) }))} outstanding={outstanding} />
        )}

      </div>

      {/* Actions outside share content */}
      <div className="px-4 space-y-4">
        {order.status === 'pending' && (
          <DeliverSection orderId={order.id} totalAmount={Number(order.total_amount)} upiId={upiId} merchantName={merchantName} alreadyPaid={totalPaid} />
        )}
        {order.status === 'delivered' && outstanding > 0 && (
          <RecordPaymentSection orderId={order.id} outstanding={outstanding} />
        )}

        {/* Activity timeline — outside share content, always last */}
        <OrderActivity orderId={order.id} />
      </div>
    </div>
  )
}
