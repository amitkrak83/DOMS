'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Banknote, CheckCircle, Smartphone, X, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { sendNotification } from '@/lib/notify'

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
        <div className="w-full flex items-center justify-between">
          <p className="font-bold text-gray-900 text-base">Scan &amp; Pay</p>
          <button onClick={onClose} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="bg-blue-50 rounded-xl px-6 py-3 text-center w-full">
          <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Amount to Pay</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">₹{amount.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <QRCodeSVG value={upiString} size={200} bgColor="#ffffff" fgColor="#111827" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold text-gray-800">{merchantName}</p>
          <p className="text-xs text-gray-400">UPI: {upiId}</p>
        </div>
        <div className="flex gap-3 text-xs font-medium text-gray-400">
          <span>GPay</span><span>·</span><span>PhonePe</span><span>·</span><span>Paytm</span><span>·</span><span>BHIM</span>
        </div>
        <button onClick={onClose} className="w-full h-11 rounded-xl bg-gray-900 text-white font-bold text-sm active:scale-95 transition-transform">
          Done
        </button>
      </div>
    </div>,
    document.body
  )
}

export function DeliverSection({ orderId, totalAmount, upiId, merchantName, alreadyPaid }: {
  orderId: string
  totalAmount: number
  upiId: string
  merchantName: string
  alreadyPaid: number
}) {
  const [paymentType, setPaymentType] = useState<'cash' | 'online' | null>(null)
  const [amountReceived, setAmountReceived] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [collectLoading, setCollectLoading] = useState(false)
  const [deliverLoading, setDeliverLoading] = useState(false)
  const router = useRouter()

  const outstanding = totalAmount - alreadyPaid
  const qrAmount = parseFloat(amountReceived) || outstanding
  const udharAfterCollect = outstanding - (parseFloat(amountReceived) || 0)

  async function handleCollectPayment() {
    if (!paymentType) return
    const paid = parseFloat(amountReceived) || 0
    if (paid <= 0) { toast.error('Enter a valid amount'); return }
    if (paid > outstanding) { toast.error('Amount cannot exceed outstanding'); return }
    setCollectLoading(true)
    const { error } = await supabase.from('payments').insert({
      order_id: orderId,
      payment_type: paymentType,
      amount: paid,
    })
    setCollectLoading(false)
    if (error) { toast.error('Failed to record payment'); return }
    toast.success('Payment recorded')
    sendNotification('payment_recorded', '💰 Payment Received', `₹${paid.toLocaleString('en-IN')} ${paymentType} payment recorded`)
    setPaymentType(null)
    setAmountReceived('')
    router.refresh()
  }

  async function handleMarkDelivered() {
    setDeliverLoading(true)

    const { error: orderErr } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)

    if (orderErr) { toast.error('Failed to update order'); setDeliverLoading(false); return }

    // Auto-record remaining as udhar
    const remaining = totalAmount - alreadyPaid
    if (remaining > 0) {
      const { error: payErr } = await supabase.from('payments').insert({
        order_id: orderId,
        payment_type: 'credit',
        amount: remaining,
      })
      if (payErr) { toast.error('Failed to record udhar'); setDeliverLoading(false); return }
    }

    setDeliverLoading(false)
    toast.success('Order delivered')
    sendNotification('order_delivered', '✅ Order Delivered', `Order marked as delivered`)
    router.refresh()
  }

  return (
    <>
      {showQR && <QRModal amount={qrAmount} upiId={upiId} merchantName={merchantName} onClose={() => setShowQR(false)} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <p className="font-bold text-gray-900">Collect Payment</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setPaymentType('cash'); setAmountReceived(outstanding.toString()) }}
            className={`h-14 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-colors ${
              paymentType === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-300'
            }`}
          >
            <Banknote size={20} className={paymentType === 'cash' ? 'text-green-600' : 'text-gray-400'} />
            <span className={`text-xs font-bold ${paymentType === 'cash' ? 'text-green-700' : 'text-gray-600'}`}>Cash</span>
          </button>

          <button
            type="button"
            onClick={() => { setPaymentType('online'); setAmountReceived(outstanding.toString()) }}
            className={`h-14 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-colors ${
              paymentType === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300'
            }`}
          >
            <Smartphone size={20} className={paymentType === 'online' ? 'text-blue-600' : 'text-gray-400'} />
            <span className={`text-xs font-bold ${paymentType === 'online' ? 'text-blue-700' : 'text-gray-600'}`}>Online</span>
          </button>
        </div>

        {paymentType && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount (₹)</label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setAmountReceived(outstanding.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"
              >
                FULL
              </button>
            </div>
            {udharAfterCollect > 0 && (
              <p className="text-[10px] font-medium text-orange-600 px-1">
                ₹{udharAfterCollect.toLocaleString('en-IN')} remaining will be Udhar on delivery
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
          onClick={handleCollectPayment}
          disabled={!paymentType || collectLoading}
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all active:scale-[0.98]"
        >
          {collectLoading ? 'Recording...' : 'Collect Payment'}
        </button>

        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={handleMarkDelivered}
            disabled={deliverLoading}
            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <CheckCircle size={18} />
            {deliverLoading ? 'Processing...' : 'Mark as Delivered'}
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">Remaining amount will be auto-recorded as Udhar</p>
        </div>
      </div>
    </>
  )
}
