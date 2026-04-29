export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="px-4 py-4 space-y-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-gray-100" />
        ))}
      </div>
    </div>
  )
}
