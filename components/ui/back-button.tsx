'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()
  return (
    <button onClick={() => router.back()} className="text-gray-500 shrink-0">
      <ArrowLeft size={20} />
    </button>
  )
}
