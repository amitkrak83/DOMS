'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareOrderButtonProps {
  displayOrderId: string
}

export function ShareOrderButton({ displayOrderId }: ShareOrderButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    const element = document.getElementById('order-share-content')
    if (!element) { toast.error('Nothing to capture'); return }

    setLoading(true)
    try {
      const { toBlob } = await import('html-to-image')

      // Temporarily expand element so full content is captured (not just viewport)
      const prevOverflow = element.style.overflow
      element.style.overflow = 'visible'

      const blob = await toBlob(element, {
        pixelRatio: 2,
        style: { borderRadius: '0' },
        filter: (node) => {
          // exclude any sticky headers that may be cut weirdly
          if (node instanceof HTMLElement && node.classList.contains('sticky')) return false
          return true
        },
      })

      element.style.overflow = prevOverflow

      if (!blob) throw new Error('empty blob')

      const file = new File([blob], `${displayOrderId}.png`, { type: 'image/png' })

      // Native share with file (Android Chrome + iOS Safari 15+)
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Order ${displayOrderId}` })
        return
      }

      // Desktop / unsupported browser → download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${displayOrderId}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Image saved — share it via WhatsApp or any app')
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Could not capture image. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="flex items-center justify-center gap-1.5 h-10 text-sm font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 active:scale-95 transition-transform disabled:opacity-50"
    >
      <Share2 size={15} />
      {loading ? 'Capturing…' : 'Share'}
    </button>
  )
}
