'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateScheme, formatQuantity, aggregateOrderSummary } from '@/lib/calculations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Pencil, ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { CustomerSearch, type SelectedCustomer } from '@/components/orders/customer-search'

export type Variant = {
  id: string
  variant_name: string
  bottles_per_case: number
  price_per_case: number
  free_bottles_per_case: number
}

export type Product = {
  id: string
  name: string
  product_variants: Variant[]
}

export type OrderItem = {
  product: Product
  variant: Variant
  cases: number
  itemId?: string  // DB id; present only when loaded from an existing order
}

type Props = {
  products: Product[]
  initialCustomerName?: string
  initialItems?: OrderItem[]
  editOrderId?: string
}

export function NewOrderForm({ products, initialCustomerName = '', initialItems = [], editOrderId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(editOrderId ? 2 : 1)
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(
    initialCustomerName ? { name: initialCustomerName, mobile: '', address: '' } : null
  )
  const [items, setItems] = useState<OrderItem[]>(initialItems)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [casesInput, setCasesInput] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const selectedVariant = selectedProduct?.product_variants.find(v => v.id === selectedVariantId)

  function resetForm() {
    setSelectedProductId('')
    setSelectedVariantId('')
    setCasesInput('')
    setEditingIndex(null)
  }

  function addOrUpdateItem() {
    if (!selectedProduct || !selectedVariant || !casesInput) return
    const cases = parseInt(casesInput)
    if (cases <= 0) return

    if (editingIndex !== null) {
      setItems(prev => prev.map((item, i) =>
        i === editingIndex ? { product: selectedProduct, variant: selectedVariant, cases } : item
      ))
    } else {
      setItems(prev => [...prev, { product: selectedProduct, variant: selectedVariant, cases }])
    }
    resetForm()
  }

  function startEdit(index: number) {
    const item = items[index]
    setSelectedProductId(item.product.id)
    setSelectedVariantId(item.variant.id)
    setCasesInput(String(item.cases))
    setEditingIndex(index)
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
    if (editingIndex === index) resetForm()
  }

  const computedItems = useMemo(() => items.map(item => {
    const scheme = calculateScheme(item.cases, item.variant)
    const schemeCases = Math.floor(scheme.free_bottles / item.variant.bottles_per_case)
    const schemeBottles = scheme.free_bottles % item.variant.bottles_per_case
    return { ...item, scheme, schemeCases, schemeBottles }
  }), [items])

  const summary = useMemo(() => aggregateOrderSummary(
    computedItems.map(i => ({ cases: i.cases, amount: i.scheme.amount }))
  ), [computedItems])

  async function confirmOrder() {
    setSaving(true)

    if (editOrderId) {
      // Safe upsert: update existing rows by ID, insert extras, delete removed ones.
      // Never deletes before insert succeeds — preserves data on partial failure.
      const existingIds = initialItems.map(i => i.itemId).filter((id): id is string => !!id)
      const updateCount = Math.min(existingIds.length, computedItems.length)

      const itemData = (i: typeof computedItems[number]) => ({
        variant_id: i.variant.id,
        cases: i.cases,
        free_bottles: i.scheme.free_bottles,
        total_bottles: i.scheme.total_bottles,
        amount: i.scheme.amount,
        price_per_case_snapshot: i.variant.price_per_case,
      })

      const updateOps = Array.from({ length: updateCount }, (_, idx) =>
        supabase.from('order_items').update(itemData(computedItems[idx])).eq('id', existingIds[idx])
      )
      const toInsert = computedItems.slice(updateCount).map(i => ({ order_id: editOrderId, ...itemData(i) }))
      const toDeleteIds = existingIds.slice(computedItems.length)

      const allResults = await Promise.all([
        supabase.from('orders').update({ total_amount: summary.total_amount }).eq('id', editOrderId),
        ...updateOps,
        ...(toInsert.length > 0 ? [supabase.from('order_items').insert(toInsert)] : []),
        ...(toDeleteIds.length > 0 ? [supabase.from('order_items').delete().in('id', toDeleteIds)] : []),
      ])

      setSaving(false)
      if (allResults.some(r => r.error)) { toast.error('Failed to update order'); return }
      toast.success('Order updated!')
      router.push(`/orders/${editOrderId}`)
    } else {
      // Create customer if new
      let customerId = selectedCustomer?.id
      if (!customerId && selectedCustomer?.name.trim()) {
        const { data: nc, error: custErr } = await supabase
          .from('customers')
          .insert({ name: selectedCustomer.name.trim(), mobile: selectedCustomer.mobile || null, address: selectedCustomer.address || null })
          .select('id')
          .single()
        if (custErr || !nc) { toast.error('Failed to save customer'); setSaving(false); return }
        customerId = nc.id
      }

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ customer_name: selectedCustomer!.name.trim(), customer_id: customerId, status: 'pending', total_amount: summary.total_amount })
        .select('id')
        .single()

      if (orderErr || !order) { toast.error('Failed to create order'); setSaving(false); return }

      const itemsToInsert = computedItems.map(i => ({
        order_id: order.id,
        variant_id: i.variant.id,
        cases: i.cases,
        free_bottles: i.scheme.free_bottles,
        total_bottles: i.scheme.total_bottles,
        amount: i.scheme.amount,
        price_per_case_snapshot: i.variant.price_per_case,
      }))

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert)
      setSaving(false)
      if (itemsErr) { toast.error('Failed to save items'); return }
      toast.success('Order created!')
      router.push(`/orders/${order.id}`)
    }
  }

  // ── Step 1: Customer name ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 pt-5 pb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Order</h1>
            <p className="text-xs text-gray-400">Step 1 of 3 — Customer</p>
          </div>
        </div>
        <div className="px-4 py-5 space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Customer</Label>
            <CustomerSearch value={selectedCustomer} onChange={setSelectedCustomer} />
          </div>
          <Button className="w-full gap-2 h-12 text-base font-bold bg-blue-600 hover:bg-blue-700" disabled={!selectedCustomer?.name.trim()} onClick={() => setStep(2)}>
            Next — Add Items <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 2: Add items ──────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 pb-36">
        <div className="bg-white border-b border-gray-200 px-4 pt-5 pb-4 flex items-center gap-3">
          <button onClick={() => editOrderId ? router.back() : setStep(1)} className="text-gray-500"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{editOrderId ? 'Edit Items' : 'Add Items'}</h1>
            <p className="text-xs text-gray-400">{editOrderId ? 'Editing' : 'Step 2 of 3'} — {selectedCustomer?.name ?? ''}</p>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Add item card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            {editingIndex !== null && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-blue-600">Editing item #{editingIndex + 1}</p>
                <button onClick={resetForm} className="text-xs text-gray-400 underline">Cancel</button>
              </div>
            )}

            {/* Product + Variant row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Product</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(v: string | null) => {
                    setSelectedProductId(v ?? '')
                    setSelectedVariantId('')
                  }}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue>
                      {selectedProductId
                        ? products.find(p => p.id === selectedProductId)?.name
                        : <span className="text-gray-400">Select product</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Variant</Label>
                <Select
                  value={selectedVariantId}
                  onValueChange={(v: string | null) => setSelectedVariantId(v ?? '')}
                  disabled={!selectedProduct}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue>
                      {selectedVariantId
                        ? selectedProduct?.product_variants.find(v => v.id === selectedVariantId)?.variant_name
                        : <span className="text-gray-400">Select variant</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedProduct?.product_variants ?? []).map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.variant_name} — ₹{v.price_per_case}/case
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Qty inline row */}
            <div className="flex items-center gap-3">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide shrink-0">Qty (Cases)</Label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCasesInput(v => String(Math.max(1, parseInt(v || '1') - 1)))}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-bold text-lg flex items-center justify-center active:bg-gray-100"
                >−</button>
                <Input
                  type="number"
                  min="1"
                  value={casesInput}
                  placeholder="0"
                  onChange={e => setCasesInput(e.target.value)}
                  className="text-base h-9 text-center w-14 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setCasesInput(v => String((parseInt(v || '0') || 0) + 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-bold text-lg flex items-center justify-center active:bg-gray-100"
                >+</button>
              </div>
              <Button
                onClick={addOrUpdateItem}
                disabled={!selectedProduct || !selectedVariant || !casesInput}
                className="ml-auto h-9 px-5 font-bold bg-blue-600 hover:bg-blue-700"
              >
                {editingIndex !== null ? 'Update' : 'Add'}
              </Button>
            </div>

            {selectedVariant && casesInput && (
              <p className="text-xs text-gray-400">
                ₹{selectedVariant.price_per_case}/case
                {selectedVariant.free_bottles_per_case > 0 && ` · +${selectedVariant.free_bottles_per_case} free bottle/case`}
              </p>
            )}
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <p className="px-4 py-2.5 text-sm font-bold text-gray-700 border-b border-gray-100">
                Added Items
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-3 py-2 font-bold text-gray-600 text-xs">Item</th>
                      <th className="text-center px-2 py-2 font-bold text-gray-600 text-xs">Cases</th>
                      <th className="text-center px-2 py-2 font-bold text-gray-600 text-xs">Scheme</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-600 text-xs">Amount</th>
                      <th className="px-2 py-2 w-14"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedItems.map(({ product, variant, cases, scheme, schemeCases, schemeBottles }, i) => (
                      <tr key={i} className={`border-b border-gray-50 last:border-0 ${editingIndex === i ? 'bg-blue-50' : ''}`}>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-gray-900 text-xs leading-tight">{product.name}</p>
                          <p className="text-gray-400 text-xs">{variant.variant_name}</p>
                        </td>
                        <td className="px-2 py-2.5 text-center font-semibold text-gray-700">{cases}</td>
                        <td className="px-2 py-2.5 text-center">
                          {scheme.free_bottles === 0
                            ? <span className="text-gray-300 text-xs">—</span>
                            : <span className="text-green-600 font-bold text-xs">{formatQuantity(schemeCases, schemeBottles)}</span>
                          }
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                          ₹{scheme.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEdit(i)} className="text-blue-400 hover:text-blue-600 p-0.5">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 p-0.5">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Frozen Review Order button */}
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 max-w-2xl mx-auto">
          <Button
            className="w-full gap-2 h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg"
            disabled={items.length === 0}
            onClick={() => setStep(3)}
          >
            Review Order <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 3: Summary ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <div className="bg-white border-b border-gray-200 px-4 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => setStep(2)} className="text-gray-500"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order Summary</h1>
          <p className="text-xs text-gray-400">{editOrderId ? 'Review changes' : 'Step 3 of 3'} — {selectedCustomer?.name ?? ''}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
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
                {computedItems.map(({ product, variant, cases, scheme, schemeCases, schemeBottles }, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-400">{variant.variant_name}</p>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-700">{cases}</td>
                    <td className="px-3 py-3 text-center">
                      {scheme.free_bottles === 0
                        ? <span className="text-gray-300">—</span>
                        : <span className="text-green-600 font-bold text-xs">{formatQuantity(schemeCases, schemeBottles)}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{scheme.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary totals */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl border-l-4 border-blue-500 shadow-sm p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Paid Cases</span>
            <span className="font-bold text-gray-900">{summary.total_paid_cases} Case</span>
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between text-sm">
            <span className="font-bold text-gray-900">Grand Total</span>
            <span className="font-bold text-blue-700 text-base">₹{summary.total_amount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Frozen Edit + Confirm buttons */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-40 max-w-2xl mx-auto flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 font-bold border-gray-300 text-gray-700"
          onClick={() => setStep(2)}
        >
          ← Edit Order
        </Button>
        <Button
          className="flex-1 gap-2 h-12 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={confirmOrder}
          disabled={saving}
        >
          <ShoppingCart size={18} />
          {saving ? 'Saving...' : editOrderId ? 'Update Order' : 'Confirm Order'}
        </Button>
      </div>
    </div>
  )
}
