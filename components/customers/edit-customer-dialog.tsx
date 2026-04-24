'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Customer } from './customers-list'

type Props = {
  customer: Customer
  onUpdated: (updated: Customer) => void
}

export function EditCustomerDialog({ customer, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: customer.name, mobile: customer.mobile ?? '', address: customer.address ?? '' })
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .update({ name: form.name.trim(), mobile: form.mobile || null, address: form.address || null })
      .eq('id', customer.id)
      .select()
      .single()
    setLoading(false)
    if (error) { toast.error('Failed to update customer'); return }
    toast.success('Customer updated')
    onUpdated({ ...customer, ...data })
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Pencil size={15} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-gray-100 shadow-xl ring-0 p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900">Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Name</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} className="h-11" placeholder="Customer name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mobile</Label>
              <Input value={form.mobile} onChange={e => set('mobile', e.target.value)} className="h-11" placeholder="Mobile number" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Address</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} className="h-11" placeholder="Address" />
            </div>
            <Button type="submit" className="w-full h-11 font-bold bg-blue-600 hover:bg-blue-700" disabled={loading || !form.name.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
