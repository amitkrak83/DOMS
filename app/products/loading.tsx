import { PageHeader } from '@/components/page-header'

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-pulse">
      <PageHeader title="Products" />

      <div className="px-4 pt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="h-4 w-24 bg-gray-200 rounded-md" />
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-100" />
                <div className="w-7 h-7 rounded-lg bg-gray-100" />
              </div>
            </div>
            {[1, 2].map(j => (
              <div key={j} className="flex justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="h-3 w-20 bg-gray-100 rounded-md" />
                <div className="h-3 w-14 bg-gray-100 rounded-md" />
                <div className="h-3 w-14 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
