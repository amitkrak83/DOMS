import { PageHeader } from '@/components/page-header'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-pulse">
      <div className="sticky top-0 z-30 bg-gray-50">
        <PageHeader title="Dashboard" />

        {/* Stat cards */}
        <div className="px-4 pt-4 pb-3 grid grid-cols-2 gap-3">
          {['orange', 'green', 'blue', 'red'].map(c => (
            <div key={c} className="bg-white rounded-xl p-4 border-l-4 border-gray-200 shadow-sm space-y-2">
              <div className="h-2.5 w-20 bg-gray-200 rounded-md" />
              <div className="h-7 w-16 bg-gray-200 rounded-md" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 pb-1">
          <div className="h-4 w-28 bg-gray-200 rounded-md" />
          <div className="h-3.5 w-14 bg-gray-100 rounded-md" />
        </div>
      </div>

      {/* Order rows */}
      <div className="px-4 space-y-2.5 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-gray-200 rounded-md" />
                <div className="h-2.5 w-16 bg-gray-100 rounded-md" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-4 w-14 bg-gray-200 rounded-md" />
              <div className="h-5 w-16 bg-gray-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
