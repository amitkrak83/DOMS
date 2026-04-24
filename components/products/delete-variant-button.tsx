'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteVariantButton({ variantId }: { variantId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this variant?')) return
    setLoading(true)
    const { error } = await supabase.from('product_variants').delete().eq('id', variantId)
    setLoading(false)
    if (error) { toast.error('Cannot delete — variant may be used in existing orders'); return }
    toast.success('Variant deleted')
    router.refresh()
  }

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={handleDelete} disabled={loading}>
      <Trash2 size={14} />
    </Button>
  )
}
