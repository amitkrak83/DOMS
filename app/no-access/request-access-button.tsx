'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function RequestAccessButton({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'already'>('idle')

  async function handleRequest() {
    if (!email) return
    setStatus('loading')

    const { error } = await supabase
      .from('access_requests')
      .insert({ email })

    if (error?.code === '23505') {
      setStatus('already')
    } else if (error) {
      setStatus('idle')
    } else {
      setStatus('done')
    }
  }

  if (status === 'done' || status === 'already') {
    return (
      <div className="w-full h-11 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2 text-green-700 text-sm font-bold">
        <CheckCircle2 size={16} />
        {status === 'done' ? 'Request sent to Amit!' : 'Request already sent'}
      </div>
    )
  }

  return (
    <button
      onClick={handleRequest}
      disabled={status === 'loading' || !email}
      className="w-full h-11 bg-blue-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
    >
      {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
      Request Access from Amit
    </button>
  )
}
