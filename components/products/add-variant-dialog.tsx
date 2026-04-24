'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  productId: string
  productName: string
}

export function AddVariantDialog({ productId, productName }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ variant_name: '', bottles_per_case: '24', price_per_case: '', free_bottles_per_case: '0' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.variant_name.trim() || !form.price_per_case) return
    setLoading(true)
    const { error } = await supabase.from('product_variants').insert({
      product_id: productId,
      variant_name: form.variant_name.trim(),
      bottles_per_case: parseInt(form.bottles_per_case),
      price_per_case: parseFloat(form.price_per_case),
      free_bottles_per_case: parseInt(form.free_bottles_per_case),
    })
    setLoading(false)
    if (error) { toast.error('Error adding variant'); return }
    toast.success(`${form.variant_name} added to ${productName}`)
    setForm({ variant_name: '', bottles_per_case: '24', price_per_case: '', free_bottles_per_case: '0' })
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 active:scale-95 transition-transform"
      >
        <Plus size={12} strokeWidth={2.5} />
        Variant
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-gray-100 shadow-xl ring-0 p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900">Add Variant — {productName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Variant Name</Label>
              <Input placeholder="e.g. 500ml" value={form.variant_name} onChange={e => set('variant_name', e.target.value)} className="h-11 text-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Bottles / Case</Label>
                <Input type="number" min="1" value={form.bottles_per_case} onChange={e => set('bottles_per_case', e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Price / Case (₹)</Label>
                <Input type="number" min="0" step="0.01" placeholder="480" value={form.price_per_case} onChange={e => set('price_per_case', e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Free Bottles / Case (Scheme)</Label>
              <Input type="number" min="0" value={form.free_bottles_per_case} onChange={e => set('free_bottles_per_case', e.target.value)} className="h-11" />
              <p className="text-xs text-gray-400">Enter 0 if no scheme</p>
            </div>
            <Button type="submit" className="w-full h-11 font-bold bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Adding...' : 'Add Variant'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
