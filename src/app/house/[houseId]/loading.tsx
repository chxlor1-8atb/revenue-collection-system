export default function HouseLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-center gap-12 lg:gap-24 relative overflow-hidden font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="h-6 w-36 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-48 bg-slate-100 rounded-md"></div>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
        </div>

        {/* Amount Box Skeleton */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
          <div className="h-10 w-40 bg-slate-300 rounded-xl"></div>
        </div>

        {/* Invoice List Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
          <div className="h-16 w-full bg-slate-100 rounded-2xl"></div>
          <div className="h-16 w-full bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}