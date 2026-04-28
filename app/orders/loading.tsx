import { PageHeader } from '@/components/page-header'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3.5 w-28 bg-gray-200 rounded-md" />
          <div className="h-2.5 w-20 bg-gray-100 rounded-md" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-3.5 w-14 bg-gray-200 rounded-md" />
        <div className="h-5 w-16 bg-gray-100 rounded-md" />
      </div>
    </div>
  )
}

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-pulse">
      <div className="sticky top-0 z-30 bg-white">
        <PageHeader title="Orders" />
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-white px-4 pt-3 pb-3 space-y-3 border-b border-gray-100 shadow-sm">
        <div className="h-11 bg-gray-100 rounded-xl" />
        <div className="h-9 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>

      <div className="px-4 pt-4 space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
