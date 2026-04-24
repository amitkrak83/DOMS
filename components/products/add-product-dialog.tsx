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

export function AddProductDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { error } = await supabase.from('products').insert({ name: name.trim() })
    setLoading(false)
    if (error) { toast.error('Error adding product'); return }
    toast.success(`${name} added!`)
    setName('')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1 rounded-xl shadow-sm active:scale-95 transition-transform" onClick={() => setOpen(true)}>
        <Plus size={16} strokeWidth={2.5} />
        Add Product
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Product Name</Label>
            <Input placeholder="e.g. Sprite" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Product'}
          </Button>
        </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
