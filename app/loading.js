/**
 * Root-level loading skeleton shown while the main page is being rendered.
 * Displayed automatically by Next.js during route transitions.
 */
export default function Loading() {
  return (
    <main
      className="flex flex-col h-[100dvh] w-full bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8 animate-pulse"
      aria-label="Loading application"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <div className="h-8 w-40 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-56 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Chat panel skeleton */}
        <div className="hidden lg:flex w-[450px] flex-col h-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex-1 p-4 flex flex-col gap-4">
            <div className="h-4 w-3/4 bg-gray-200 rounded mx-auto mt-10" />
            <div className="h-4 w-1/2 bg-gray-100 rounded mx-auto" />
            <div className="flex gap-2 justify-center mt-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-8 w-28 bg-gray-200 rounded-full" />
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
              <div className="h-10 w-14 bg-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Map panel skeleton */}
        <div className="flex-1 bg-gray-200 rounded-2xl" />
      </div>
    </main>
  );
}
