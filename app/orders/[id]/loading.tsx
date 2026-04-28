import { BackButton } from '@/components/ui/back-button'

export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="h-5 w-28 bg-gray-200 rounded-md" />
        </div>
        <div className="h-7 w-20 bg-gray-100 rounded-lg" />
      </div>

      {/* Action buttons */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 grid grid-cols-2 gap-2">
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Customer card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
          {[80, 120, 100, 140].map((w, i) => (
            <div key={i} className="grid grid-cols-[100px_1fr] gap-y-2">
              <div className="h-3.5 w-16 bg-gray-100 rounded-md" />
              <div className={`h-3.5 bg-gray-200 rounded-md`} style={{ width: w }} />
            </div>
          ))}
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-11 bg-gray-50 border-b border-gray-100" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between px-4 py-3.5 border-b border-gray-50 last:border-0">
              <div className="space-y-1.5">
                <div className="h-3.5 w-24 bg-gray-200 rounded-md" />
                <div className="h-2.5 w-16 bg-gray-100 rounded-md" />
              </div>
              <div className="h-3.5 w-12 bg-gray-200 rounded-md" />
            </div>
          ))}
        </div>

        {/* Summary card */}
        <div className="bg-gray-50 rounded-xl border-l-4 border-gray-200 p-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-3.5 w-24 bg-gray-200 rounded-md" />
            <div className="h-3.5 w-16 bg-gray-200 rounded-md" />
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded-md" />
            <div className="h-4 w-20 bg-gray-300 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
