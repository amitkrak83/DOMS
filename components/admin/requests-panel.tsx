'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Mail, Inbox } from 'lucide-react'

type Request = {
  id: string
  email: string
  requested_at: string
  status: string
}

export function RequestsPanel({ initialRequests }: { initialRequests: Request[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)

  async function approve(req: Request) {
    setLoading(req.id + '-approve')
    const { error } = await supabase
      .from('allowed_emails')
      .insert({ email: req.email })
    if (error && error.code !== '23505') {
      toast.error('Failed to approve')
      setLoading(null)
      return
    }
    await supabase.from('access_requests').update({ status: 'approved' }).eq('id', req.id)
    setLoading(null)
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
    toast.success(`${req.email} approved — they can now log in`)
  }

  async function reject(req: Request) {
    setLoading(req.id + '-reject')
    await supabase.from('access_requests').update({ status: 'rejected' }).eq('id', req.id)
    setLoading(null)
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r))
    toast.success(`${req.email} rejected`)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const done = requests.filter(r => r.status !== 'pending')

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
        <Inbox size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No access requests yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
            Pending ({pending.length})
          </p>
          {pending.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Mail size={15} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{req.email}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(req.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => approve(req)}
                  disabled={!!loading}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                  title="Approve"
                >
                  <CheckCircle2 size={18} />
                </button>
                <button
                  onClick={() => reject(req)}
                  disabled={!!loading}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  title="Reject"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
            Resolved ({done.length})
          </p>
          {done.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 opacity-60">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${req.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                {req.status === 'approved'
                  ? <CheckCircle2 size={15} className="text-green-600" />
                  : <XCircle size={15} className="text-red-500" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{req.email}</p>
                <p className="text-xs text-gray-400 capitalize">{req.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
