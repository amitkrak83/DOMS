'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${productName}" and all its variants?`)) return
    setLoading(true)
    const { error } = await supabase.from('products').delete().eq('id', productId)
    setLoading(false)
    if (error) { toast.error('Cannot delete — product is used in existing orders'); return }
    toast.success(`${productName} deleted`)
    router.refresh()
  }

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={loading}>
      <Trash2 size={14} />
    </Button>
  )
}
