import React from 'react';

const AgendaUnitSelectionSkeleton = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-[1.25em] bg-white p-4 animate-pulse shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80"
          >
            <div className="h-14 w-14 shrink-0 rounded-[1.1em] bg-slate-100 dark:bg-slate-800" />
            <div className="min-w-0 flex-1">
              <div className="h-3 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="mt-3 h-4 w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgendaUnitSelectionSkeleton;
