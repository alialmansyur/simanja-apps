import React, { useEffect, useState, useCallback } from 'react';
import { BriefcaseBusiness, AlertCircle, RefreshCw } from 'lucide-react';
import Button, { cn } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import AgendaUnitSelectionSkeleton from './AgendaUnitSelectionSkeleton';
import agendaService from '../services/agendaService';

const AgendaUnitSelection = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUnits = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await agendaService.getUnits({ per_page: 50 }); // Fetch all or paginated
      setUnits(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch units:', err);
      setError('Gagal memuat daftar unit kerja.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);


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
            <rect x="22" y="34" width="76" height="50" rx="16" className="fill-blue-600 dark:fill-blue-400" />
            <rect x="30" y="44" width="22" height="8" rx="4" className="fill-white/90 dark:fill-slate-950/80" />
            <rect x="30" y="58" width="60" height="5" rx="2.5" className="fill-white/75 dark:fill-slate-950/60" />
            <rect x="30" y="68" width="42" height="5" rx="2.5" className="fill-white/75 dark:fill-slate-950/60" />
            <path
              d="M46 34c0-8.837 7.163-16 16-16h0c8.837 0 16 7.163 16 16"
              className="stroke-sky-400 dark:stroke-sky-300"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="88" cy="28" r="8" className="fill-amber-400 dark:fill-amber-300" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 sm:text-[1.75rem]">
          Pilih Unit Kerja
        </h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 sm:text-base font-medium">
          Pilih unit atau tim kerja untuk masuk ke halaman manajemen kegiatan.
        </p>
        
        <div className="mt-4 flex justify-center">
          <Button
            variant="secondary"
            onClick={fetchUnits}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-[1em]"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={cn("text-slate-500 dark:text-slate-400", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <div className="w-full">
        {error && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-[1em] bg-red-50 p-4 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle size={20} />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}
        {isLoading ? (
          <AgendaUnitSelectionSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {units.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => navigate(`/admin/agenda/manage/${unit.uid}`)}
                className="group flex cursor-pointer items-center gap-4 rounded-[1.25em] bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:bg-blue-50/60 hover:shadow-md hover:ring-blue-100 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-900 dark:ring-slate-800/80 dark:hover:bg-slate-800/80 dark:hover:ring-blue-900/60"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1em] bg-blue-100 dark:bg-blue-950/40">
                  <BriefcaseBusiness
                    size={24}
                    className="text-blue-600 transition duration-200 group-hover:-rotate-6 dark:text-blue-300"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 transition duration-200 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400">
                    {unit.code}
                  </p>
                  <h3 className="mt-1 text-sm font-bold leading-6 text-slate-900 transition duration-200 group-hover:text-blue-700 dark:text-slate-50 dark:group-hover:text-blue-300 sm:text-base">
                    {unit.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AgendaUnitSelection;
