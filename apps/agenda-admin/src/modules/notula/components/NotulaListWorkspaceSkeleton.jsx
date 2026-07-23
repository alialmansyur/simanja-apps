import React from 'react';

const NotulaListWorkspaceSkeleton = () => {
  return (
    <div className="w-full">
      {/* Grid Content Skeleton */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-[1.25em] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            
            <div className="space-y-3">
              <div className="h-6 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/2 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-2/3 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="h-5 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default NotulaListWorkspaceSkeleton;
