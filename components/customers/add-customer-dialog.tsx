'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export function AddCustomerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({ name: '', mobile: '', address: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (form.mobile && form.mobile.length !== 10) { toast.error('Mobile number must be 10 digits'); return }
    setLoading(true)
    const { error } = await supabase
      .from('customers')
      .insert({ name: form.name.trim(), mobile: form.mobile || null, address: form.address || null })
    setLoading(false)
    if (error) { console.error('Add customer error:', error); toast.error(error.message ?? 'Failed to add customer'); return }
    toast.success(`${form.name} added!`)
    setForm({ name: '', mobile: '', address: '' })
    onOpenChange(false)
    router.refresh()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white border border-gray-100 shadow-xl ring-0 p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900">Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Name</Label>
              <Input placeholder="Customer name" value={form.name} onChange={e => set('name', e.target.value)} className="h-11 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mobile</Label>
              <Input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} placeholder="Mobile number (optional)" value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Address</Label>
              <Input placeholder="Address (optional)" value={form.address} onChange={e => set('address', e.target.value)} className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 font-bold bg-blue-600 hover:bg-blue-700" disabled={loading || !form.name.trim()}>
              {loading ? 'Adding...' : 'Add Customer'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
