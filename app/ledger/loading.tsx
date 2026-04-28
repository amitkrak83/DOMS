import { PageHeader } from '@/components/page-header'

export default function LedgerLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-pulse">
      <div className="sticky top-0 z-30 bg-white">
        <PageHeader title="Khata" />
      </div>

      {/* Search bar */}
      <div className="sticky top-16 z-20 bg-white px-4 pt-3 pb-3 border-b border-gray-100 shadow-sm">
        <div className="h-11 bg-gray-100 rounded-xl" />
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Total udhar banner */}
        <div className="bg-white rounded-xl border-l-4 border-gray-200 shadow-sm px-4 py-3 space-y-2">
          <div className="h-2.5 w-20 bg-gray-200 rounded-md" />
          <div className="h-7 w-24 bg-gray-200 rounded-md" />
        </div>

        {/* Customer cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="h-4 w-28 bg-gray-200 rounded-md" />
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="px-4 py-2 flex gap-4">
              <div className="h-3 w-20 bg-gray-100 rounded-md" />
              <div className="h-3 w-16 bg-gray-100 rounded-md" />
            </div>
            {[1, 2].map(j => (
              <div key={j} className="flex justify-between px-4 py-3 border-t border-gray-50">
                <div className="h-3 w-16 bg-gray-100 rounded-md" />
                <div className="h-3 w-14 bg-gray-200 rounded-md" />
                <div className="h-5 w-16 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
