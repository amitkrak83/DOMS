'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Plus, Trash2, Mail, CheckCircle2, Clock } from 'lucide-react'

type AllowedEmail = {
  email: string
  added_at: string
}

export function AllowedEmailsPanel({
  initialEmails,
  activeEmails,
  superAdminEmail,
}: {
  initialEmails: AllowedEmail[]
  activeEmails: Set<string>
  superAdminEmail: string
}) {
  const [emails, setEmails] = useState(initialEmails)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  async function addEmail() {
    const email = input.trim().toLowerCase()
    if (!email || !email.includes('@')) { toast.error('Enter a valid email'); return }
    if (emails.some(e => e.email === email)) { toast.error('Already in the list'); return }

    setAdding(true)
    const { error } = await supabase
      .from('allowed_emails')
      .insert({ email, added_by: superAdminEmail })
    setAdding(false)
    if (error) { toast.error('Failed to add email'); return }
    setEmails(prev => [{ email, added_at: new Date().toISOString() }, ...prev])
    setInput('')
    toast.success(`${email} can now access DOMS`)
  }

  async function removeEmail(email: string) {
    if (email === superAdminEmail) { toast.error('Cannot remove super-admin'); return }
    if (!confirm(`Remove ${email} from the whitelist?`)) return
    setRemoving(email)
    const { error } = await supabase.from('allowed_emails').delete().eq('email', email)
    setRemoving(null)
    if (error) { toast.error('Failed to remove email'); return }
    setEmails(prev => prev.filter(e => e.email !== email))
    toast.success(`${email} removed`)
  }

  return (
    <div className="space-y-4">
      {/* Add email */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-bold text-gray-700">Add Email</p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="user@gmail.com"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addEmail() }}
            className="flex-1 h-11 px-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          />
          <button
            onClick={addEmail}
            disabled={adding}
            className="h-11 px-4 bg-blue-600 text-white font-bold text-sm rounded-xl disabled:opacity-40 flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Email list */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
          {emails.length} allowed email{emails.length !== 1 ? 's' : ''}
        </p>
        {emails.map(({ email, added_at }) => {
          const isActive = activeEmails.has(email)
          return (
            <div key={email} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <Mail size={15} className={isActive ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{email}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isActive
                      ? <><CheckCircle2 size={11} className="text-green-500" /><span className="text-[10px] text-green-600 font-medium">Active</span></>
                      : <><Clock size={11} className="text-gray-400" /><span className="text-[10px] text-gray-400 font-medium">Pending signup</span></>
                    }
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeEmail(email)}
                disabled={removing === email || email === superAdminEmail}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        })}
        {emails.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
            <p className="text-sm text-gray-400">No emails in the whitelist</p>
          </div>
        )}
      </div>
    </div>
  )
}
