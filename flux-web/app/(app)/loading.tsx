export default function Loading() {
  return (
    <div className="animate-fade-in px-4 pt-6 space-y-4 max-w-lg mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="skeleton h-4 w-24 rounded-lg" />
          <div className="skeleton h-7 w-40 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-10 rounded-2xl" />
      </div>

      {/* Card skeleton */}
      <div className="skeleton h-36 w-full rounded-3xl" />

      {/* Two-col grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-28 rounded-3xl" />
        <div className="skeleton h-28 rounded-3xl" />
      </div>

      {/* List items skeleton */}
      <div className="space-y-2 pt-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="skeleton h-9 w-9 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 rounded-md" style={{ width: `${55 + (i * 13) % 30}%` }} />
              <div className="skeleton h-3 rounded-md w-24" />
            </div>
            <div className="skeleton h-4 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
