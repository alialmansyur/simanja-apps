import React from 'react';

const RoomDetailWorkspaceSkeleton = () => {
  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      {/* Header Skeleton */}
      <section className="mb-6 animate-pulse">
        <div className="mb-4">
          <div className="h-9 w-24 rounded-[1em] bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          <div className="h-7 w-64 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-96 rounded-full bg-slate-100 dark:bg-slate-800/60" />
        </div>
      </section>

      {/* Main Content Skeleton */}
      <section className="grid gap-6 lg:grid-cols-12 animate-pulse">
        {/* Left Column (col-4) */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-[1.25em] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>

          <div className="rounded-[1.25em] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="h-6 w-40 mb-4 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-4">
              {[1, 2].map((item) => (
                <div key={item} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (col-8) */}
        <div className="lg:col-span-8">
          <div className="rounded-[1.25em] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800/90 dark:ring-slate-800/80 xl:p-8">
            {/* Header: Title and Search */}
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="h-8 w-64 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-12 w-full lg:w-80 rounded-[1rem] bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Categories */}
            <div className="mb-7 flex flex-wrap items-center gap-4">
              <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex gap-4">
                <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>

            {/* Calendar Shell */}
            <div className="rounded-[1.25em] bg-slate-50 p-5 dark:bg-slate-900">
              {/* Toolbar */}
              <div className="mb-6 flex flex-col items-center justify-between gap-4 xl:flex-row">
                <div className="h-12 w-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-8 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-12 w-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Grid */}
              <div className="h-[520px] rounded-[1em] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <div className="grid h-full grid-cols-7 grid-rows-[auto_1fr_1fr_1fr_1fr_1fr] divide-x divide-y divide-slate-200 dark:divide-slate-800">
                  {/* Days Header */}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={`header-${i}`} className="p-3 text-center">
                      <div className="mx-auto h-3 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ))}
                  {/* Calendar Cells */}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={`cell-${i}`} className="p-2">
                      <div className="h-3 w-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                      {i === 15 || i === 22 ? (
                        <div className="mt-2 h-6 w-full rounded-md bg-slate-200 dark:bg-slate-800" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RoomDetailWorkspaceSkeleton;
