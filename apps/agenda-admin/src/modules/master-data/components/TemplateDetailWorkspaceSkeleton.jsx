import React from 'react';

const TemplateDetailWorkspaceSkeleton = () => {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Editor Skeleton - Header */}
      <div className="rounded-[1.5em] border border-slate-200 bg-white p-6 md:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 h-6 w-48 border-b border-slate-100 pb-4 dark:border-slate-800 rounded bg-slate-200 dark:bg-slate-800"></div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6 last:mb-0">
            <div className="mb-2 h-4 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-32 w-full rounded-[0.5em] bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"></div>
          </div>
        ))}
      </div>

      {/* Editor Skeleton - Body */}
      <div className="rounded-[1.5em] border border-slate-200 bg-white p-6 md:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 h-6 w-48 border-b border-slate-100 pb-4 dark:border-slate-800 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-64 w-full rounded-[0.5em] bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"></div>
      </div>
    </div>
  );
};

export default TemplateDetailWorkspaceSkeleton;
