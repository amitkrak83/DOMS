import { PageHeader } from '@/components/page-header'

export default function CustomersLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-pulse">
      <PageHeader title="Customers" />

      <div className="sticky top-16 z-20 bg-white px-4 pt-3 pb-3 border-b border-gray-100 shadow-sm">
        <div className="h-11 bg-gray-100 rounded-xl" />
      </div>

      <div className="px-4 pt-4 space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
              <div className="space-y-2">
                <div className="h-3.5 w-28 bg-gray-200 rounded-md" />
                <div className="h-2.5 w-36 bg-gray-100 rounded-md" />
              </div>
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-8 rounded-lg bg-gray-100" />
              <div className="w-8 h-8 rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
