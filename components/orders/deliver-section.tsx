'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Banknote, BookOpen, CheckCircle, Smartphone, X, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

function QRModal({ amount, upiId, merchantName, onClose }: { amount: number; upiId: string; merchantName: string; onClose: () => void }) {
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <p className="font-bold text-gray-900 text-base">Scan &amp; Pay</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount */}
        <div className="bg-blue-50 rounded-xl px-6 py-3 text-center w-full">
          <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Amount to Pay</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">₹{amount.toLocaleString('en-IN')}</p>
        </div>

        {/* QR */}
        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <QRCodeSVG value={upiString} size={200} bgColor="#ffffff" fgColor="#111827" />
        </div>

        {/* Merchant info */}
        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold text-gray-800">{merchantName}</p>
          <p className="text-xs text-gray-400">UPI: {upiId}</p>
        </div>

        {/* App logos (text) */}
        <div className="flex gap-3 text-xs font-medium text-gray-400">
          <span>GPay</span><span>·</span><span>PhonePe</span><span>·</span><span>Paytm</span><span>·</span><span>BHIM</span>
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-gray-900 text-white font-bold text-sm active:scale-95 transition-transform"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  )
}

export function DeliverSection({ orderId, totalAmount, upiId, merchantName }: {
  orderId: string
  totalAmount: number
  upiId: string
  merchantName: string
}) {
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'online' | null>(null)
  const [amountReceived, setAmountReceived] = useState(totalAmount.toString())
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function markDelivered() {
    if (!paymentType) return

    const paidAmount = paymentType === 'credit' ? 0 : (parseFloat(amountReceived) || 0)
    const creditAmount = totalAmount - paidAmount

    if (paymentType !== 'credit') {
      if (paidAmount < 0) { toast.error('Amount cannot be negative'); return }
      if (paidAmount > totalAmount) { toast.error('Amount cannot exceed total'); return }
    }

    setLoading(true)

    const { error: orderErr } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)

    if (orderErr) { toast.error('Failed to update order'); setLoading(false); return }

    const payments: { order_id: string; payment_type: string; amount: number }[] = []
    if (paidAmount > 0) {
      payments.push({ order_id: orderId, payment_type: paymentType, amount: paidAmount })
    }
    if (creditAmount > 0) {
      payments.push({ order_id: orderId, payment_type: 'credit', amount: creditAmount })
    }

    if (payments.length > 0) {
      const { error: payErr } = await supabase.from('payments').insert(payments)
      if (payErr) { toast.error('Failed to record payment'); setLoading(false); return }
    }

    setLoading(false)
    toast.success('Order delivered')
    router.push('/orders')
  }

  const qrAmount = parseFloat(amountReceived) || totalAmount

  return (
    <>
      {showQR && <QRModal amount={qrAmount} upiId={upiId} merchantName={merchantName} onClose={() => setShowQR(false)} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <p className="font-bold text-gray-900 text-sm">Payment Mode</p>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { setPaymentType('cash'); setAmountReceived(totalAmount.toString()) }}
            className={`h-16 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-colors ${
              paymentType === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-300'
            }`}
          >
            <Banknote size={20} className={paymentType === 'cash' ? 'text-green-600' : 'text-gray-400'} />
            <span className={`text-xs font-bold ${paymentType === 'cash' ? 'text-green-700' : 'text-gray-600'}`}>Cash</span>
          </button>

          <button
            type="button"
            onClick={() => { setPaymentType('online'); setAmountReceived(totalAmount.toString()) }}
            className={`h-16 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-colors ${
              paymentType === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300'
            }`}
          >
            <Smartphone size={20} className={paymentType === 'online' ? 'text-blue-600' : 'text-gray-400'} />
            <span className={`text-xs font-bold ${paymentType === 'online' ? 'text-blue-700' : 'text-gray-600'}`}>Online</span>
          </button>

          <button
            type="button"
            onClick={() => { setPaymentType('credit'); setAmountReceived('0') }}
            className={`h-16 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-colors ${
              paymentType === 'credit' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-orange-300'
            }`}
          >
            <BookOpen size={20} className={paymentType === 'credit' ? 'text-orange-500' : 'text-gray-400'} />
            <span className={`text-xs font-bold ${paymentType === 'credit' ? 'text-orange-700' : 'text-gray-600'}`}>Udhar</span>
          </button>
        </div>

        {(paymentType === 'cash' || paymentType === 'online') && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount Received (₹)</label>
            <div className="relative">
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
                placeholder="0.00"
              />
              <button
                type="button"
                onClick={() => setAmountReceived(totalAmount.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"
              >
                FULL
              </button>
            </div>
            {parseFloat(amountReceived) < totalAmount && (
              <p className="text-[10px] font-medium text-orange-600 px-1">
                ₹{(totalAmount - (parseFloat(amountReceived) || 0)).toLocaleString('en-IN')} will be recorded as Udhar
              </p>
            )}
          </div>
        )}

        {paymentType === 'online' && (
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <QrCode size={18} />
            Show QR Code — ₹{qrAmount.toLocaleString('en-IN')}
          </button>
        )}

        <button
          onClick={markDelivered}
          disabled={!paymentType || loading}
          className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <CheckCircle size={18} />
          {loading ? 'Processing...' : 'Mark as Delivered'}
        </button>
      </div>
    </>
  )
}
