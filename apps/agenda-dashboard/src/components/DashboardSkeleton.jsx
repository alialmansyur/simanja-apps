import React from 'react';

const KPISkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[200px] flex-1 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-3 w-full">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
      </div>
      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0"></div>
    </div>
  </div>
);

const TimelineSkeleton = () => (
  <div className="w-full xl:w-80 2xl:w-96 bg-slate-50 dark:bg-slate-900/50 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0">
    <div className="p-4 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/80">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2 animate-pulse"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
    </div>
    <div className="flex-1 p-4 pb-8 space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative flex animate-pulse group">
          <div className="w-16 shrink-0 pt-0.5 text-right pr-4">
            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-8 ml-auto mb-1.5"></div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-6 ml-auto"></div>
          </div>
          <div className="relative flex flex-col items-center">
            <div className="z-10 w-3 h-3 mt-1.5 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700"></div>
            <div className="absolute top-4 bottom-[-1.5rem] w-px bg-slate-200 dark:bg-slate-700"></div>
          </div>
          <div className="flex-1 pl-4 pb-2">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CalendarSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex-1 flex flex-col min-h-[600px] animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
      <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
    </div>
    
    <div className="flex space-x-2 mb-6">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
      ))}
    </div>

    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
        {/* Headers */}
        {Array(7).fill(0).map((_, i) => (
          <div key={`h${i}`} className="h-10 bg-white dark:bg-slate-800"></div>
        ))}
        {/* Cells */}
        {Array(35).fill(0).map((_, i) => (
          <div key={`c${i}`} className="h-24 bg-white dark:bg-slate-800 p-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-6 mb-2"></div>
            {i % 8 === 0 && <div className="h-4 bg-blue-100 dark:bg-blue-900/40 rounded w-full"></div>}
            {i % 12 === 0 && <div className="h-4 bg-emerald-100 dark:bg-emerald-900/40 rounded w-full mt-1"></div>}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DashboardSkeletonMain = () => (
  <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 scrollbar-hide w-full xl:w-auto">
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div>
          <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-6">
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
        </div>
      </div>
      <CalendarSkeleton />
    </div>
  </main>
);

export const DashboardSkeletonSidebar = TimelineSkeleton;
