'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function RealtimeSync({ tables = ['orders', 'payments'] }: { tables?: string[] }) {
  const router = useRouter()
  const routerRef = useRef(router)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep routerRef current without it being an effect dependency
  useEffect(() => {
    routerRef.current = router
  })

  useEffect(() => {
    const channel = supabase.channel('db-changes')

    tables.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        // Debounce: wait 800ms after last event before refreshing
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => routerRef.current.refresh(), 800)
      })
    })

    channel.subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — intentionally mount once

  return null
}
