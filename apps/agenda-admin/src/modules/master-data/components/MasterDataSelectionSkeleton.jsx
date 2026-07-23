import React from 'react';

const MasterDataSelectionSkeleton = () => {
  return (
    <section className="mx-auto flex min-h-[72vh] w-full max-w-5xl flex-col justify-center px-2 py-6 sm:px-4 lg:px-8 xl:px-10">
      <div className="mb-6 animate-pulse text-center">
        <div className="mx-auto h-7 w-52 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mx-auto mt-3 h-4 w-72 max-w-full rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.25em] bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80"
          >
            <div className="animate-pulse">
              <div className="h-12 w-12 rounded-[1em] bg-slate-200 dark:bg-slate-800" />
              <div className="mt-4 h-5 w-36 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MasterDataSelectionSkeleton;
