'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Banknote, BookOpen, Smartphone, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

type Payment = {
  id: string
  payment_type: string
  amount: number
  created_at: string
}

const TYPE_ORDER = ['cash', 'online', 'credit']

function typeIcon(type: string) {
  if (type === 'cash') return <Banknote size={16} className="text-green-600" />
  if (type === 'online') return <Smartphone size={16} className="text-blue-600" />
  return <BookOpen size={16} className="text-orange-500" />
}

function typeLabel(type: string) {
  if (type === 'cash') return 'Cash'
  if (type === 'online') return 'Online'
  return 'Udhar'
}

export function PaymentsList({ payments, outstanding }: { payments: Payment[]; outstanding: number }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editType, setEditType] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const router = useRouter()

  function startEdit(p: Payment) {
    setEditingId(p.id)
    setEditAmount(p.amount.toString())
    setEditType(p.payment_type)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditAmount('')
    setEditType('')
  }

  async function saveEdit(p: Payment) {
    const amt = parseFloat(editAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    const { error } = await supabase
      .from('payments')
      .update({ amount: Math.round(amt * 100) / 100, payment_type: editType })
      .eq('id', p.id)
    setLoading(false)
    if (error) { toast.error('Failed to update payment'); return }
    toast.success('Payment updated')
    cancelEdit()
    router.refresh()
  }

  async function deletePayment(p: Payment) {
    if (!confirm(`Delete this ₹${p.amount} ${p.payment_type} payment?`)) return
    setLoading(true)
    const { error } = await supabase.from('payments').delete().eq('id', p.id)
    setLoading(false)
    if (error) { toast.error('Failed to delete payment'); return }
    toast.success('Payment deleted')
    router.refresh()
  }

  // Group by payment type, preserve TYPE_ORDER
  const grouped = TYPE_ORDER
    .map(type => ({ type, items: payments.filter(p => p.payment_type === type) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
      <p className="font-bold text-gray-900 text-sm">Payment</p>

      {grouped.length === 0 && (
        <p className="text-xs text-gray-400">No payments recorded yet</p>
      )}

      {grouped.map(({ type, items }) => {
        const total = items.reduce((s, p) => s + p.amount, 0)
        const multi = items.length > 1

        const singleP = !multi ? items[0] : null

        return (
          <div key={type}>
            {/* Single payment being edited — full-width edit form */}
            {singleP && editingId === singleP.id ? (
              <div className="flex items-center gap-2 py-1">
                <select value={editType} onChange={e => setEditType(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-medium">
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="credit">Udhar</option>
                </select>
                <input type="number" inputMode="numeric" min="0" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                  className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => saveEdit(singleP)} disabled={loading} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"><Check size={14} /></button>
                <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={14} /></button>
              </div>
            ) : (
              /* Normal header row: icon + label | amount + actions */
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 text-gray-600 font-medium">
                  {typeIcon(type)} {typeLabel(type)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                  {singleP && (
                    <>
                      <button onClick={() => startEdit(singleP)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil size={13} /></button>
                      <button onClick={() => deletePayment(singleP)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 size={13} /></button>
                    </>
                  )}
                  {multi && (
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [type]: !prev[type] }))}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-transform duration-200"
                      style={{ transform: expanded[type] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <ChevronDown size={15} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Multi sub-rows: collapsed by default */}
            {multi && expanded[type] && (
              <div className="mt-1 ml-6 space-y-1">
                {items.map(p => (
                  <div key={p.id}>
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2 py-1">
                        <select value={editType} onChange={e => setEditType(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-medium">
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                          <option value="credit">Udhar</option>
                        </select>
                        <input type="number" inputMode="numeric" min="0" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                          className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
                        <button onClick={() => saveEdit(p)} disabled={loading} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"><Check size={14} /></button>
                        <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs items-center text-gray-500">
                        <span>₹{p.amount.toLocaleString('en-IN')}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(p)} className="p-1 hover:text-blue-600 rounded"><Pencil size={12} /></button>
                          <button onClick={() => deletePayment(p)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {outstanding > 0 && (
        <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
          <span className="font-bold text-red-600">Remaining</span>
          <span className="font-bold text-red-600">₹{outstanding.toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  )
}
