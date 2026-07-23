import React from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, Sparkles } from 'lucide-react';
import { cn } from '../components/ui/Button';

const metricThemes = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  amber: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  violet: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const MetricCard = ({ item }) => (
  <div className="rounded-[1.25em] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4">
      <div className={cn('rounded-[1.15em] p-3', metricThemes[item.theme] ?? metricThemes.blue)}>
        <item.icon size={20} />
      </div>
      <ArrowUpRight size={18} className="text-slate-300 dark:text-slate-600" />
    </div>
    <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.caption}</p>
  </div>
);

const FeaturePageShell = ({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  metrics,
  priorities,
  checklist,
}) => {
  return (
    <div className="space-y-6 md:space-y-7">
      <section className="overflow-hidden rounded-[1.25em] border border-slate-200 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-[2rem]">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              {description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25em] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Aksi utama</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{primaryAction}</p>
            </div>
            <div className="rounded-[1.25em] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Aksi lanjutan</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{secondaryAction}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Ringkasan utama</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-[1.25em] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-[1.15em] bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Prioritas pengembangan</h2>
              <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">Fondasi halaman ini sudah disiapkan untuk implementasi data dan aksi nyata.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {priorities.map((item, index) => (
              <div
                key={item}
                className="rounded-[1.25em] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Prioritas {index + 1}
                </p>
                <p className="mt-2 font-medium leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.25em] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Checklist modul</h2>
            <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">Item kerja yang umumnya dibutuhkan saat modul mulai dikembangkan.</p>
          </div>
          <ul className="space-y-3">
            {checklist.map((item, index) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-[1.25em] border border-slate-200 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                {index < 2 ? (
                  <Clock3 size={17} className="mt-0.5 shrink-0 text-orange-500 dark:text-orange-400" />
                ) : (
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                )}
                <span className="leading-6">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default FeaturePageShell;
