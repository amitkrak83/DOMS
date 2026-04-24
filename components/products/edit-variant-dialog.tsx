'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  variant: {
    id: string
    variant_name: string
    bottles_per_case: number
    price_per_case: number
    free_bottles_per_case: number
  }
}

export function EditVariantDialog({ variant }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    variant_name: variant.variant_name,
    bottles_per_case: variant.bottles_per_case.toString(),
    price_per_case: variant.price_per_case.toString(),
    free_bottles_per_case: variant.free_bottles_per_case.toString()
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.variant_name.trim() || !form.price_per_case) return
    setLoading(true)
    const { error } = await supabase
      .from('product_variants')
      .update({
        variant_name: form.variant_name.trim(),
        bottles_per_case: parseInt(form.bottles_per_case),
        price_per_case: parseFloat(form.price_per_case),
        free_bottles_per_case: parseInt(form.free_bottles_per_case),
      })
      .eq('id', variant.id)
    
    setLoading(false)
    if (error) {
      toast.error('Error updating variant')
      return
    }
    toast.success(`${form.variant_name} updated`)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-gray-400 hover:text-blue-600"
        onClick={() => setOpen(true)}
      >
        <Pencil size={14} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Variant Name</Label>
              <Input
                placeholder="e.g. 500ml"
                value={form.variant_name}
                onChange={e => set('variant_name', e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Bottles per Case</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.bottles_per_case}
                  onChange={e => set('bottles_per_case', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Price per Case (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="480"
                  value={form.price_per_case}
                  onChange={e => set('price_per_case', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Free Bottles per Paid Case (Scheme)</Label>
              <Input
                type="number"
                min="0"
                value={form.free_bottles_per_case}
                onChange={e => set('free_bottles_per_case', e.target.value)}
              />
              <p className="text-xs text-gray-400">Enter 0 if no scheme</p>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Updating...' : 'Update Variant'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
