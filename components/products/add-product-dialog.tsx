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
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
      >
        <Plus size={18} strokeWidth={2.5} />
        Add Product
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-gray-100 shadow-xl ring-0 p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900">Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Product Name</Label>
              <Input placeholder="e.g. Sprite" value={name} onChange={e => setName(e.target.value)} className="h-11 text-base" />
            </div>
            <Button type="submit" className="w-full h-11 font-bold bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
