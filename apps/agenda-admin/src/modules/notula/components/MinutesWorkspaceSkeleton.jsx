import React from 'react';

const MinutesWorkspaceSkeleton = () => {
  return (
    <div className="animate-pulse grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Editor Skeleton */}
      <div className="flex min-h-[600px] flex-col rounded-[1.25em] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="h-10 w-full max-w-sm rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
        <div className="flex items-center gap-2 border-b border-slate-100 p-3 dark:border-slate-800">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800/60"></div>
          ))}
        </div>
        <div className="flex-1 p-8 space-y-4">
          <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800/60"></div>
          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60"></div>
          <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60"></div>
          <div className="h-4 w-4/6 rounded bg-slate-100 dark:bg-slate-800/60"></div>
        </div>
      </div>

      {/* Metadata Sidebar Skeleton */}
      <div className="space-y-6">
        <div className="rounded-[1.25em] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800/60"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.25em] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinutesWorkspaceSkeleton;
