import Image from 'next/image'
import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { RequestAccessButton } from './request-access-button'

export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image src="/icon.png" alt="DOMS" width={80} height={80} className="rounded-2xl shadow-md opacity-60" />
          <h1 className="text-2xl font-bold text-gray-900">DOMS</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 space-y-4">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldX size={28} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-bold text-gray-900">Access Restricted</p>
            {email && (
              <p className="text-xs font-medium text-gray-500 bg-gray-50 rounded-lg px-3 py-2 break-all">
                {email}
              </p>
            )}
            <p className="text-sm text-gray-500 leading-relaxed">
              This account is not authorized to access DOMS.
              Please contact <span className="font-bold text-gray-700">Amit</span> to enable your account.
            </p>
          </div>
          <RequestAccessButton email={email ?? ''} />
        </div>

        <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to login
        </Link>
      </div>
    </div>
  )
}
