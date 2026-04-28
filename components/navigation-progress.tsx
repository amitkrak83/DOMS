'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [pct, setPct] = useState(0)
  const [show, setShow] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)

  // Intercept internal link clicks in capture phase → instant feedback
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (!href || href.startsWith('#') || /^https?:/.test(href) || href.startsWith('mailto')) return

      if (hideRef.current) clearTimeout(hideRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
      setShow(true)
      setPct(6)

      tickRef.current = setInterval(() => {
        setPct(p => {
          if (p >= 75) { clearInterval(tickRef.current!); tickRef.current = null; return 75 }
          return p + (75 - p) * 0.12
        })
      }, 180)
    }

    document.addEventListener('click', onLinkClick, true)
    return () => document.removeEventListener('click', onLinkClick, true)
  }, [])

  // pathname change = navigation complete; skip the initial mount run
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }

    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
    setPct(100)
    if (hideRef.current) clearTimeout(hideRef.current)
    hideRef.current = setTimeout(() => { setShow(false); setPct(0) }, 450)
  }, [pathname])

  if (!show) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        height: '3px',
        width: `${pct}%`,
        background: 'linear-gradient(to right, #1d4ed8, #60a5fa)',
        borderRadius: '0 2px 2px 0',
        transition: pct === 100
          ? 'width 0.1s ease, opacity 0.35s ease 0.1s'
          : 'width 0.18s ease',
        opacity: pct === 100 ? 0 : 1,
        pointerEvents: 'none',
      }}
    />
  )
}
