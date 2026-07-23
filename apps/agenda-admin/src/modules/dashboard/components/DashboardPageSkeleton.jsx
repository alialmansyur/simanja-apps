import React from 'react';

const DashboardPageSkeleton = () => {
  return (
    <div className="overflow-hidden bg-slate-100 dark:bg-slate-950">
      <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-600 px-4 py-3 dark:border-blue-900/60 dark:bg-[#101d4f] sm:px-6">
        <div className="h-5 w-5 rounded-full bg-blue-400/70 animate-pulse" />
        <div className="h-4 w-64 rounded-full bg-blue-400/70 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_23rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 xl:py-6">
          <div className="mb-6 grid w-full gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[var(--radius-card)] bg-white shadow-sm ring-1 ring-slate-100 px-5 py-4 animate-pulse dark:bg-slate-900/90 dark:ring-slate-800/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-4 h-10 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="h-10 w-10 rounded-[1rem] bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[1.5em] bg-white shadow-sm ring-1 ring-slate-100 p-5 dark:bg-slate-900 dark:ring-slate-800/80 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex gap-2">
                <div className="h-11 w-24 rounded-[1rem] bg-slate-100 animate-pulse dark:bg-slate-800" />
                <div className="h-11 w-11 rounded-[1rem] bg-slate-100 animate-pulse dark:bg-slate-800" />
                <div className="h-11 w-11 rounded-[1rem] bg-slate-100 animate-pulse dark:bg-slate-800" />
              </div>
              <div className="h-11 w-56 rounded-[1rem] bg-slate-100 animate-pulse dark:bg-slate-800" />
              <div className="h-11 w-48 rounded-[1rem] bg-slate-100 animate-pulse dark:bg-slate-800" />
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="h-11 w-full rounded-[1rem] bg-slate-100 animate-pulse dark:bg-slate-800 lg:max-w-sm" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 w-20 rounded-full bg-slate-100 animate-pulse dark:bg-slate-800"
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.25em] border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-11 bg-slate-50 animate-pulse dark:bg-slate-800/70"
                  />
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: 35 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 border-r border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="h-4 w-6 rounded-full bg-slate-100 animate-pulse dark:bg-slate-800" />
                    {index % 8 === 0 ? (
                      <div className="mt-3 h-4 w-full rounded-full bg-blue-100 animate-pulse dark:bg-blue-950/40" />
                    ) : null}
                    {index % 12 === 0 ? (
                      <div className="mt-2 h-4 w-4/5 rounded-full bg-emerald-100 animate-pulse dark:bg-emerald-950/40" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:col-start-2 lg:row-start-1 lg:border-l lg:border-t-0 dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-5 py-5 xl:px-6 dark:border-slate-800">
            <div className="h-9 w-44 rounded-full bg-slate-200 animate-pulse dark:bg-slate-700" />
            <div className="mt-3 h-4 w-52 rounded-full bg-slate-200 animate-pulse dark:bg-slate-700" />
          </div>

          <div className="flex-1 px-5 py-4 xl:px-6">
            <div className="mb-5 rounded-[var(--radius-card)] border border-blue-500/30 bg-blue-600 px-4 py-4 animate-pulse">
              <div className="h-3 w-32 rounded-full bg-blue-300/70" />
              <div className="mt-4 h-8 w-28 rounded-full bg-blue-300/70" />
              <div className="mt-3 h-5 w-11/12 rounded-full bg-blue-300/70" />
              <div className="mt-3 h-4 w-32 rounded-full bg-blue-300/70" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="grid grid-cols-[1.1rem_minmax(0,1fr)] items-start gap-4">
                  <div className="relative flex justify-center self-stretch">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-slate-200 dark:bg-slate-700" />
                    <div className="relative mt-3 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="mb-3 rounded-[var(--radius-card)] border border-slate-200 bg-white px-4 py-3.5 animate-pulse dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-3 h-5 w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-3 h-4 w-32 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardPageSkeleton;
