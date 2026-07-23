import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../components/ui/Button';
import { masterDataModules } from '../data/masterDataCatalog';
import MasterDataSelectionSkeleton from './MasterDataSelectionSkeleton';

const MasterDataSelection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <MasterDataSelectionSkeleton />;
  }

  return (
    <section className="mx-auto flex min-h-[72vh] w-full max-w-5xl flex-col justify-center px-2 py-6 sm:px-4 lg:px-8 xl:px-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-blue-100 via-sky-50 to-white shadow-sm ring-1 ring-blue-100 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 dark:ring-blue-900/50">
          <svg
            viewBox="0 0 120 120"
            className="h-16 w-16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="22" y="28" width="50" height="64" rx="12" className="fill-blue-600 dark:fill-blue-400" />
            <rect x="31" y="42" width="32" height="5" rx="2.5" className="fill-white/90 dark:fill-slate-950/80" />
            <rect x="31" y="54" width="22" height="5" rx="2.5" className="fill-white/75 dark:fill-slate-950/60" />
            <rect x="31" y="66" width="26" height="5" rx="2.5" className="fill-white/75 dark:fill-slate-950/60" />
            <path
              d="M74 40h10c7.732 0 14 6.268 14 14v24c0 7.732-6.268 14-14 14H66"
              className="stroke-sky-400 dark:stroke-sky-300"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="85" cy="35" r="8" className="fill-amber-400 dark:fill-amber-300" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 sm:text-[1.75rem]">
          Pilih Master Data
        </h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 sm:text-base font-medium">
          Pilih jenis master data untuk masuk ke halaman pengelolaan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {masterDataModules.map((module) => {
          const Icon = module.icon;

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => navigate(`/admin/master-data/${module.id}`)}
              className={cn(
                'group flex cursor-pointer items-center gap-4 rounded-[1.25em] bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:bg-blue-50/60 hover:shadow-md hover:ring-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-900 dark:ring-slate-800/80 dark:hover:bg-slate-800/80 dark:hover:ring-blue-900/60'
              )}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1em] bg-blue-100 dark:bg-blue-950/40">
                <Icon size={24} className="text-blue-600 transition duration-200 group-hover:-rotate-6 dark:text-blue-300" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 transition duration-200 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400">
                  {module.code}
                </p>
                <h3 className="mt-1 text-sm font-bold leading-6 text-slate-900 transition duration-200 group-hover:text-blue-700 dark:text-slate-50 dark:group-hover:text-blue-300 sm:text-base">
                  {module.title}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MasterDataSelection;
