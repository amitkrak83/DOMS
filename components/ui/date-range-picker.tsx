'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

function toYMD(d: Date) {
  return d.toISOString().split('T')[0]
}

function display(ymd: string) {
  return new Date(ymd + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function DateRangePicker({ from, to, onChange }: Props) {
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [hovered, setHovered] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(ymd: string) {
    if (!from || (from && to)) {
      onChange(ymd, '')
    } else {
      if (ymd < from) {
        onChange(ymd, from)
      } else {
        onChange(from, ymd)
      }
      setOpen(false)
    }
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('', '')
    setHovered(null)
  }

  const hasRange = from || to
  const label = from && to
    ? `${display(from)} → ${display(to)}`
    : from ? `From ${display(from)}` : 'Filter by date'

  // build calendar grid — only recomputes when month/year changes
  const cells = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth)
    const startDay = firstDayOfMonth(viewYear, viewMonth)
    const result: (string | null)[] = Array(startDay).fill(null)
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      result.push(`${viewYear}-${mm}-${dd}`)
    }
    while (result.length % 7 !== 0) result.push(null)
    return result
  }, [viewYear, viewMonth])

  const monthName = useMemo(
    () => new Date(viewYear, viewMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    [viewYear, viewMonth]
  )

  // effective "to" for hover preview
  const effectiveTo = from && !to ? (hovered && hovered >= from ? hovered : null) : to

  function dayState(ymd: string | null) {
    if (!ymd) return 'empty'
    const lo = from && effectiveTo ? (from < effectiveTo ? from : effectiveTo) : from
    const hi = from && effectiveTo ? (from < effectiveTo ? effectiveTo : from) : null
    if (ymd === from && ymd === to) return 'single'
    if (ymd === lo) return 'start'
    if (ymd === hi) return 'end'
    if (lo && hi && ymd > lo && ymd < hi) return 'mid'
    return 'none'
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full h-11 px-3 flex items-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
          hasRange ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-500'
        }`}
      >
        <Calendar size={16} className="shrink-0" />
        <span className="flex-1 text-left text-xs font-bold">{label}</span>
        {hasRange && (
          <span onClick={clear} className="text-blue-400 hover:text-blue-600 p-0.5">
            <X size={14} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-gray-900">{monthName}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((ymd, i) => {
              const state = dayState(ymd)
              const isToday = ymd === toYMD(today)
              return (
                <div
                  key={i}
                  className={`relative flex items-center justify-center h-9 text-xs font-semibold cursor-pointer select-none
                    ${state === 'mid' ? 'bg-blue-100 text-blue-800' : ''}
                    ${state === 'start' ? 'rounded-l-full bg-blue-100' : ''}
                    ${state === 'end' ? 'rounded-r-full bg-blue-100' : ''}
                  `}
                  onClick={() => ymd && handleDayClick(ymd)}
                  onMouseEnter={() => setHovered(ymd)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {ymd && (
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs
                      ${state === 'start' || state === 'end' || state === 'single'
                        ? 'bg-blue-600 text-white font-bold'
                        : isToday
                        ? 'ring-2 ring-blue-400 text-blue-700'
                        : 'hover:bg-gray-100 text-gray-700'}
                    `}>
                      {parseInt(ymd.split('-')[2])}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {from && !to && (
            <p className="text-[10px] text-gray-400 text-center mt-2">Tap end date</p>
          )}
        </div>
      )}
    </div>
  )
}
