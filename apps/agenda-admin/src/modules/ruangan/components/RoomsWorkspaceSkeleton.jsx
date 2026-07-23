import React from 'react';

const RoomsWorkspaceSkeleton = () => {
  return (
    <div className="w-full">
      {/* Main Content Skeleton */}
      <section className="space-y-5">
        {/* Rooms Grid Skeleton */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-[1.25em] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="h-12 w-12 rounded-[1em] bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-6 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex gap-4">
                <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2 w-full">
                  <div className="h-4 w-1/2 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </section>
    </div>
  );
};

export default RoomsWorkspaceSkeleton;
