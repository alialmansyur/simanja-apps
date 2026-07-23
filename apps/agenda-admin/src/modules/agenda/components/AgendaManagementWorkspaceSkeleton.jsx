import React from 'react';

const AgendaManagementWorkspaceSkeleton = () => {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-950/40">
              <tr>
                {Array.from({ length: 6 }).map((_, index) => (
                  <th key={index} className="px-5 py-3">
                    <div className="h-4 w-20 rounded-full bg-slate-200 animate-pulse dark:bg-slate-800" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-200 dark:border-slate-800">
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-4">
                      <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse dark:bg-slate-800" />
                      {cellIndex === 0 ? (
                        <div className="mt-2 h-3 w-24 rounded-full bg-slate-100 animate-pulse dark:bg-slate-800/70" />
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between animate-pulse">
          <div className="h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-[0.9em] bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-20 rounded-[0.9em] bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-10 rounded-[0.9em] bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
    </div>
  );
};

export default AgendaManagementWorkspaceSkeleton;
